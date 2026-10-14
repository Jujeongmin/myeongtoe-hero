// 이직: from floor 70 (a free player watching the 2× speed ad gets there in about 25 minutes),
// trade the run for 응시권 by how high it got (no 보석 since 2026-10-12, when the 응시권 doubled;
// tripled again 2026-10-14). They grow exponentially with the floor: 458 at floor 70, 600 at floor
// 100, about 1.9 million at 1000.
export const PRESTIGE_MIN_FLOOR = 70;
const PRESTIGE_TICKET_AT = 100; // the floor that gives PRESTIGE_TICKET_BASE
// 강화이직 and 초강화이직: pay 보석 up front for more 응시권.
export type PrestigeMode = "plain" | "boosted" | "super";
export const PRESTIGE_MODES: Record<PrestigeMode, { gems: number; ticketMult: number }> = {
  plain: { gems: 0, ticketMult: 1 },
  boosted: { gems: 500, ticketMult: 3 },
  super: { gems: 1000, ticketMult: 5 },
};
export const PRESTIGE_TICKET_BASE = 600;
// 칼퇴 걸음 switched on for this long right after a 연봉협상.
export const PRESTIGE_MOVE_MS = 60_000;
export const PRESTIGE_TICKET_GROWTH = 1.009;

// 응시권 from `ticketFloor`, the best floor with bonus floors (인맥관리사, 공주임) added.
export function prestigeReward(
  maxFloor: number, prestigeBonus: number, ticketFloor = maxFloor,
): { tickets: number } {
  const tickets = maxFloor < PRESTIGE_MIN_FLOOR
    ? 0
    : Math.floor(PRESTIGE_TICKET_BASE * PRESTIGE_TICKET_GROWTH ** (ticketFloor - PRESTIGE_TICKET_AT) * (1 + prestigeBonus));
  return { tickets };
}
