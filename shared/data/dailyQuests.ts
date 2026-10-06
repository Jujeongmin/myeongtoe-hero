import { isSaturday } from "../time";

// 지하주차장 일일 퀘스트: goals on today's number of entries and today's deepest run, paying 상품권 —
// 315 a day in all — and double on Saturdays.
export interface DailyQuest {
  id: string;
  kind: "entries" | "depth";
  goal: number;
  coupons: number;
}

const ENTRIES: readonly [number, number][] = [[1, 5], [3, 10], [5, 15], [10, 20], [16, 25], [24, 30], [32, 35], [48, 40]];
const DEPTHS: readonly [number, number][] = [[20, 10], [50, 15], [100, 20], [150, 25], [200, 30], [300, 35]];

export const DAILY_QUESTS: readonly DailyQuest[] = [
  ...ENTRIES.map(([goal, coupons], i) => ({ id: `e${i + 1}`, kind: "entries" as const, goal, coupons })),
  ...DEPTHS.map(([goal, coupons], i) => ({ id: `d${i + 1}`, kind: "depth" as const, goal, coupons })),
];

const BY_ID = new Map(DAILY_QUESTS.map((q) => [q.id, q]));

export function findDailyQuest(id: string): DailyQuest | undefined {
  return BY_ID.get(id);
}

export function dailyQuestReward(q: DailyQuest, now: number): number {
  return isSaturday(now) ? q.coupons * 2 : q.coupons;
}
