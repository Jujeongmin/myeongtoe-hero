import type { BuffKind } from "./buffs";

// 보석 상점: what gems buy besides growth. Buffs for 30 minutes (one bought while it runs adds on),
// a lump of gold worth N kills on the current floor, and an extra gear level for this run.
export const BUFF_MS = 30 * 60_000;

export type GemItem =
  | { id: string; name: string; text: string; gems: number; kind: "buff"; buff: BuffKind }
  | { id: string; name: string; text: string; gems: number; kind: "gold"; kills: number }
  | { id: string; name: string; text: string; gems: number; kind: "gearBoost" };

export const GEM_ITEMS: readonly GemItem[] = [
  { id: "gold_100", name: "월급 가불", text: "지금 층 처치 골드 100번분", gems: 100, kind: "gold", kills: 100 },
  { id: "gold_1000", name: "퇴직금 중간정산", text: "지금 층 처치 골드 1000번분", gems: 500, kind: "gold", kills: 1000 },
  { id: "gear_boost", name: "부장님 특별 지시", text: "이번 이직 전까지 업무 장비 +1레벨", gems: 20, kind: "gearBoost" },
];

const BY_ID = new Map(GEM_ITEMS.map((i) => [i.id, i]));

export function findGemItem(id: string): GemItem | undefined {
  return BY_ID.get(id);
}
