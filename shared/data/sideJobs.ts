import { Big } from "../big";

// 업무 (work skills; the code still says side jobs, 부업 before 2026-10-14): each pays its income once per cycle and starts over on its own. Starting a job costs its
// base cost; each next level costs 12% more than the last, and the pay grows by half the level-1 pay
// per level (level n pays base × (n + 1) / 2), doubled at each milestone level reached (10, 25, 50,
// 100, then every 100). Up to level 999. Reset by a job change (이직).
export interface SideJob {
  id: string;
  name: string;
  unlockFloor: number;
  baseCost: Big;
  baseIncome: Big;
  baseCycleSec: number;
  // How many seconds of this job's income 박주임 pays at a time.
  bonusSec: number;
}

export const SIDE_JOB_MAX_LEVEL = 999;
export const SIDE_JOB_LEVEL_COST_GROWTH = 1.12;
// Every side job's pay, raised 20% across the board (2026-10-12).
export const SIDE_JOB_PAY_MULT = 1.2;

const MIN = 60;
const HOUR = 3600;

// Name, starting cost, seconds per cycle, the pay level 1 would have without the level-10
// milestone (the first levels pay half of it, so from level 10 on the pay is what it was before
// that milestone was added), and the cycle that pay was for. Every cycle is a minute or less since
// 2026-10-27 (some were up to 3 hours): the pay is cut to match, so the gold a second is the same,
// it just comes in steadily. 박주임 still pays a job's old cycle's worth (bonusSec).
const TABLE: readonly (readonly [string, number, number, number, number])[] = [
  ["복사하기", 10, 1, 10, 1],
  ["커피 타기", 130, 2, 120, 2],
  ["엑셀 정리", 1.8e3, 5, 2.1e3, 5],
  ["회의록 쓰기", 2.73e4, 10, 3.36e4, 10],
  ["거래처 전화", 4.368e5, 30, 9.072e5, 30],
  ["보고서 쓰기", 7.4e6, 60, 1.81e7, MIN],
  ["PPT 만들기", 1.336e8, 20, 3.991e8, 2 * MIN],
  ["출장 가기", 2.5e9, 40, 1.19e10, 5 * MIN],
  ["발표하기", 5.07e10, 25, 3.113e11, 10 * MIN],
  ["예산 짜기", 1e12, 45, 1.3e13, 30 * MIN],
  ["신입 가르치기", 2.34e13, 60, 3.923e14, HOUR],
  ["거래처 접대", 5.397e14, 12, 3.351e14, 3 * MIN],
  ["프로젝트 맡기", 1.29e16, 50, 5.933e16, 30 * MIN],
  ["해외 출장", 3.238e17, 60, 4.413e18, 2 * HOUR],
  ["새 사업 기획", 8.4e18, 15, 1.413e18, 2 * MIN],
  ["팀 이끌기", 2.273e20, 8, 1.416e19, MIN],
  ["투자 받아오기", 6.3e21, 30, 2.908e21, 10 * MIN],
  ["큰 계약 따내기", 1.845e23, 55, 3.785e23, HOUR],
  ["해외 지사 세우기", 5.5e24, 60, 2.507e25, 3 * HOUR],
  ["회사 인수하기", 1.716e26, 20, 1.61e25, 5 * MIN],
  ["이사회 보고", 4.65e28, 45, 1.586e28, HOUR],
  ["사장님 보고", 8e30, 30, 1.378e29, 10 * MIN],
  ["그룹 회의 열기", 1.7e33, 35, 8.875e30, 10 * MIN],
  ["회장님 보고", 4.889e35, 40, 7.734e32, 10 * MIN],
  ["회장님과 점심", 1.1e38, 50, 5.273e34, 10 * MIN],
  // 2026-10-27: ten more past the chairman, each ×250 the cost and ×300 the income of the last.
  ["주주총회 열기", 2.75e40, 25, 6.591e35, 25],
  ["세계 무대 발표", 6.875e42, 40, 3.164e38, 40],
  ["회장님 대신 결재", 1.719e45, 55, 1.305e41, 55],
  ["그룹 회장 취임", 4.297e47, 30, 2.136e43, 30],
  ["명예의 전당", 1.074e50, 60, 1.281e46, 60],
  ["전 세계 지사 순방", 2.686e52, 45, 2.883e48, 45],
  ["마왕과 담판 짓기", 6.714e54, 50, 9.61e50, 50],
  ["마왕그룹 개혁하기", 1.678e57, 35, 2.018e53, 35],
  ["장학 재단 세우기", 4.196e59, 20, 3.46e55, 20],
  ["전설로 은퇴하기", 1.049e62, 60, 3.114e58, 60],
];

export const SIDE_JOBS: readonly SideJob[] = TABLE.map(([name, cost, cycle, pay, payCycle], i) => ({
  id: `j${String(i).padStart(2, "0")}`,
  name,
  unlockFloor: 1,
  baseCost: Big.of(cost),
  baseIncome: Big.of(((pay / 2) * cycle) / payCycle),
  baseCycleSec: cycle,
  bonusSec: payCycle,
}));

const BY_ID = new Map(SIDE_JOBS.map((job) => [job.id, job]));

export function findSideJob(id: string): SideJob | undefined {
  return BY_ID.get(id);
}

// The cost of going from `level` to `level + 1` (level 0 → 1 is starting the job).
export function sideJobCost(job: SideJob, level: number): Big {
  return job.baseCost.mul(Big.pow(SIDE_JOB_LEVEL_COST_GROWTH, level));
}

export const SIDE_JOB_MILESTONES: readonly number[] = [10, 25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

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
  return job.baseIncome.mulN(((level + 1) / 2) * sideJobMilestoneMult(level) * SIDE_JOB_PAY_MULT);
}

export function sideJobCycle(job: SideJob, _level: number): number {
  return job.baseCycleSec;
}
