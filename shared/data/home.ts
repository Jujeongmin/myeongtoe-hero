// 집 (home) content. 아파트 is the original's 원작 타워 (보석, damage ×2 every 10). 정장 is the
// original's costumes: six parts, bought with 상품권, one worn per part, a bonus for a fully worn set.
// 사무용품 is the original's 마왕성 gear: four parts owned from the start, upgraded with 상품권 from
// grade 1 to 17 (1 → 2 costs 200, as the original's coins did). No draws anywhere.
export function apartmentCost(pyeong: number): number {
  return Math.ceil(10 * 1.1 ** pyeong);
}

export function apartmentDamage(pyeong: number): number {
  return 2 ** Math.floor(pyeong / 10);
}

export const SUIT_PARTS = [
  { key: "hair", name: "가발" },
  { key: "suit", name: "정장" },
  { key: "coat", name: "코트" },
  { key: "gloves", name: "장갑" },
  { key: "shoes", name: "구두" },
  { key: "tie", name: "넥타이" },
] as const;

export const SUIT_SETS = [
  { set: 1, name: "신입", bonus: "골드 +20%" },
  { set: 2, name: "영업왕", bonus: "공격 속도 +10%" },
  { set: 3, name: "골프 접대", bonus: "보스 데미지 +30%" },
  { set: 4, name: "주말 등산", bonus: "부업 수입 +50%" },
  { set: 5, name: "임원", bonus: "데미지 +50%" },
  { set: 6, name: "회장님", bonus: "골드 +100%" },
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
