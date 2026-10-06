// 이직 (the original's rebirth): from floor 100 as in the original, trade the run for 응시권 and 보석 by how high it got.
export const PRESTIGE_MIN_FLOOR = 100;
export const BOOSTED_PRESTIGE_GEMS = 1000;

export function prestigeReward(maxFloor: number, prestigeBonus: number): { tickets: number; gems: number } {
  const base = Math.max(0, Math.floor((maxFloor - 90) / 5));
  return { tickets: Math.floor(base * (1 + prestigeBonus)), gems: Math.floor(maxFloor / 20) };
}
