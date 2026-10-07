import type { GameState } from "./state";

// VIP: a level from the VX spent in all, every benefit kept from the levels below. Mostly comfort;
// little raw combat power.
export const VIP_STEPS = [100, 500, 1_000, 2_500, 5_000, 8_000, 15_000, 25_000, 35_000, 50_000] as const;

export const VIP_TEXT: readonly string[] = [
  "오프라인 +1시간",
  "출석 보석 +20%",
  "주차권 최대 +1",
  "오프라인 +1시간 (누적 +2시간)",
  "부업 수입 +20%",
  "주차권 최대 +1 (누적 +2)",
  "광고 버프 시간 2배",
  "오프라인 +2시간 (누적 +4시간)",
  "부업 수입 +20% (누적 +40%)",
  "VIP 전용 코스튬 세트, 닉네임 칭호",
];

export function vipLevel(totalVx: number): number {
  return VIP_STEPS.filter((step) => totalVx >= step).length;
}

export interface VipPerks {
  offlineSec: number;
  attendanceGemMult: number;
  parkPassBonus: number;
  sideJobMult: number;
  adBuffMult: number;
}

export function vipPerks(s: Pick<GameState, "vx">): VipPerks {
  const lv = vipLevel(s.vx.total);
  const hours = (lv >= 1 ? 1 : 0) + (lv >= 4 ? 1 : 0) + (lv >= 8 ? 2 : 0);
  return {
    offlineSec: hours * 3600,
    attendanceGemMult: lv >= 2 ? 1.2 : 1,
    parkPassBonus: (lv >= 3 ? 1 : 0) + (lv >= 6 ? 1 : 0),
    sideJobMult: 1 + (lv >= 5 ? 0.2 : 0) + (lv >= 9 ? 0.2 : 0),
    adBuffMult: lv >= 7 ? 2 : 1,
  };
}
