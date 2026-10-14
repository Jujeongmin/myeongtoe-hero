import { Big } from "../big";

// The Demon Group tower. Every floor has MONSTERS_PER_FLOOR monsters and the last of them is the
// floor's boss: ×5 health and gold, ×10 on every 10th floor, ×50 on every 100th. A boss has
// BOSS_LIMIT_SEC to be beaten; failing that, Park farms the floor's other monsters until he can.
export const MONSTERS_PER_FLOOR = 5;
export const WALK_SEC = 0.5;
export const BOSS_LIMIT_SEC = 30;

// A normal monster on floor 1 has 570 health; each floor up multiplies it by a growth that changes
// smoothly with the floor: the growth at a floor is read off a line drawn through these points, so
// the climb never turns hard all at once. 15% a floor at first, easing to 7% over floors 40-60 (the
// way to 100 is easy: a free player who takes the 연봉협상 at 70 reaches 100 about 30 minutes
// later), rising back to 12.5% by 150 and then easing off for good, 5% from 600. From floor 400 on
// the health is about what it was with the old fixed steps.
export const HP_BASE = 570;
export const HP_GROWTH_POINTS: readonly (readonly [floor: number, growth: number])[] = [
  [1, 1.15],
  [40, 1.15],
  [60, 1.07],
  [100, 1.07],
  [150, 1.125],
  [250, 1.1],
  [400, 1.08],
  [500, 1.06],
  [600, 1.05],
];

// The growth from floor `floor` to the next.
export function hpGrowth(floor: number): number {
  const points = HP_GROWTH_POINTS;
  for (let i = 1; i < points.length; i++) {
    const [b, gb] = points[i];
    if (floor <= b) {
      const [a, ga] = points[i - 1];
      return ga + ((gb - ga) * (floor - a)) / (b - a);
    }
  }
  return points[points.length - 1][1];
}

// log10 of a normal monster's health on each floor up to the last point; past it the growth is fixed.
const LAST_POINT = HP_GROWTH_POINTS[HP_GROWTH_POINTS.length - 1][0];
const LOG_HP: number[] = [Number.NaN, Math.log10(HP_BASE)];
for (let f = 2; f <= LAST_POINT; f++) LOG_HP.push(LOG_HP[f - 1] + Math.log10(hpGrowth(f - 1)));

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
  if (f <= LAST_POINT) return Big.fromLog10(LOG_HP[f]);
  return Big.fromLog10(LOG_HP[LAST_POINT] + (f - LAST_POINT) * Math.log10(hpGrowth(LAST_POINT)));
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
