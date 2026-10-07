import type { BuffKind } from "./buffs";

// 골드 교환 (shop): what gems buy besides growth — a lump of gold worth N kills on the current floor.
// (Buffs for 30 minutes are still a kind; the 부장님 특별 지시 gear level was taken out of the shop.)
export const BUFF_MS = 30 * 60_000;

export type GemItem =
  | { id: string; name: string; text: string; gems: number; kind: "buff"; buff: BuffKind }
  | { id: string; name: string; text: string; gems: number; kind: "gold"; kills: number };

export const GEM_ITEMS: readonly GemItem[] = [
  { id: "gold_100", name: "월급 가불", text: "지금 층 처치 골드 100번분", gems: 100, kind: "gold", kills: 100 },
  { id: "gold_1000", name: "퇴직금 중간정산", text: "지금 층 처치 골드 1000번분", gems: 500, kind: "gold", kills: 1000 },
];

const BY_ID = new Map(GEM_ITEMS.map((i) => [i.id, i]));

export function findGemItem(id: string): GemItem | undefined {
  return BY_ID.get(id);
}
