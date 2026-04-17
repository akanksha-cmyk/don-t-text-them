import { IMessageSDK } from "@photon-ai/imessage-kit";
import Anthropic from "@anthropic-ai/sdk";
import { loadState, saveState, type AgentState } from "./state.js";

const sdk = new IMessageSDK({ debug: false });
const claude = new Anthropic();

// ─── Claude brain ─────────────────────────────────────────────────────────────

async function think(userMessage: string, state: AgentState): Promise<string> {
  const systemPrompt = `You are "Don't Text Them" — a brutally honest, warm iMessage accountability agent that helps the user resist texting their situationship.

You know everything about their situation:
${state.situationship ? `- Their situationship's name: ${state.situationship.name}` : "- No situationship registered yet"}
${state.situationship?.lastDrama ? `- Last drama: ${state.situationship.lastDrama}` : ""}
- Days clean (no texting them): ${state.daysClean}
- Total urges resisted: ${state.urgesResisted}
- Streak started: ${state.streakStart ? new Date(state.streakStart).toLocaleDateString() : "not started"}
- Their notes about the situationship: ${state.notes.join("; ") || "none yet"}

Your personality:
- You're like a wise best friend who's DONE watching them self-sabotage
- Funny, direct, occasionally sarcastic but always loving
- You remember context and call back to previous conversations
- You give concrete "urge surfing" tactics when they want to text
- You celebrate wins loudly
- You NEVER lecture more than once per urge — distract instead

Commands you handle:
- "register [name]" or "my situationship is [name]" → save their name
- "i want to text them" / "i'm about to text them" → INTERVENE with tactics
- "i texted them" / "i caved" → reset streak, be supportive not mean
- "why did we even stop" / "remind me" → roast the situationship based on their notes
- "add note: [thing]" → save a red flag or reason to their profile
- "stats" or "how am i doing" → give streak stats
- "distract me" → give a specific 5-minute activity
- anything else → be their supportive chaotic friend

Keep replies SHORT. Max 4 sentences. Use occasional emojis. Never be preachy.
For intervention responses, give ONE concrete tactic (not a list).`;

  const response = await claude.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 300,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  return response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");
}

// ─── State mutations based on message intent ─────────────────────────────────

function updateState(message: string, state: AgentState): AgentState {
  const lower = message.toLowerCase();

  // Register situationship
  const registerMatch =
    message.match(/(?:register|my situationship is|their name is)\s+(\w+)/i) ||
    message.match(/^(\w+) is my situationship/i);
  if (registerMatch) {
    state.situationship = {
      name: registerMatch[1],
      registeredAt: Date.now(),
      lastDrama: state.situationship?.lastDrama,
    };
    if (!state.streakStart) {
      state.streakStart = Date.now();
    }
  }

  // Add note / red flag
  const noteMatch = message.match(/add note[:\s]+(.+)/i);
  if (noteMatch) {
    state.notes.push(noteMatch[1].trim());
  }

  // Caved / texted them → reset streak
  if (
    lower.includes("i texted them") ||
    lower.includes("i caved") ||
    lower.includes("i sent it") ||
    lower.includes("i did it")
  ) {
    state.daysClean = 0;
    state.streakStart = Date.now();
    state.lastCaved = Date.now();
  }

  // Resisted an urge
  if (
    lower.includes("urge passed") ||
    lower.includes("i resisted") ||
    lower.includes("didn't text") ||
    lower.includes("i survived")
  ) {
    state.urgesResisted++;
    // Update days clean
    if (state.streakStart) {
      state.daysClean = Math.floor(
        (Date.now() - state.streakStart) / (1000 * 60 * 60 * 24)
      );
    }
  }

  // Refresh days clean on every message (passive tracking)
  if (state.streakStart && state.daysClean === 0 && !state.lastCaved) {
    const hoursSince = (Date.now() - state.streakStart) / (1000 * 60 * 60);
    if (hoursSince >= 1) {
      state.daysClean = Math.floor(hoursSince / 24);
    }
  }

  return state;
}

// ─── Main watcher ─────────────────────────────────────────────────────────────

async function main() {
  console.log("🚫📱 Don't Text Them agent is running...");
  console.log("Text this number to start. Type Ctrl+C to stop.\n");

  await sdk.startWatching({
    onDirectMessage: async (msg) => {
      // Only respond to messages from yourself (running as your own agent)
      // or from your designated phone number
      if (msg.isFromMe) return;

      const sender = msg.sender;
      const text = msg.text?.trim();
      if (!text) return;

      console.log(`[${new Date().toLocaleTimeString()}] From ${sender}: ${text}`);

      try {
        // Load per-sender state (each person gets their own accountability session)
        let state = await loadState(sender);

        // Update state based on what they said
        state = updateState(text, state);

        // Get Claude's response
        const reply = await think(text, state);

        // Save updated state
        await saveState(sender, state);

        // Send reply
        await sdk.send(sender, reply);
        console.log(`[${new Date().toLocaleTimeString()}] Replied: ${reply}\n`);
      } catch (err) {
        console.error("Error processing message:", err);
        await sdk.send(
          sender,
          "ugh, i glitched. try again? (don't use that as an excuse to text them 🙄)"
        );
      }
    },

    onError: (err) => {
      console.error("Watcher error:", err);
    },
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\nShutting down...");
    sdk.stopWatching();
    await sdk.close();
    process.exit(0);
  });
}

main().catch(console.error);
