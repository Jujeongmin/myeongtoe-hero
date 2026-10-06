import type { GameState } from "./state";
import { kstDay } from "./time";

// Today's parking record. A record from another KST day counts as nothing: a new day starts fresh
// the moment it is read (the server's clock is state.lastTick, set by settle).
export function dailyOf(s: GameState): GameState["daily"] {
  const today = kstDay(s.lastTick);
  return s.daily.day === today ? s.daily : { day: today, entries: 0, bestDepth: 0, claimed: [] };
}
