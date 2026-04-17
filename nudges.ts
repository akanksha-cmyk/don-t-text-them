/**
 * nudges.ts — optional proactive morning check-ins
 *
 * Run this alongside agent.ts to get a daily 9am nudge
 * asking how you're doing. Completely optional.
 *
 * Usage: bun run nudges.ts +1YOURNUMBER
 */

import { IMessageSDK, Reminders } from "@photon-ai/imessage-kit";
import { loadState } from "./state.js";

const YOUR_NUMBER = process.argv[2];

if (!YOUR_NUMBER) {
  console.error("Usage: bun run nudges.ts +1YOURNUMBER");
  process.exit(1);
}

const sdk = new IMessageSDK();
const reminders = new Reminders(sdk);

async function scheduleDaily() {
  const state = await loadState(YOUR_NUMBER);

  let message: string;

  if (!state.situationship) {
    message =
      "hey 👋 haven't registered your situationship yet — text me their name to start tracking!";
  } else if (state.daysClean === 0) {
    message = `morning ☀️ new day, fresh start. you're not going to text ${state.situationship.name} today. how are you feeling?`;
  } else if (state.daysClean === 1) {
    message = `good morning! you made it through day 1 without texting ${state.situationship.name}. that's harder than it sounds. check in?`;
  } else if (state.daysClean < 7) {
    message = `morning! day ${state.daysClean} 🔥 ${state.urgesResisted} urges resisted total. ${state.situationship.name} who?`;
  } else {
    message = `GOOD MORNING DAY ${state.daysClean} LEGEND 🏆 ${state.situationship.name} has no idea what they're missing. how are you?`;
  }

  // Schedule for tomorrow 9am, then this script can be restarted daily
  // (or run via a cron job)
  reminders.at("tomorrow 9am", YOUR_NUMBER, message);
  console.log(`Scheduled morning nudge for ${YOUR_NUMBER}: "${message}"`);
}

scheduleDaily().catch(console.error);

process.on("SIGINT", async () => {
  reminders.destroy();
  await sdk.close();
  process.exit(0);
});
