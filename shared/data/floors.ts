import { Big } from "../big";

// The Demon Group tower. Every floor has MONSTERS_PER_FLOOR monsters and the last of them is the
// floor's boss: ×5 health and gold, ×10 on every 10th floor, ×50 on every 100th. A boss has
// BOSS_LIMIT_SEC to be beaten; failing that, Park farms the floor's other monsters until he can.
export const MONSTERS_PER_FLOOR = 5;
export const WALK_SEC = 0.5;
export const BOSS_LIMIT_SEC = 30;

// A normal monster on floor 1 has 570 health; each floor up multiplies it by a growth that eases off
// the higher the tower gets.
export const HP_BASE = 570;
export const HP_GROWTH_STEPS: readonly (readonly [upToFloor: number, growth: number])[] = [
  [100, 1.15],
  [200, 1.1],
  [400, 1.08],
  [500, 1.07],
  [Number.POSITIVE_INFINITY, 1.05],
];

// A kill pays this share of the side jobs' income per second (never less than the minimum income).
export const KILL_GOLD_SHARE = 0.1;
export const MIN_INCOME_PER_SEC = 10;

export function bossMult(floor: number): number {
  if (floor % 100 === 0) return 50;
  if (floor % 10 === 0) return 10;
  return 5;
}

// The last monster of each floor is its boss.
export function isBoss(target: number): boolean {
  return target === MONSTERS_PER_FLOOR - 1;
}

// A normal monster's health on this floor.
export function normalHp(floor: number): Big {
  let log = Math.log10(HP_BASE);
  let from = 1;
  for (const [upTo, growth] of HP_GROWTH_STEPS) {
    if (floor <= from) break;
    const to = Math.min(floor, upTo);
    log += (to - from) * Math.log10(growth);
    from = to;
  }
  return Big.fromLog10(log);
}

// The health of the `target`-th monster (0-based) on this floor.
export function targetHp(floor: number, target: number): Big {
  const hp = normalHp(floor);
  return isBoss(target) ? hp.mulN(bossMult(floor)) : hp;
}

// How many normal kills' gold the `target`-th monster pays.
export function killGoldMult(floor: number, target: number): number {
  return isBoss(target) ? bossMult(floor) : 1;
}

// 응시권 and 보석 for beating a floor's boss, every run.
export function bossTickets(floor: number): number {
  if (floor % 100 === 0) return 10;
  if (floor % 10 === 0) return 5;
  return 2;
}

export function bossGems(floor: number): number {
  if (floor % 100 === 0) return 20;
  if (floor % 10 === 0) return 3;
  return 0;
}

export const DEPARTMENTS = ["총무팀", "영업팀", "법무팀", "개발팀", "재무팀", "임원실"] as const;

// The department theme (background and monster set) for a floor: a new one every 100 floors.
export function departmentOf(floor: number): string {
  return DEPARTMENTS[Math.floor((floor - 1) / 100) % DEPARTMENTS.length];
}
