import { applyIntent, readIntent, RuleError } from "./actions";
import { settle } from "./settle";
import { fromSave, newState, toSave, type GameState, type SaveData } from "./state";
import { offlineCapSec } from "./stats";

export const MAX_INTENTS_PER_SYNC = 50;
export const OFFLINE_REPORT_MIN_SEC = 60;

// What happened while the player was away (for the welcome-back popup). Already applied to the save.
export interface OfflineReport {
  seconds: number;
  gold: string;
  floorFrom: number;
  floorTo: number;
  tickets: number;
  gems: number;
}

export interface SyncResult {
  save: SaveData;
  now: number;
  rejected: { index: number; code: string }[];
  offline: OfflineReport | null;
}

// The time actually settled (the offline cap applied), and what it brought.
function report(before: GameState, after: GameState): OfflineReport | null {
  const seconds = Math.min(offlineCapSec(before), (after.lastTick - before.lastTick) / 1000);
  if (seconds < OFFLINE_REPORT_MIN_SEC) return null;
  return {
    seconds,
    gold: after.gold.sub(before.gold).toString(),
    floorFrom: before.run.floor,
    floorTo: after.run.floor,
    tickets: after.tickets - before.tickets,
    gems: after.gems - before.gems,
  };
}

// The whole of a sync, with no I/O: the server (server/src/server.ts) and the offline LocalTransport
// both call this, so they cannot disagree. `raw` is the stored save (undefined for a new player),
// `now` the server's clock. A corrupt save throws rather than being replaced by a new game.
export function syncSave(raw: unknown, intents: unknown, now: number): SyncResult {
  const fresh = raw === undefined || raw === null;
  const before = fresh ? newState(now) : fromSave(raw);
  let state = settle(before, now);
  const offline = fresh ? null : report(before, state);
  const rejected: SyncResult["rejected"] = [];
  const list = Array.isArray(intents) ? intents : [];
  list.forEach((rawIntent, index) => {
    if (index >= MAX_INTENTS_PER_SYNC) {
      rejected.push({ index, code: "too_many" });
      return;
    }
    const intent = readIntent(rawIntent);
    if (!intent) {
      rejected.push({ index, code: "bad_intent" });
      return;
    }
    try {
      state = applyIntent(state, intent);
    } catch (error) {
      if (!(error instanceof RuleError)) throw error;
      rejected.push({ index, code: error.code });
    }
  });
  return { save: toSave(state), now, rejected, offline };
}
