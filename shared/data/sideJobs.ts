import { Big } from "../big";

// 부업 (the original's quests): each pays its income once per cycle. Without the 부업 자동화 purchase
// a job stops after paying and waits for a tap to run again. Reset by a job change (이직).
export interface SideJob {
  id: string;
  name: string;
  unlockFloor: number;
  baseCost: Big;
  baseIncome: Big;
  baseCycleSec: number;
}

const NAMES = [
  "편의점 알바", "전단지 돌리기", "대리운전", "택배 상하차", "배달 라이더", "과외", "블로그 체험단", "중고거래", "유튜브", "웹소설 연재",
  "스마트스토어", "코인 단타", "주식 단타", "공유 숙소 운영", "프랜차이즈 점주", "꼬마빌딩 임대", "부동산 경매", "스타트업 투자", "창업", "상장",
] as const;

export const SIDE_JOB_COST_GROWTH = 11;
export const SIDE_JOB_CYCLE_BASE = 3;
export const SIDE_JOB_CYCLE_GROWTH = 1.5;
export const SIDE_JOB_LEVEL_COST_GROWTH = 1.07;
export const SIDE_JOB_DOUBLE_EVERY = 25;
export const SIDE_JOB_CYCLE_CUT_PER_LEVEL = 0.01;
export const SIDE_JOB_CYCLE_FLOOR = 0.25;

export const SIDE_JOBS: readonly SideJob[] = NAMES.map((name, i) => ({
  id: `j${String(i).padStart(2, "0")}`,
  name,
  unlockFloor: i === 0 ? 1 : i * 15,
  baseCost: Big.pow(SIDE_JOB_COST_GROWTH, i).mulN(10),
  baseIncome: Big.pow(SIDE_JOB_COST_GROWTH, i).mulN(4 * SIDE_JOB_CYCLE_GROWTH ** i),
  baseCycleSec: SIDE_JOB_CYCLE_BASE * SIDE_JOB_CYCLE_GROWTH ** i,
}));

const BY_ID = new Map(SIDE_JOBS.map((job) => [job.id, job]));

export function findSideJob(id: string): SideJob | undefined {
  return BY_ID.get(id);
}

// The cost of going from `level` to `level + 1` (level 0 → 1 is starting the job).
export function sideJobCost(job: SideJob, level: number): Big {
  return job.baseCost.mul(Big.pow(SIDE_JOB_LEVEL_COST_GROWTH, level));
}

export function sideJobIncome(job: SideJob, level: number): Big {
  if (level <= 0) return Big.ZERO;
  return job.baseIncome.mulN(level * 2 ** Math.floor(level / SIDE_JOB_DOUBLE_EVERY));
}

export function sideJobCycle(job: SideJob, level: number): number {
  const cut = Math.max(SIDE_JOB_CYCLE_FLOOR, 1 - SIDE_JOB_CYCLE_CUT_PER_LEVEL * (Math.max(1, level) - 1));
  return job.baseCycleSec * cut;
}
