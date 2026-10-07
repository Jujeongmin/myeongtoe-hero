// 동료: each joins on its own once the best floor reaches it, works passively, levels with 보석, and
// awakens every 2000 floors (up to 10 stages). The 동료 상자 gives a random joined one a level for
// 상품권. An eighth, for the stock-market content, comes with it later.
export interface PetDef {
  id: string;
  name: string;
  unlockFloor: number;
  text: string;
}

export const PETS: readonly PetDef[] = [
  { id: "p_intern", name: "김인턴", unlockFloor: 100, text: "2.5초마다 공격력 100% 추가 공격" },
  { id: "p_jumim", name: "박주임", unlockFloor: 300, text: "20초마다 가장 비싼 부업 수입 지급" },
  { id: "p_daeri", name: "최대리", unlockFloor: 600, text: "몬스터 등장 시 체력 0~30% 깎기" },
  { id: "p_gongju", name: "공주임", unlockFloor: 900, text: "5초마다 2초 랜덤 버프" },
  { id: "p_oh", name: "막내 오사원", unlockFloor: 1100, text: "처치 시 확률로 응시권" },
  { id: "p_hong", name: "홍과장", unlockFloor: 4500, text: "2초마다 적 최대 체력 1% 감소" },
  { id: "p_minam", name: "꽃미남 실장", unlockFloor: 6500, text: "몬스터 등장 시 체력 4% 감소" },
];

export const PET_BOX_COUPONS = 70;

// 확률 공개: the 동료 상자 picks one of the joined colleagues with equal odds (percent, 2 decimals).
export function petBoxChance(joined: number): number {
  return joined > 0 ? Math.round(10000 / joined) / 100 : 0;
}
export const AWAKEN_EVERY = 2000;
export const AWAKEN_MAX = 10;

const BY_ID = new Map(PETS.map((p) => [p.id, p]));

export function findPet(id: string): PetDef | undefined {
  return BY_ID.get(id);
}

export function petsUnlocked(bestFloor: number): PetDef[] {
  return PETS.filter((p) => bestFloor >= p.unlockFloor);
}

export function awakenStage(bestFloor: number): number {
  return Math.min(AWAKEN_MAX, Math.floor(bestFloor / AWAKEN_EVERY));
}

// The 보석 cost of going from `level` to `level + 1`.
export function petLevelCost(level: number): number {
  return Math.ceil(10 * 1.18 ** (level - 1));
}
