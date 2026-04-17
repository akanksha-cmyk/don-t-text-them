import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export interface AgentState {
  situationship: {
    name: string;
    registeredAt: number;
    lastDrama?: string;
  } | null;
  daysClean: number;
  urgesResisted: number;
  streakStart: number | null;
  lastCaved: number | null;
  notes: string[];
  lastInteractionAt: number;
}

const STATE_DIR = "./state";

function defaultState(): AgentState {
  return {
    situationship: null,
    daysClean: 0,
    urgesResisted: 0,
    streakStart: null,
    lastCaved: null,
    notes: [],
    lastInteractionAt: Date.now(),
  };
}

function sanitizeFilename(sender: string): string {
  return sender.replace(/[^a-z0-9+]/gi, "_");
}

export async function loadState(sender: string): Promise<AgentState> {
  await mkdir(STATE_DIR, { recursive: true });
  const path = join(STATE_DIR, `${sanitizeFilename(sender)}.json`);

  try {
    const raw = await readFile(path, "utf-8");
    const parsed = JSON.parse(raw);
    // Recalculate days clean based on streak start
    if (parsed.streakStart && !parsed.lastCaved) {
      parsed.daysClean = Math.floor(
        (Date.now() - parsed.streakStart) / (1000 * 60 * 60 * 24)
      );
    }
    return parsed;
  } catch {
    return defaultState();
  }
}

export async function saveState(
  sender: string,
  state: AgentState
): Promise<void> {
  await mkdir(STATE_DIR, { recursive: true });
  const path = join(STATE_DIR, `${sanitizeFilename(sender)}.json`);
  state.lastInteractionAt = Date.now();
  await writeFile(path, JSON.stringify(state, null, 2));
}
