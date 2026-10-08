import type { GameState } from "../state";
import type { Text } from "../text";

// 코스튬 (정장): six slots, six sets of hero gear with an office joke in each set. Every costume has
// its own effect, which works from the moment it is owned — wearing one only
// changes how Park looks. Effects multiply with each other.
// - 불꽃 (aura) of a set: on sale once the set's 투구·갑옷·망토·장갑·신발 are all owned.
// - 전설 코스튬: one per slot (no 장신구), on sale once all six of that slot are owned, levelled 1–5;
//   owning several adds the 전설 set effects.
// - 대여: 10% of the price for 24 hours; buying it afterwards gives that 10% back.

export const SUIT_PARTS = [
  { key: "helmet", name: "투구" },
  { key: "armor", name: "갑옷" },
  { key: "cape", name: "망토" },
  { key: "gloves", name: "장갑" },
  { key: "boots", name: "신발" },
  { key: "accessory", name: "장신구" },
] as const;
export type SuitPart = (typeof SUIT_PARTS)[number]["key"];

export const SUIT_SETS = [
  { set: 1, name: "수습 용사" },
  { set: 2, name: "영업왕" },
  { set: 3, name: "야근 흑기사" },
  { set: 4, name: "주말 등산 레인저" },
  { set: 5, name: "임원 성기사" },
  { set: 6, name: "회장님 황금" },
] as const;

// What a costume does. `v` is a share (1 = +100%) unless the kind says otherwise.
export type CostumeEffect =
  | { k: "dmg" | "critDmg" | "aspd" | "gold" | "sideJob" | "boss" | "move" | "prestige"; v: number }
  | { k: "critChance"; v: number } // + to the crit chance
  | { k: "cost"; v: number } // − on gear and side-job costs
  | { k: "bossTime"; v: number } // + seconds for a boss
  | { k: "offline"; v: number } // + seconds of offline time
  | { k: "prestigeFloors"; v: number } // + floors a job change counts
  | { k: "dmgBelow"; v: number; floor: number } // attack while on a floor up to `floor`
  | { k: "prestigeBelow"; v: number; floor: number }; // job-change tickets from a run up to `floor`

export interface SuitItem {
  id: string;
  set: number;
  part: SuitPart;
  name: string;
  price: number;
  effect: CostumeEffect;
}

const NAMES: Record<number, Record<SuitPart, string>> = {
  1: { helmet: "수습 가죽 모자", armor: "수습 가죽 조끼", cape: "자투리 망토", gloves: "목장갑", boots: "닳은 가죽 장화", accessory: "신입 사원증" },
  2: { helmet: "실적왕 청동 투구", armor: "청동 흉갑", cape: "영업왕 붉은 망토", gloves: "악수용 청동 건틀릿", boots: "외근용 청동 각반", accessory: "금빛 넥타이핀" },
  3: { helmet: "야근 뿔 투구", armor: "철야 판금 갑옷", cape: "너덜너덜한 흑망토", gloves: "키보드 파괴 건틀릿", boots: "무거운 퇴근 거부 장화", accessory: "식은 커피잔" },
  4: { helmet: "등산 후드", armor: "이끼색 가죽 재킷", cape: "나뭇잎 망토", gloves: "반장갑", boots: "빨간 끈 등산화", accessory: "황동 나침반" },
  5: { helmet: "날개 달린 은투구", armor: "임원 은갑", cape: "결재 흰 망토", gloves: "은빛 결재 건틀릿", boots: "은빛 사바톤", accessory: "성스러운 메달" },
  6: { helmet: "회장님 왕관 투구", armor: "황금 갑주", cape: "로열 붉은 망토", gloves: "황금 건틀릿", boots: "황금 각반", accessory: "거대 루비 목걸이" },
};

const EFFECTS: Record<number, Record<SuitPart, CostumeEffect>> = {
  1: {
    helmet: { k: "prestigeBelow", v: 0.5, floor: 300 },
    armor: { k: "dmgBelow", v: 2, floor: 300 },
    cape: { k: "sideJob", v: 0.5 },
    gloves: { k: "gold", v: 1 },
    boots: { k: "move", v: 0.2 },
    accessory: { k: "offline", v: 3600 },
  },
  2: {
    helmet: { k: "critDmg", v: 1 },
    armor: { k: "gold", v: 1.5 },
    cape: { k: "sideJob", v: 1 },
    gloves: { k: "boss", v: 1 },
    boots: { k: "cost", v: 0.2 },
    accessory: { k: "dmg", v: 1 },
  },
  3: {
    helmet: { k: "dmg", v: 3 },
    armor: { k: "critChance", v: 0.1 },
    cape: { k: "aspd", v: 0.1 },
    gloves: { k: "boss", v: 2 },
    boots: { k: "bossTime", v: 5 },
    accessory: { k: "critDmg", v: 2 },
  },
  4: {
    helmet: { k: "prestige", v: 0.2 },
    armor: { k: "move", v: 0.3 },
    cape: { k: "sideJob", v: 2 },
    gloves: { k: "gold", v: 3 },
    boots: { k: "offline", v: 7200 },
    accessory: { k: "prestigeFloors", v: 5 },
  },
  5: {
    helmet: { k: "dmg", v: 5 },
    armor: { k: "critDmg", v: 3 },
    cape: { k: "prestigeBelow", v: 0.5, floor: 1000 },
    gloves: { k: "boss", v: 3 },
    boots: { k: "gold", v: 5 },
    accessory: { k: "prestigeFloors", v: 10 },
  },
  6: {
    helmet: { k: "dmg", v: 10 },
    armor: { k: "gold", v: 10 },
    cape: { k: "critDmg", v: 6 },
    gloves: { k: "sideJob", v: 5 },
    boots: { k: "aspd", v: 0.2 },
    accessory: { k: "prestige", v: 0.5 },
  },
};

const SET_PRICE: Record<number, number> = { 1: 40, 2: 120, 3: 220, 4: 320, 5: 420, 6: 550 };

export const SUIT_ITEMS: readonly SuitItem[] = SUIT_SETS.flatMap(({ set }) =>
  SUIT_PARTS.map((p) => ({
    id: `s${set}_${p.key}`, set, part: p.key, name: NAMES[set][p.key], price: SET_PRICE[set], effect: EFFECTS[set][p.key],
  })),
);

const BY_ID = new Map(SUIT_ITEMS.map((i) => [i.id, i]));

export function findSuitItem(id: string): SuitItem | undefined {
  return BY_ID.get(id);
}

// ---- 불꽃 (auras) ----

export type AuraEffect =
  | { k: "apartment"; v: number } // + pyeong
  | { k: "coachLevels"; v: number } // + levels of 커리어코치
  | { k: "perAura"; v: number } // + attack per aura owned
  | { k: "perCostume"; v: number } // + attack per costume owned
  | { k: "per1000Floors"; v: number } // + attack per 1000 of the best floor
  | { k: "goldPerVip"; v: number }; // + kill gold per VIP level

export interface Aura {
  set: number;
  name: string;
  gems: number;
  effect: AuraEffect;
}

export const AURAS: readonly Aura[] = [
  { set: 1, name: "수습의 불꽃", gems: 300, effect: { k: "apartment", v: 7 } },
  { set: 2, name: "영업왕의 불꽃", gems: 600, effect: { k: "coachLevels", v: 10 } },
  { set: 3, name: "흑기사의 불꽃", gems: 800, effect: { k: "perAura", v: 0.4 } },
  { set: 4, name: "레인저의 불꽃", gems: 800, effect: { k: "perCostume", v: 0.03 } },
  { set: 5, name: "성기사의 불꽃", gems: 1000, effect: { k: "per1000Floors", v: 1 } },
  { set: 6, name: "황금의 불꽃", gems: 1200, effect: { k: "goldPerVip", v: 0.56 } },
];

export const AURA_NEEDS: readonly SuitPart[] = ["helmet", "armor", "cape", "gloves", "boots"];

export function auraOpen(owned: readonly string[], set: number): boolean {
  return AURA_NEEDS.every((p) => owned.includes(`s${set}_${p}`));
}

// ---- 전설 코스튬 ----

export type LegendPart = Exclude<SuitPart, "accessory">;

export interface Legend {
  part: LegendPart;
  name: string;
  coupons: number;
  // Level 1's effect and how it grows each level (×growth).
  effect: { k: "dmg" | "prestige" | "critDmg" | "gold" | "perConfirmed"; v: number; growth: number };
}

export const LEGEND_MAX_LEVEL = 5;

export const LEGENDS: readonly Legend[] = [
  { part: "helmet", name: "전설의 투구", coupons: 400, effect: { k: "dmg", v: 5, growth: 5 } },
  { part: "armor", name: "전설의 갑옷", coupons: 400, effect: { k: "prestige", v: 0.2, growth: 2 } },
  { part: "cape", name: "전설의 망토", coupons: 350, effect: { k: "critDmg", v: 4, growth: 5 } },
  { part: "gloves", name: "전설의 장갑", coupons: 350, effect: { k: "gold", v: 10, growth: 10 } },
  { part: "boots", name: "전설의 신발", coupons: 500, effect: { k: "perConfirmed", v: 0.5, growth: 5 } },
];

// 전설 set effects by how many 전설 costumes are owned (all the reached ones apply).
export const LEGEND_SET: readonly { count: number; text: string }[] = [
  { count: 1, text: "처치 골드 +500%" },
  { count: 2, text: "치명타 데미지 +350%" },
  { count: 3, text: "공격력 +350%" },
  { count: 4, text: "연봉협상 응시권 +50%" },
  { count: 5, text: "이동 속도 +10%" },
];

export function legendOpen(owned: readonly string[], part: LegendPart): boolean {
  return SUIT_SETS.every(({ set }) => owned.includes(`s${set}_${part}`));
}

export function legendValue(legend: Legend, level: number): number {
  return level <= 0 ? 0 : legend.effect.v * legend.effect.growth ** (level - 1);
}

// Owned (costumes work from the moment they are bought).
export function hasCostume(s: Pick<GameState, "suits">, id: string): boolean {
  return s.suits.includes(id);
}

// ---- text ----
// Each effect as a pattern for the client to translate (t(key, vars)); see shared/text.ts.

const PCT = (v: number) => `${Math.round(v * 100)}%`;
const pct = (key: string, v: number): Text => ({ key, vars: { v: PCT(v) } });

export function costumeEffectText(e: CostumeEffect): Text {
  switch (e.k) {
    case "dmg": return pct("공격력 +{v}", e.v);
    case "critDmg": return pct("치명타 데미지 +{v}", e.v);
    case "aspd": return pct("공격 속도 +{v}", e.v);
    case "gold": return pct("처치 골드 +{v}", e.v);
    case "sideJob": return pct("부업 수입 +{v}", e.v);
    case "boss": return pct("보스 데미지 +{v}", e.v);
    case "move": return pct("이동 속도 +{v}", e.v);
    case "prestige": return pct("연봉협상 응시권 +{v}", e.v);
    case "critChance": return pct("치명타 확률 +{v}", e.v);
    case "cost": return pct("장비·부업 비용 -{v}", e.v);
    case "bossTime": return { key: "보스 제한시간 +{v}초", vars: { v: e.v } };
    case "offline": return { key: "오프라인 시간 +{v}시간", vars: { v: e.v / 3600 } };
    case "prestigeFloors": return { key: "연봉협상 시 +{v}층으로 계산", vars: { v: e.v } };
    case "dmgBelow": return { key: "{floor}층 이하에서 공격력 +{v}", vars: { floor: e.floor, v: PCT(e.v) } };
    case "prestigeBelow": return { key: "{floor}층 이하 연봉협상 시 응시권 +{v}", vars: { floor: e.floor, v: PCT(e.v) } };
  }
}

export function auraEffectText(e: AuraEffect): Text {
  switch (e.k) {
    case "apartment": return { key: "아파트 +{v}평 효과", vars: { v: e.v } };
    case "coachLevels": return { key: "커리어코치 +{v}레벨 효과", vars: { v: e.v } };
    case "perAura": return pct("보유한 불꽃 1개당 공격력 +{v}", e.v);
    case "perCostume": return pct("보유한 코스튬 1개당 공격력 +{v}", e.v);
    case "per1000Floors": return pct("최고 1000층마다 공격력 +{v}", e.v);
    case "goldPerVip": return pct("VIP 1단계당 처치 골드 +{v}", e.v);
  }
}

export function legendEffectText(l: Legend, level: number): Text {
  const v = legendValue(l, Math.max(1, level));
  switch (l.effect.k) {
    case "dmg": return pct("공격력 +{v}", v);
    case "prestige": return pct("연봉협상 응시권 +{v}", v);
    case "critDmg": return pct("치명타 데미지 +{v}", v);
    case "gold": return pct("처치 골드 +{v}", v);
    case "perConfirmed": return pct("구매확정한 장비 1개당 공격력 +{v}", v);
  }
}
