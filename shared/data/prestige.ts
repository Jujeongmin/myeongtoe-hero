// 이직: from floor 100, trade the run for 응시권 and 보석 by how high it got. The 응시권 grow
// exponentially with the floor: 100 at floor 100, about 300,000 at floor 1000.
export const PRESTIGE_MIN_FLOOR = 100;
export const BOOSTED_PRESTIGE_GEMS = 1000;
export const PRESTIGE_TICKET_BASE = 100;
export const PRESTIGE_TICKET_GROWTH = 1.009;

// 보석 count from the run's best floor; 응시권 from `ticketFloor`, the best floor with bonus floors
// (인맥관리사, 공주임) added.
export function prestigeReward(
  maxFloor: number, prestigeBonus: number, ticketFloor = maxFloor,
): { tickets: number; gems: number } {
  const tickets = maxFloor < PRESTIGE_MIN_FLOOR
    ? 0
    : Math.floor(PRESTIGE_TICKET_BASE * PRESTIGE_TICKET_GROWTH ** (ticketFloor - PRESTIGE_MIN_FLOOR) * (1 + prestigeBonus));
  return { tickets, gems: Math.floor(maxFloor / 20) };
}
