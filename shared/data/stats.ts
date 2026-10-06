import { Big } from "../big";

// 스탯 강화: bought with gold, reset by a job change. (설계의 체력은 뺐다: Park never takes damage
// in this battle model, so health would do nothing.)
export type StatId = "atk" | "crit" | "critDmg" | "aspd";

export interface StatDef {
  id: StatId;
  name: string;
  effect: string;
  max: number;
  baseCost: number;
  costGrowth: number;
}

export const STAT_ATK_PER_LEVEL = 0.1;
export const STAT_CRIT_PER_LEVEL = 0.005;
export const STAT_CRITDMG_PER_LEVEL = 0.05;
export const STAT_ASPD_PER_LEVEL = 0.02;

export const STATS: readonly StatDef[] = [
  { id: "atk", name: "업무 능력", effect: "공격력 +10%", max: Number.POSITIVE_INFINITY, baseCost: 20, costGrowth: 1.12 },
  { id: "crit", name: "눈치", effect: "치명타 확률 +0.5%", max: 90, baseCost: 100, costGrowth: 1.25 },
  { id: "critDmg", name: "짬바", effect: "치명타 데미지 +5%", max: Number.POSITIVE_INFINITY, baseCost: 150, costGrowth: 1.2 },
  { id: "aspd", name: "타자 속도", effect: "공격 속도 +2%", max: 100, baseCost: 200, costGrowth: 1.3 },
];

const BY_ID = new Map(STATS.map((s) => [s.id as string, s]));

export function findStat(id: string): StatDef | undefined {
  return BY_ID.get(id);
}

// The cost of going from `level` to `level + 1`.
export function statCost(def: StatDef, level: number): Big {
  return Big.pow(def.costGrowth, level).mulN(def.baseCost);
}
