// 집 (home) content. 아파트: 보석 for pyeong, damage ×2 every 10. 정장 (costumes): six slots (투구,
// 갑옷, 망토, 장갑, 신발, 장신구), fantasy hero gear with an office joke in each set, bought with
// 상품권, one worn per slot, a bonus for a fully worn set.
// 사무용품: four parts owned from the start, upgraded with 상품권 from grade 1 to 17 (1 → 2 costs
// 200). No draws anywhere.
export function apartmentCost(pyeong: number): number {
  return Math.ceil(10 * 1.1 ** pyeong);
}

export function apartmentDamage(pyeong: number): number {
  return 2 ** Math.floor(pyeong / 10);
}

export const SUIT_PARTS = [
  { key: "helmet", name: "투구" },
  { key: "armor", name: "갑옷" },
  { key: "cape", name: "망토" },
  { key: "gloves", name: "장갑" },
  { key: "boots", name: "신발" },
  { key: "accessory", name: "장신구" },
] as const;

export const SUIT_SETS = [
  { set: 1, name: "수습 용사", bonus: "골드 +20%" },
  { set: 2, name: "영업왕", bonus: "공격 속도 +10%" },
  { set: 3, name: "야근 흑기사", bonus: "보스 데미지 +30%" },
  { set: 4, name: "주말 등산 레인저", bonus: "부업 수입 +50%" },
  { set: 5, name: "임원 성기사", bonus: "데미지 +50%" },
  { set: 6, name: "회장님 황금", bonus: "골드 +100%" },
] as const;

export interface SuitItem {
  id: string;
  set: number;
  part: string;
  name: string;
  price: number;
}

export const SUIT_ITEMS: readonly SuitItem[] = SUIT_SETS.flatMap(({ set, name }) =>
  SUIT_PARTS.map((p) => ({ id: `s${set}_${p.key}`, set, part: p.key, name: `${name} ${p.name}`, price: 30 * 3 ** (set - 1) })),
);

const BY_ID = new Map(SUIT_ITEMS.map((i) => [i.id, i]));

export function findSuitItem(id: string): SuitItem | undefined {
  return BY_ID.get(id);
}

// Every part of the set worn (wear: part → item id).
export function suitSetWorn(wear: Record<string, string>, set: number): boolean {
  return SUIT_PARTS.every((p) => wear[p.key] === `s${set}_${p.key}`);
}

export type OfficePart = "keyboard" | "mouse" | "chair" | "monitor";

export const OFFICE_PARTS: readonly { key: OfficePart; name: string; text: string }[] = [
  { key: "keyboard", name: "키보드", text: "데미지 +15%" },
  { key: "mouse", name: "마우스", text: "치명타 데미지 +5%" },
  { key: "chair", name: "의자", text: "보스 데미지 +10%" },
  { key: "monitor", name: "모니터", text: "골드 +10%" },
];

// The 상품권 cost of going from `grade` to `grade + 1`.
export function officeUpgradeCost(grade: number): number {
  return Math.ceil(200 * 1.3 ** (grade - 1));
}
