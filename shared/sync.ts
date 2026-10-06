import { applyIntent, readIntent, RuleError } from "./actions";
import { settle } from "./settle";
import { fromSave, newState, toSave, type SaveData } from "./state";

export const MAX_INTENTS_PER_SYNC = 50;

export interface SyncResult {
  save: SaveData;
  now: number;
  rejected: { index: number; code: string }[];
}

// The whole of a sync, with no I/O: the server (server/src/server.ts) and the offline LocalTransport
// both call this, so they cannot disagree. `raw` is the stored save (undefined for a new player),
// `now` the server's clock. A corrupt save throws rather than being replaced by a new game.
export function syncSave(raw: unknown, intents: unknown, now: number): SyncResult {
  let state = raw === undefined || raw === null ? newState(now) : fromSave(raw);
  state = settle(state, now);
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
  return { save: toSave(state), now, rejected };
}
