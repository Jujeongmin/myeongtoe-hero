import type { GameState } from "../state";

// 피버타임: right after a 연봉협상 Park charges back up through the floors he had reached — each
// floor's monsters in turn, the boss last, every one falling at a touch, FEVER_KILL_SEC apiece (a
// floor in a second) — until he is back at that floor or FEVER_MS of real time have passed. Kills
// pay as usual.
export const FEVER_MS = 30_000;
export const FEVER_KILL_SEC = 0.1;

export function feverActive(s: Pick<GameState, "fever" | "run">, at: number): boolean {
  return at < s.fever.until && s.run.floor < s.fever.toFloor;
}
