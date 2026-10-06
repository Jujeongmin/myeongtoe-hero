import type { GameState } from "../state";

// 배속: game time runs twice as fast for the tower and the side jobs (parking passes still recharge
// in real time). A rewarded ad gives 30 minutes of it; 프리미엄 buyers can keep it on with a toggle.
export const SPEED_MULT = 2;
export const SPEED_AD_MS = 30 * 60_000;

export function speedActive(s: Pick<GameState, "speed" | "vx" | "lastTick">): boolean {
  return (s.vx.premium && s.speed.on) || s.speed.until > s.lastTick;
}
