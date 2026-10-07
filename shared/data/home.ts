// 집 (home) content. 아파트: 보석 for pyeong, damage ×2 every 10. (Costumes: data/costumes.ts.)
// 사무용품: four parts owned from the start, upgraded with 상품권 from grade 1 to 17 (1 → 2 costs
// 200). No draws anywhere.
export function apartmentCost(pyeong: number): number {
  return Math.ceil(10 * 1.1 ** pyeong);
}

export function apartmentDamage(pyeong: number): number {
  return 2 ** Math.floor(pyeong / 10);
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
