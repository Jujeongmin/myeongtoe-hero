import { Big } from "../big";

// The Demon Group tower. Normal floors have MONSTERS_PER_FLOOR monsters; floors that are multiples
// of 5 hold a single boss instead (see bossMult). First-pass values: tuned in step 8 by the balance
// simulator — change values here, not names.
export const MONSTERS_PER_FLOOR = 10;
export const WALK_SEC = 1;
export const BOSS_LIMIT_SEC = 30;
// ×5 along with the gear's base attack (50, the original's 나뭇가지), so early pacing stays the same.
export const HP_BASE = 100;
export const HP_GROWTH = 1.16;
export const GOLD_BASE = 2;
export const GOLD_GROWTH = 1.13;

// ×50 for an executive (every 100th), ×10 for a team leader (10th), ×5 for a mid-boss (5th), else 0.
export function bossMult(floor: number): number {
  if (floor % 100 === 0) return 50;
  if (floor % 10 === 0) return 10;
  if (floor % 5 === 0) return 5;
  return 0;
}

export function isBossFloor(floor: number): boolean {
  return bossMult(floor) > 0;
}

export function targetsOn(floor: number): number {
  return isBossFloor(floor) ? 1 : MONSTERS_PER_FLOOR;
}

function scaled(base: number, growth: number, floor: number): Big {
  const value = Big.pow(growth, floor - 1).mulN(base);
  const mult = bossMult(floor);
  return mult > 0 ? value.mulN(mult) : value;
}

export function targetHp(floor: number): Big {
  return scaled(HP_BASE, HP_GROWTH, floor);
}

export function killGold(floor: number): Big {
  return scaled(GOLD_BASE, GOLD_GROWTH, floor);
}
