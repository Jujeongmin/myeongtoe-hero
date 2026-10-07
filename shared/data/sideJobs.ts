import { Big } from "../big";

// 부업: each pays its income once per cycle and starts over on its own. Starting a job costs its
// base cost; each next level costs 12% more than the last, and the pay grows by half the level-1 pay
// per level (level n pays base × (n + 1) / 2), doubled at each milestone level reached (25, 50,
// 100, then every 100). Up to level 999. Reset by a job change (이직).
export interface SideJob {
  id: string;
  name: string;
  unlockFloor: number;
  baseCost: Big;
  baseIncome: Big;
  baseCycleSec: number;
}

export const SIDE_JOB_MAX_LEVEL = 999;
export const SIDE_JOB_LEVEL_COST_GROWTH = 1.12;

const MIN = 60;
const HOUR = 3600;

// Name, starting cost, seconds per cycle, level-1 pay.
const TABLE: readonly (readonly [string, number, number, number])[] = [
  ["편의점 알바", 10, 1, 10],
  ["전단지 돌리기", 130, 2, 120],
  ["중고거래 되팔기", 1.8e3, 5, 2.1e3],
  ["배달 라이더", 2.73e4, 10, 3.36e4],
  ["대리운전", 4.368e5, 30, 9.072e5],
  ["주말 결혼식 사회", 7.4e6, MIN, 1.81e7],
  ["과외", 1.336e8, 2 * MIN, 3.991e8],
  ["블로그 체험단", 2.5e9, 5 * MIN, 1.19e10],
  ["유튜브 쇼츠", 5.07e10, 10 * MIN, 3.113e11],
  ["웹소설 연재", 1e12, 30 * MIN, 1.3e13],
  ["스마트스토어", 2.34e13, HOUR, 3.923e14],
  ["코인 단타", 5.397e14, 3 * MIN, 1.8e15],
  ["주식 단타", 1.29e16, 30 * MIN, 5.33e16],
  ["공유 숙소 운영", 3.238e17, 2 * HOUR, 3.8e18],
  ["무인 카페 창업", 8.4e18, 2 * MIN, 2.2e18],
  ["프랜차이즈 점주", 2.273e20, MIN, 6.6e18],
  ["꼬마빌딩 임대", 6.3e21, 10 * MIN, 2.5e21],
  ["부동산 경매", 1.845e23, HOUR, 3.372e23],
  ["스타트업 엔젤 투자", 5.5e24, 3 * HOUR, 2.32e25],
  ["회사 창업", 1.716e26, 5 * MIN, 4.65e25],
  ["코스닥 상장", 4.65e28, HOUR, 8.6e27],
  ["경쟁사 인수", 8e30, 10 * MIN, 7.5e28],
  ["재벌 그룹 결성", 1.7e33, 10 * MIN, 3.6e30],
  ["연애 성공하기", 4.889e35, 10 * MIN, 3.431e32],
  ["효도하기", 1.1e38, 10 * MIN, 1.458e35],
];

export const SIDE_JOBS: readonly SideJob[] = TABLE.map(([name, cost, cycle, pay], i) => ({
  id: `j${String(i).padStart(2, "0")}`,
  name,
  unlockFloor: 1,
  baseCost: Big.of(cost),
  baseIncome: Big.of(pay),
  baseCycleSec: cycle,
}));

const BY_ID = new Map(SIDE_JOBS.map((job) => [job.id, job]));

export function findSideJob(id: string): SideJob | undefined {
  return BY_ID.get(id);
}

// The cost of going from `level` to `level + 1` (level 0 → 1 is starting the job).
export function sideJobCost(job: SideJob, level: number): Big {
  return job.baseCost.mul(Big.pow(SIDE_JOB_LEVEL_COST_GROWTH, level));
}

export const SIDE_JOB_MILESTONES: readonly number[] = [25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

// ×2 for every milestone at or below `level`.
export function sideJobMilestoneMult(level: number): number {
  return 2 ** SIDE_JOB_MILESTONES.filter((m) => m <= level).length;
}

// The next milestone above `level` and the one before it (0 at the start), or null past the last.
export function sideJobMilestone(level: number): { from: number; to: number } | null {
  const i = SIDE_JOB_MILESTONES.findIndex((m) => m > level);
  return i < 0 ? null : { from: i === 0 ? 0 : SIDE_JOB_MILESTONES[i - 1], to: SIDE_JOB_MILESTONES[i] };
}

export function sideJobIncome(job: SideJob, level: number): Big {
  if (level <= 0) return Big.ZERO;
  return job.baseIncome.mulN(((level + 1) / 2) * sideJobMilestoneMult(level));
}

export function sideJobCycle(job: SideJob, _level: number): number {
  return job.baseCycleSec;
}
