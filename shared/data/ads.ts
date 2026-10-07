import type { GameState } from "../state";

// 보상형 광고 지면. No daily limit: each placement can be watched again once its cooldown has passed
// (server time). Verse8 cannot confirm an ad on the server, so the reward rests on the client's
// word that the ad was watched; the cooldown is what keeps that honest enough.
export type AdId =
  | "ad_speed" | "ad_gems" | "ad_gold" | "ad_buff_atk" | "ad_buff_gold" | "ad_buff_move" | "ad_coupons" | "ad_parking" | "ad_offline";

export interface AdPlacement {
  id: AdId;
  name: string;
  text: string;
  cooldownMs: number;
}

const MIN = 60_000;

export const AD_PLACEMENTS: readonly AdPlacement[] = [
  { id: "ad_speed", name: "2배속", text: "30분 동안 전투와 부업 2배속", cooldownMs: 30 * MIN },
  { id: "ad_gems", name: "보석 받기", text: "보석 5~20개", cooldownMs: 15 * MIN },
  { id: "ad_gold", name: "골드 받기", text: "지금 층 처치 골드 50번분", cooldownMs: 15 * MIN },
  // One per buff, tapped on the buff bar: that buff for AD_BUFF_MS.
  { id: "ad_buff_atk", name: "야근 모드", text: "3분 동안 공격력 6배", cooldownMs: 30 * MIN },
  { id: "ad_buff_gold", name: "성과급", text: "3분 동안 처치 골드 3배", cooldownMs: 30 * MIN },
  { id: "ad_buff_move", name: "칼퇴 걸음", text: "3분 동안 이동 속도 2배", cooldownMs: 30 * MIN },
  { id: "ad_coupons", name: "상품권 받기", text: "상품권 20장", cooldownMs: 60 * MIN },
  { id: "ad_parking", name: "주차권 받기", text: "주차권 1장", cooldownMs: 120 * MIN },
  { id: "ad_offline", name: "방치 보상 한 번 더", text: "자리를 비운 동안의 보상을 한 번 더", cooldownMs: 0 },
];

export const AD_GEMS_MIN = 5;
export const AD_GEMS_MAX = 20;
export const AD_GOLD_KILLS = 50;
export const AD_COUPONS = 20;
export const AD_BUFF_MS = 3 * MIN;
// How long after a welcome-back popup its reward can be doubled by an ad.
export const OFFLINE_BONUS_MS = 10 * MIN;

const BY_ID = new Map(AD_PLACEMENTS.map((a) => [a.id, a]));

export function findAd(id: string): AdPlacement | undefined {
  return BY_ID.get(id as AdId);
}

export function adCooldownMs(_s: Pick<GameState, "vx" | "lastTick">, ad: AdPlacement): number {
  return ad.cooldownMs;
}

// When this placement can be watched next (server ms).
export function adReadyAt(s: Pick<GameState, "ads" | "vx" | "lastTick">, ad: AdPlacement): number {
  const last = s.ads[ad.id];
  return last ? last + adCooldownMs(s, ad) : 0;
}
