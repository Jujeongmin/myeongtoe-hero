// 퇴직 기념품 (the original's ancient relics): each arrives on its own at its floor and levels with
// 보석. 7000층's (mining power) waits for the stock-market content.
export interface RelicDef {
  id: string;
  name: string;
  unlockFloor: number;
  text: string;
}

export const RELICS: readonly RelicDef[] = [
  { id: "r_badge", name: "근속 25년 금배지", unlockFloor: 1000, text: "3000층 이하에서 데미지 +250%" },
  { id: "r_plaque", name: "공로패", unlockFloor: 2000, text: "골드 +50%" },
  { id: "r_watch", name: "명품 손목시계", unlockFloor: 3000, text: "공격 속도 +5%" },
  { id: "r_cards", name: "명함 뭉치", unlockFloor: 4000, text: "분신이 공격력 40%로 함께 공격" },
  { id: "r_pin", name: "부장님 넥타이핀", unlockFloor: 5000, text: "공주임 버프 효과 +30%" },
  { id: "r_stamp", name: "대형 결재 도장", unlockFloor: 6000, text: "김인턴 추가 공격 +1%" },
  { id: "r_pas", name: "파스", unlockFloor: 8000, text: "3차 자격증 효과 +20%" },
  { id: "r_fan", name: "부채", unlockFloor: 9000, text: "아파트 +2평으로 계산" },
];

const BY_ID = new Map(RELICS.map((r) => [r.id, r]));

export function findRelic(id: string): RelicDef | undefined {
  return BY_ID.get(id);
}

export function relicsUnlocked(bestFloor: number): RelicDef[] {
  return RELICS.filter((r) => bestFloor >= r.unlockFloor);
}

// The 보석 cost of going from `level` to `level + 1`.
export function relicLevelCost(level: number): number {
  return Math.ceil(100 * 1.25 ** (level - 1));
}
