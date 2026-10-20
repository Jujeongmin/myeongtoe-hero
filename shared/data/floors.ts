import { Big } from "../big";

// The Demon Group tower. Every floor has MONSTERS_PER_FLOOR monsters and the last of them is the
// floor's boss: ×5 health and gold, ×10 on every 10th floor, ×50 on every 100th. A boss has
// BOSS_LIMIT_SEC to be beaten; failing that, Park farms the floor's other monsters until he can.
export const MONSTERS_PER_FLOOR = 5;
export const WALK_SEC = 0.5;
export const BOSS_LIMIT_SEC = 30;

// A normal monster on floor 1 has 570 health, and each floor up has 10% more; from floor 600, 5%
// more (2026-10-14: a fixed rate, the user's call; a free player reaches 100 about 40 minutes in).
export const HP_BASE = 570;
export const HP_GROWTH = 1.1;
export const HP_GROWTH_LATE = 1.05;
export const HP_LATE_FROM = 600;

// The growth from floor `floor` to the next.
export function hpGrowth(floor: number): number {
  return floor < HP_LATE_FROM ? HP_GROWTH : HP_GROWTH_LATE;
}

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
  const f = Math.max(1, Math.floor(floor));
  const early = Math.min(f, HP_LATE_FROM) - 1;
  const late = Math.max(0, f - HP_LATE_FROM);
  return Big.fromLog10(Math.log10(HP_BASE) + early * Math.log10(HP_GROWTH) + late * Math.log10(HP_GROWTH_LATE));
}

// The health of the `target`-th monster (0-based) on this floor.
// The first floors are a warm-up (2026-10-20, most new players left before their first upgrade):
// a new player's 공격력 (50) kills a monster on floors 1-3 in 2-3 hits, and floors 4-5 ease into
// the usual health. Their share of the usual health, by floor; their bosses have ×2, not ×5, so
// none takes more than a few seconds.
export const WARM_UP: Readonly<Record<number, number>> = { 1: 0.175, 2: 0.225, 3: 0.215, 4: 0.5, 5: 0.75 };
export const WARM_UP_BOSS_FLOORS = 3;
export const WARM_UP_BOSS_MULT = 2;

export function targetHp(floor: number, target: number): Big {
  const hp = normalHp(floor).mulN(WARM_UP[floor] ?? 1);
  if (!isBoss(target)) return hp;
  return hp.mulN(floor <= WARM_UP_BOSS_FLOORS ? WARM_UP_BOSS_MULT : bossMult(floor));
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
