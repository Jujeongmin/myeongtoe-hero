// 자격증 (the original's treasures): drawn at random with 응시권 from those not yet owned, then
// levelled with 응시권. Kept across job changes. Each tier is stronger per level but dearer still,
// so value per ticket falls tier by tier.
export type CertKind = "atk" | "gold" | "boss" | "sideJob" | "aspd" | "critDmg" | "prestige" | "offline";

export interface CertDef {
  id: string;
  name: string;
  tier: 1 | 2 | 3;
  kind: CertKind;
  perLevel: number;
}

const KINDS: readonly CertKind[] = ["atk", "gold", "boss", "sideJob", "aspd", "critDmg", "prestige", "offline"];

const KIND_BASE: Record<CertKind, number> = {
  atk: 0.1, gold: 0.1, boss: 0.15, sideJob: 0.1, aspd: 0.01, critDmg: 0.05, prestige: 0.05, offline: 600,
};

export const CERT_KIND_TEXT: Record<CertKind, string> = {
  atk: "공격력", gold: "골드 획득", boss: "보스 데미지", sideJob: "부업 수입",
  aspd: "공격 속도", critDmg: "치명타 데미지", prestige: "이직 보상", offline: "오프라인 시간",
};

const TIER_MULT = { 1: 1, 2: 3, 3: 10 } as const;
const TIER_LEVEL_COST = { 1: 1, 2: 5, 3: 25 } as const;
export const CERT_LEVEL_COST_GROWTH = 1.12;
export const CERT_TIER2_AT = 10;
export const CERT_TIER3_AT = 25;

const NAMES: readonly (readonly [1 | 2 | 3, string])[] = [
  [1, "운전면허 2종"], [1, "컴활 2급"], [1, "워드프로세서"], [1, "한자 3급"], [1, "토익 600"],
  [1, "한국사 3급"], [1, "바리스타 2급"], [1, "지게차 운전"], [1, "정보처리기능사"], [1, "전산회계 2급"],
  [1, "제과기능사"], [1, "한식조리기능사"], [1, "굴삭기 운전"], [1, "무선통신사"], [1, "요가 지도자"],
  [2, "1종 대형면허"], [2, "컴활 1급"], [2, "토익 900"], [2, "한국사 1급"], [2, "정보처리기사"],
  [2, "전기기사"], [2, "공인중개사"], [2, "주택관리사"], [2, "사회조사분석사"], [2, "빅데이터분석기사"],
  [2, "산업안전기사"], [2, "소방설비기사"], [2, "행정사"], [2, "손해평가사"], [2, "투자자산운용사"],
  [3, "감정평가사"], [3, "세무사"], [3, "공인노무사"], [3, "변리사"], [3, "관세사"],
  [3, "법무사"], [3, "공인회계사"], [3, "기술사"], [3, "손해사정사"], [3, "보험계리사"],
];

export const CERTS: readonly CertDef[] = NAMES.map(([tier, name], i) => {
  const kind = KINDS[i % KINDS.length];
  return { id: `c${String(i).padStart(2, "0")}`, name, tier, kind, perLevel: KIND_BASE[kind] * TIER_MULT[tier] };
});

const BY_ID = new Map(CERTS.map((c) => [c.id, c]));

export function findCert(id: string): CertDef | undefined {
  return BY_ID.get(id);
}

export function certDrawCost(owned: number): number {
  return 1 + owned;
}

// The cost of going from `level` to `level + 1`.
export function certLevelCost(def: CertDef, level: number): number {
  return Math.ceil(TIER_LEVEL_COST[def.tier] * CERT_LEVEL_COST_GROWTH ** (level - 1));
}

export function certTierOpen(owned: number): 1 | 2 | 3 {
  if (owned >= CERT_TIER3_AT) return 3;
  if (owned >= CERT_TIER2_AT) return 2;
  return 1;
}

export interface Bonuses {
  atk: number;
  gold: number;
  boss: number;
  sideJob: number;
  aspd: number;
  critDmg: number;
  prestige: number;
  offlineSec: number;
}

// `tier3Mult` strengthens tier-3 certificates (the 파스 relic).
export function certBonuses(certs: Record<string, number>, tier3Mult = 1): Bonuses {
  const b: Bonuses = { atk: 0, gold: 0, boss: 0, sideJob: 0, aspd: 0, critDmg: 0, prestige: 0, offlineSec: 0 };
  for (const [id, level] of Object.entries(certs)) {
    const def = findCert(id);
    if (!def) continue;
    const add = def.perLevel * level * (def.tier === 3 ? tier3Mult : 1);
    if (def.kind === "offline") b.offlineSec += add;
    else b[def.kind] += add;
  }
  return b;
}
