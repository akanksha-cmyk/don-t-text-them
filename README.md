# 🚫📱 Don't Text Them

> *An iMessage agent that talks you out of texting your situationship.*

Built with [Photon iMessage Kit](https://github.com/photon-hq/imessage-kit) + Claude.

---

## What it does

You text **your own Mac** (running this agent). The agent texts back. It remembers your situationship's name, tracks your streak of not texting them, collects red flags you tell it about, and intervenes with real tactics when you're about to cave.

**One sentence:** An iMessage accountability bot that knows your situationship's crimes and uses them against your urges.

---

## Example conversation

```
You:   my situationship is Jordan
Bot:   Jordan is registered. the clock starts now. 
       when you feel the urge, text ME instead 🫡

You:   i really want to text them
Bot:   before you type their name, go drink a full glass of water. 
       slowly. by the time you're done, the urge will have peaked 
       and started dropping. dopamine spikes last ~90 seconds. 
       you've got this.

You:   remind me why we stopped
Bot:   idk you haven't added any notes yet... but you registered them 
       at 11pm on a tuesday which says a lot 😐 
       add note: [their worst moment] and i'll have better material

You:   add note: never introduced me to their friends in 6 months
Bot:   noted. 6 months and no friends? jordan was keeping you in 
       a separate compartment. that's not ambiguous, that's a choice. 
       saved to their file 🗂️

You:   i texted them
Bot:   okay. it happened. streak resets but you're not a failure, 
       you're a person. what did you want them to say? 
       we'll use that next time.

You:   stats
Bot:   📊 current streak: 3 days
       total urges resisted: 7
       red flags documented: 1
       jordan's name in your phone: hopefully "🚩 don't"
```

---

## Setup

### Prerequisites

- macOS (iMessage runs here)
- [Bun](https://bun.sh) installed
- An Anthropic API key → [console.anthropic.com](https://console.anthropic.com)
- Full Disk Access granted to your terminal (System Settings → Privacy & Security → Full Disk Access)

### Install

```bash
git clone https://github.com/YOUR_USERNAME/dont-text-them
cd dont-text-them
bun install
```

### Configure

```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### Run

```bash
bun run start
```

Now text your own Mac's phone number (the one registered to iMessage on this Mac). The agent will respond.

### Optional: Morning nudges

```bash
bun run nudges +1YOURNUMBER
```

Schedules a daily 9am check-in that changes based on your streak.

---

## How it works

```
Your iMessage
     ↓
iMessage Kit (reads via SQLite, sends via AppleScript)
     ↓
State loaded from ./state/{sender}.json
     ↓
Claude (claude-opus-4-5) with full context:
  - situationship name
  - days clean
  - urges resisted  
  - your notes / red flags
     ↓
Reply sent back to you
     ↓
State saved
```

State is stored as plain JSON files — one per sender. No database, no cloud, no data leaves your Mac except to Anthropic's API.

---

## Commands

| What you say | What happens |
|---|---|
| `my situationship is [name]` | Registers them, starts streak |
| `i want to text them` | Intervention mode 🚨 |
| `remind me why we stopped` | Roasts them using your notes |
| `add note: [thing]` | Saves a red flag to their file |
| `i texted them` | Resets streak, supportive response |
| `i resisted` | Increments urges counter 🏆 |
| `stats` | Shows streak + counts |
| `distract me` | One specific 5-min activity |

---

## Project structure

```
dont-text-them/
├── agent.ts      # Main watcher + Claude integration
├── state.ts      # JSON persistence layer
├── nudges.ts     # Optional morning check-ins
├── package.json
├── .env.example
└── README.md
```

---

## Why this exists

The hardest part of a situationship isn't knowing you shouldn't text them. It's the 30-second window at 11pm when you forget that.

This agent lives in that window.

---

## License

MIT
