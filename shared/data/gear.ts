import { Big } from "../big";

// 업무 장비: bought tier by tier with gold, each tier levelled up. Reset by
// a job change (이직).
export interface GearTier {
  id: string;
  name: string;
}

const NAMES = [
  "볼펜", "형광펜", "스테이플러", "계산기", "결재판", "서류가방", "사원증 목걸이", "탁상 달력", "머그컵", "유선 전화기",
  "팩스", "복합기 토너", "무선 마우스", "기계식 키보드", "듀얼 모니터", "회전의자", "스탠딩 책상", "화이트보드", "빔프로젝터", "태블릿",
  "사내 메신저", "법인 휴대폰", "결재 도장", "금장 만년필", "명함 케이스", "골프 퍼터", "임원 다이어리", "법인카드", "회장님 결재판", "법인 노트북",
  // 2026-10-27: ten more for the players who had reached the last one by about the 7th day.
  "황금 명패", "회장실 열쇠", "인수 계약서", "그룹 깃발", "황금 지휘봉", "회장님 지팡이", "황금 확성기", "황금 우산", "빛나는 명함", "마왕의 홀",
] as const;

export const GEAR_TIERS: readonly GearTier[] = NAMES.map((name, i) => ({ id: `g${String(i).padStart(2, "0")}`, name }));

// A tier is bought at Lv1 and upgraded to Lv5; only a tier at Lv5 lets the next one be bought.
// `level` counts the upgrades (0 = Lv1 … GEAR_MAX_LEVEL = Lv5). Write a tier's price as 2a: the
// upgrades cost 3a, 4a, 5a, 6a, and the next tier 12a (×6). Attack goes 5b, 6b, 7b, 8b, 9b, and the
// next tier starts at 15b (×3).
export const GEAR_MAX_LEVEL = 4;
export const GEAR_ATK_BASE = 50;
export const GEAR_ATK_GROWTH = 3;
export const GEAR_LEVEL_ATK = 0.2;
export const GEAR_PRICE_BASE = 100;
export const GEAR_PRICE_GROWTH = 6;
// From tier 30 (the 31st, 황금 명패) each tier costs ×1000 the last instead of ×6: by then the 업무
// pay far outruns ×6, and the last ten tiers would be gone in a day or two.
export const GEAR_LATE_FROM = 30;
export const GEAR_LATE_PRICE_GROWTH = 1000;

// GEAR_PRICE_GROWTH^tier up to GEAR_LATE_FROM, then GEAR_LATE_PRICE_GROWTH a tier.
function priceScale(tier: number): Big {
  const late = Math.max(0, tier - GEAR_LATE_FROM);
  return Big.pow(GEAR_PRICE_GROWTH, tier - late).mul(Big.pow(GEAR_LATE_PRICE_GROWTH, late));
}

export function gearAtk(tier: number, level: number): Big {
  return Big.pow(GEAR_ATK_GROWTH, tier).mulN(GEAR_ATK_BASE * (1 + GEAR_LEVEL_ATK * level));
}

// Tier 0 (the ballpoint pen) is what everyone starts with.
export function gearPrice(tier: number): Big {
  return tier === 0 ? Big.ZERO : priceScale(tier).mulN(GEAR_PRICE_BASE);
}

// 구매확정: a tier at Lv5 confirmed for gold and gems is kept
// through job changes. Tiers are confirmed in order only.
export function gearConfirmCost(tier: number): { gold: Big; gems: number } {
  const gold = tier + 1 < GEAR_TIERS.length ? gearPrice(tier + 1) : gearPrice(tier).mulN(GEAR_PRICE_GROWTH);
  return { gold, gems: 10 * (tier + 1) };
}

// The cost of going from `level` to `level + 1` on this tier: (level + 3) halves of its price.
export function gearLevelCost(tier: number, level: number): Big {
  return priceScale(tier).mulN((GEAR_PRICE_BASE / 2) * (level + 3));
}
