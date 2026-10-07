// 이직: from floor 70 (a free player watching the 2× speed ad gets there in about 25 minutes),
// trade the run for 응시권 and 보석 by how high it got. The 응시권 grow exponentially with the
// floor: 76 at floor 70, 100 at floor 100, about 300,000 at floor 1000.
export const PRESTIGE_MIN_FLOOR = 70;
const PRESTIGE_TICKET_AT = 100; // the floor that gives PRESTIGE_TICKET_BASE
// 강화이직 and 초강화이직: pay 보석 up front for more 응시권 (the 보석 reward stays as is).
export type PrestigeMode = "plain" | "boosted" | "super";
export const PRESTIGE_MODES: Record<PrestigeMode, { gems: number; ticketMult: number }> = {
  plain: { gems: 0, ticketMult: 1 },
  boosted: { gems: 500, ticketMult: 3 },
  super: { gems: 1000, ticketMult: 5 },
};
export const PRESTIGE_TICKET_BASE = 100;
export const PRESTIGE_TICKET_GROWTH = 1.009;

// 보석 count from the run's best floor; 응시권 from `ticketFloor`, the best floor with bonus floors
// (인맥관리사, 공주임) added.
export function prestigeReward(
  maxFloor: number, prestigeBonus: number, ticketFloor = maxFloor,
): { tickets: number; gems: number } {
  const tickets = maxFloor < PRESTIGE_MIN_FLOOR
    ? 0
    : Math.floor(PRESTIGE_TICKET_BASE * PRESTIGE_TICKET_GROWTH ** (ticketFloor - PRESTIGE_TICKET_AT) * (1 + prestigeBonus));
  return { tickets, gems: Math.floor(maxFloor / 20) };
}
