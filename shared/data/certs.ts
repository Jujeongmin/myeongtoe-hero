// 자격증: a fixed list, each one picked and taken (level 1) and then levelled. Kept across job
// changes.
//
// - 본업 자격증: five lines (공격력, 치명타 데미지, 부업 수입, 처치 골드, 근성) in five grades,
//   기능사 → 산업기사 → 기사 → 기능장 → 기술사. A grade opens once the grade below it is maxed,
//   and each grade multiplies on top of the ones below. Paid in 응시권.
// - 필수 자격증: four small ones with low caps (치명타 확률, 공격 속도, 할인, 부업 수입). 응시권.
// - 이직 자격증: three that raise the 응시권 a job change pays. Paid in 보석.
//
// Costs climb by a fixed step per level (근성기능사: 5% a level). Effects are percentages that grow
// per level; most lines speed up every 25 or 50 levels (see GROWTH).
export type CertGroup = "main" | "basic" | "career";
export type CertLine = "atk" | "crit" | "side" | "gold" | "grit";
export type CertKind =
  | CertLine | "critChance" | "aspd" | "discount" | "sideJob" | "prestige" | "prestigeBoost" | "prestigeFloors";

export interface CertDef {
  id: string;
  name: string;
  group: CertGroup;
  kind: CertKind;
  // 1..5 for 본업 자격증, 0 otherwise.
  grade: number;
  maxLevel: number;
  currency: "tickets" | "gems";
}

export const CERT_GRADES = ["기능사", "산업기사", "기사", "기능장", "기술사"] as const;
export const CERT_LINES: readonly { line: CertLine; name: string; text: string }[] = [
  { line: "atk", name: "타격", text: "공격력" },
  { line: "crit", name: "급소공략", text: "치명타 데미지" },
  { line: "side", name: "투잡관리", text: "부업 수입" },
  { line: "gold", name: "수금", text: "처치 골드" },
  { line: "grit", name: "근성", text: "공격력 추가" },
];
export const CERT_MAX_LEVEL = 99999;
export const GRIT_FIRST_MAX_LEVEL = 200;

const MAIN: CertDef[] = CERT_LINES.flatMap(({ line, name }) =>
  CERT_GRADES.map((g, i) => ({
    id: `${line}${i + 1}`,
    name: name + g,
    group: "main" as const,
    kind: line,
    grade: i + 1,
    maxLevel: line === "grit" && i === 0 ? GRIT_FIRST_MAX_LEVEL : CERT_MAX_LEVEL,
    currency: "tickets" as const,
  })),
);

const BASIC: CertDef[] = [
  { id: "b_crit", name: "사격지도사", kind: "critChance", maxLevel: 45 },
  { id: "b_aspd", name: "워드프로세서", kind: "aspd", maxLevel: 10 },
  { id: "b_cost", name: "구매관리사", kind: "discount", maxLevel: 40 },
  { id: "b_side", name: "시간관리사", kind: "sideJob", maxLevel: 10 },
].map((c) => ({ ...c, group: "basic" as const, grade: 0, currency: "tickets" as const }) as CertDef);

const CAREER: CertDef[] = [
  { id: "c_coach", name: "커리어코치", kind: "prestige", maxLevel: 50 },
  { id: "c_resume", name: "자소서첨삭사", kind: "prestigeBoost", maxLevel: 50 },
  { id: "c_network", name: "인맥관리사", kind: "prestigeFloors", maxLevel: 50 },
].map((c) => ({ ...c, group: "career" as const, grade: 0, currency: "gems" as const }) as CertDef);

export const CERTS: readonly CertDef[] = [...MAIN, ...BASIC, ...CAREER];

export const CERT_KIND_TEXT: Record<CertKind, string> = {
  atk: "공격력", crit: "치명타 데미지", side: "부업 수입", gold: "처치 골드", grit: "공격력 추가",
  critChance: "치명타 확률", aspd: "공격 속도", discount: "장비·부업 비용", sideJob: "부업 수입",
  prestige: "이직 응시권", prestigeBoost: "커리어코치 효과", prestigeFloors: "이직 층수",
};

const BY_ID = new Map(CERTS.map((c) => [c.id, c]));

export function findCert(id: string): CertDef | undefined {
  return BY_ID.get(id);
}

// The grade below in the same line, which has to be maxed first.
export function certPrerequisite(def: CertDef): CertDef | undefined {
  return def.grade > 1 ? findCert(`${def.kind}${def.grade - 1}`) : undefined;
}

export function certOpen(def: CertDef, certs: Record<string, number>): boolean {
  const pre = certPrerequisite(def);
  return !pre || (certs[pre.id] ?? 0) >= pre.maxLevel;
}

// ---- costs ----

// Taking a certificate is its level 0 → 1 cost; after that `base + step × level`.
const LINEAR_COST: Record<string, readonly [number, number]> = {
  atk1: [10, 5], crit1: [20, 10], side1: [20, 10], gold1: [20, 10],
  atk2: [1e6, 1e4], crit2: [2e6, 2e4], side2: [2e6, 2e4], gold2: [2e6, 2e4],
  atk3: [1e9, 1e8], crit3: [1e9, 1e8], side3: [1e9, 1e8], gold3: [1e9, 1e8], grit3: [1e14, 1e13],
  atk4: [1e18, 1e17], crit4: [1e18, 1e17], side4: [1e18, 1e17], gold4: [1e18, 1e17], grit4: [1e33, 1e32],
  atk5: [1e25, 1e24], crit5: [1e25, 1e24], side5: [1e25, 1e24], gold5: [1e25, 1e24], grit5: [1e39, 1e38],
  b_crit: [50, 25], b_aspd: [300, 150], b_cost: [40, 20], b_side: [200, 100],
  c_coach: [200, 200],
};
// 근성기능사 and 근성산업기사 grow by a percentage instead.
const GROWING_COST: Record<string, readonly [number, number]> = {
  grit1: [5e6, 1.05],
  grit2: [1e10, 1.0001],
};
// 자소서첨삭사 and 인맥관리사: 500 보석, 250 more a level, never above 2500.
const CAPPED_COST: Record<string, readonly [number, number, number]> = {
  c_resume: [500, 250, 2500],
  c_network: [500, 250, 2500],
};

// The cost of going from `level` to `level + 1` (level 0: taking it).
export function certLevelCost(def: CertDef, level: number): number {
  const lin = LINEAR_COST[def.id];
  if (lin) return lin[0] + lin[1] * level;
  const grow = GROWING_COST[def.id];
  if (grow) return Math.ceil(grow[0] * grow[1] ** level);
  const cap = CAPPED_COST[def.id];
  if (cap) return Math.min(cap[2], cap[0] + cap[1] * level);
  throw new Error(`no cost for ${def.id}`);
}

// ---- effects ----

// Effects in percent, by blocks of levels: every level in block j adds the same amount v_j; v_0 is
// `start` and `next` gives v_j from v_(j-1).
interface Growth {
  block: number;
  start: number;
  next: (v: number, j: number) => number;
}

const flat = (per: number): Growth => ({ block: Infinity, start: per, next: (v) => v });
// From the 기사 grade up, the step between blocks doubles every 5000 levels.
const doubling = (start: number, block: number): Growth => ({
  block, start, next: (v, j) => v + start * 2 ** Math.floor((j * block) / 5000),
});

const GROWTH: Record<string, Growth> = {
  atk1: { block: 25, start: 15, next: (v) => v + 15 },
  crit1: flat(25),
  side1: { block: 50, start: 10, next: (v) => v + 5 },
  gold1: flat(10),
  grit1: { block: 10, start: 1, next: (v, j) => v * (j <= 14 ? 2 : 4) },
  atk2: { block: 25, start: 0.01, next: (v, j) => v + 0.01 * (1 + Math.floor(j / 4)) },
  crit2: { block: 50, start: 0.01, next: (v) => v + 0.01 },
  side2: { block: 50, start: 0.01, next: (v, j) => v + 0.01 * (1 + Math.floor(j / 2)) },
  gold2: { block: 50, start: 0.01, next: (v) => v + 0.01 },
  grit2: { block: 50, start: 0.1, next: (v) => v * 1.015 },
  atk3: doubling(0.01, 25), crit3: doubling(0.01, 50), side3: doubling(0.01, 50), gold3: doubling(0.01, 50),
  grit3: doubling(0.1, 50),
  atk4: doubling(1, 50), crit4: doubling(1, 50), side4: doubling(1, 50), gold4: doubling(1, 50), grit4: doubling(1, 50),
  atk5: doubling(1, 50), crit5: doubling(1, 50), side5: doubling(1, 50), gold5: doubling(1, 50), grit5: doubling(1, 50),
  b_crit: flat(1),
  b_side: flat(10),
  c_coach: flat(10),
  c_resume: flat(5),
};

const cache = new Map<string, number>();

// What a certificate at this level gives, in percent (b_aspd: levels; b_cost: percent off;
// c_network: extra floors).
export function certValue(def: CertDef, level: number): number {
  if (level <= 0) return 0;
  if (def.id === "b_aspd") return level;
  if (def.id === "b_cost") return 2 * level;
  if (def.id === "c_network") return 5 * level;
  const key = `${def.id}:${level}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const g = GROWTH[def.id];
  let total = 0;
  let v = g.start;
  for (let j = 0, done = 0; done < level; j++) {
    if (j > 0) v = g.next(v, j);
    const n = Math.min(g.block, level - done);
    total += v * n;
    done += n;
  }
  if (cache.size > 4096) cache.clear();
  cache.set(key, total);
  return total;
}

// Park's base attack takes 0.5 s; each 워드프로세서 level takes 0.04 s off.
export const BASE_ATTACK_SEC = 0.5;
export const ASPD_SEC_PER_LEVEL = 0.04;

export interface CertEffects {
  dmgMult: number;
  // Added to the crit bonus (급소공략기능사); the higher grades multiply it.
  critDmgAdd: number;
  critDmgMult: number;
  critChanceAdd: number;
  aspdMult: number;
  sideJobMult: number;
  goldMult: number;
  costMult: number;
  prestigeBonus: number;
  prestigeFloors: number;
}

// `grade3Mult` strengthens the 기사 grade (the 파스 relic).
export function certEffects(certs: Record<string, number>, grade3Mult = 1): CertEffects {
  const e: CertEffects = {
    dmgMult: 1, critDmgAdd: 0, critDmgMult: 1, critChanceAdd: 0, aspdMult: 1,
    sideJobMult: 1, goldMult: 1, costMult: 1, prestigeBonus: 0, prestigeFloors: 0,
  };
  const lv = (id: string) => certs[id] ?? 0;
  for (const def of CERTS) {
    const level = lv(def.id);
    if (level <= 0) continue;
    const pct = certValue(def, level) * (def.grade === 3 ? grade3Mult : 1);
    const mult = 1 + pct / 100;
    switch (def.kind) {
      case "atk":
      case "grit":
        e.dmgMult *= mult;
        break;
      case "crit":
        if (def.grade === 1) e.critDmgAdd += pct / 100;
        else e.critDmgMult *= mult;
        break;
      case "side":
      case "sideJob":
        e.sideJobMult *= mult;
        break;
      case "gold":
        e.goldMult *= mult;
        break;
      case "critChance":
        e.critChanceAdd += pct / 100;
        break;
      case "aspd":
        e.aspdMult = BASE_ATTACK_SEC / (BASE_ATTACK_SEC - ASPD_SEC_PER_LEVEL * level);
        break;
      case "discount":
        e.costMult = 1 - pct / 100;
        break;
    }
  }
  // 커리어코치 +10% a level, made stronger by 자소서첨삭사 (+5% of it a level).
  e.prestigeBonus = (certValue(findCert("c_coach")!, lv("c_coach")) / 100) *
    (1 + certValue(findCert("c_resume")!, lv("c_resume")) / 100);
  e.prestigeFloors = certValue(findCert("c_network")!, lv("c_network"));
  return e;
}

export function certsOwned(certs: Record<string, number>): number {
  return Object.values(certs).filter((l) => l > 0).length;
}
