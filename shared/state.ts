import { Big } from "./big";
import { BUFF_KINDS, type BuffKind } from "./data/buffs";
import { findCert } from "./data/certs";
import { GEAR_MAX_LEVEL, GEAR_TIERS } from "./data/gear";
import { LEGENDS, SUIT_SETS, findSuitItem, type LegendPart } from "./data/costumes";
import { findEpisode } from "./data/story";
import { findPet } from "./data/pets";
import { findRelic } from "./data/relics";
import { findSideJob } from "./data/sideJobs";

export const SAVE_VERSION = 12;
export const OFFLINE_CAP_SEC = 12 * 3600;
export const START_GOLD = 10;
export const OFFICE_MAX_GRADE = 17;
// 지하주차장 passes stored at most. Re-exported by data/parking.ts.
export const PARK_PASS_MAX = 16;

// Where Park is in the tower this run. `target` counts monsters killed on the floor; `carrySec` is
// time already spent toward the next kill; `farming` means a boss beat him and he is grinding the
// floor below until he is strong enough (see settle.ts).
export interface RunState {
  floor: number;
  target: number;
  carrySec: number;
  farming: boolean;
  maxFloor: number;
  // Extra gear levels bought in the gem shop for this run (gone at a job change).
  gearBoost: number;
}

// What VX purchases left on the save: VX spent in all (VIP), the one-off and timed products, the KST
// day the daily VX gems were last claimed, and the promotion packs bought.
export interface VxState {
  total: number;
  premium: boolean;
  passUntil: number;
  dailyClaimed: string;
  rookie: boolean;
  promos: string[];
}

export interface SideJobState {
  level: number;
  progressSec: number;
  running: boolean;
}

// 사무용품 grades, 1..OFFICE_MAX_GRADE.
export interface OfficeGrades {
  keyboard: number;
  mouse: number;
  chair: number;
  monitor: number;
}

export interface GameState {
  v: number;
  lastTick: number;
  gold: Big;
  run: RunState;
  bestFloor: number;
  // Work gear: the tier in hand, its level (max 5), and how many tiers are 구매확정-ed (kept through job changes).
  gear: { tier: number; level: number; confirmed: number };
  sideJobs: Record<string, SideJobState>;
  // Fields for content not built yet (raids, stocks, … — design §7.5): kept as found.
  reserved: Record<string, unknown>;
  tickets: number;
  gems: number;
  certs: Record<string, number>;
  rngSeed: number;
  prestiges: number;
  coupons: number;
  // Fraction of a ticket from chance drops, carried so splitting settles changes nothing.
  ticketCarry: number;
  // Levels of pets and relics (absent = 1 once it has arrived).
  pets: Record<string, number>;
  relics: Record<string, number>;
  apartment: number;
  // Suit parts owned, and the one worn on each part (part key → item id). What is worn is what
  // counts, and what step 7 draws on Park.
  suits: string[];
  wear: Record<string, string>;
  office: OfficeGrades;
  // 지하주차장: passes held, seconds toward the next one, the deepest run ever.
  // A run lasts until runUntil (server ms) and its result waits in `last` until claimed (`claimed`);
  // the tower waits through both (see PARK_AUTO_CLAIM_MS).
  parking: {
    // runFrom..runUntil: the run's real time (30 s, or 15 s under 배속).
    passes: number; passCarrySec: number; best: number; runFrom: number; runUntil: number;
    last: { depth: number; chests: number; tickets: number } | null; claimed: boolean;
  };
  // Today's parking record for the daily quests (a new day starts fresh when read; see dailyOf).
  daily: { day: string; entries: number; bestDepth: number; claimed: string[] };
  // Step missions done so far, and the special missions already paid.
  missions: { step: number; special: string[] };
  attendance: { lastDay: string; count: number };
  nickname: string;
  // When each timed buff ends (server ms; 0 or past = off).
  buffs: Record<BuffKind, number>;
  // When each ad placement was last watched (server ms).
  ads: Record<string, number>;
  // When the save was made (the rookie pack's 7 days count from here).
  startedAt: number;
  vx: VxState;
  // The last welcome-back reward, claimable once more by an ad until `until`.
  offlineBonus: { gold: string; tickets: number; until: number } | null;
  // 배속: on until `until` (from an ad), or always while `on` for 프리미엄 buyers.
  speed: { until: number; on: boolean };
  costume: CostumeState;
  // 스토리 episodes already read (data/story.ts ids).
  story: string[];
}

// Costumes beyond the owned list (suits) and what is worn (wear): the 불꽃 owned and the one
// shown, and the 전설 costumes' levels.
export interface CostumeState {
  auras: number[];
  aura: number;
  legend: Partial<Record<LegendPart, number>>;
}

export interface SaveData extends Omit<GameState, "gold"> {
  gold: string;
}

function obj(x: unknown): Record<string, unknown> {
  return x && typeof x === "object" && !Array.isArray(x) ? (x as Record<string, unknown>) : {};
}

function int(x: unknown, min: number, fallback: number): number {
  return typeof x === "number" && Number.isInteger(x) && x >= min ? x : fallback;
}

function strings(x: unknown): string[] {
  return Array.isArray(x) ? [...new Set(x.filter((v): v is string => typeof v === "string" && v.length <= 32))] : [];
}

function text(x: unknown, max: number): string {
  return typeof x === "string" && x.length <= max ? x : "";
}

function seconds(x: unknown): number {
  return typeof x === "number" && Number.isFinite(x) && x >= 0 ? x : 0;
}

function gold(x: unknown): Big {
  if (typeof x !== "string") throw new Error("bad_save");
  try {
    return Big.from(x);
  } catch {
    throw new Error("bad_save");
  }
}

// Save version n → n + 1; add one entry each time the version goes up.
const MIGRATIONS: Record<number, (save: Record<string, unknown>) => Record<string, unknown>> = {
  // v2: currencies, stats, certificates, the draw seed and the job-change count.
  1: (save) => ({ ...save, v: 2, tickets: 0, gems: 0, stats: {}, certs: {}, rngSeed: 0, prestiges: 0 }),
  // v3: permanent growth (pets, relics, apartment, suits, office) and coupons. Gear above level 5
  // comes down to 5 (the gear level cap); gold stat upgrades are gone.
  2: (save) => {
    const { stats: _gone, ...rest } = save;
    const gear = obj(save.gear);
    return {
      ...rest, v: 3, coupons: 0, ticketCarry: 0, pets: {}, relics: {}, apartment: 0, suits: [], wear: {},
      office: { keyboard: 1, mouse: 1, chair: 1, monitor: 1 },
      gear: { ...gear, level: Math.min(int(gear.level, 0, 0), GEAR_MAX_LEVEL) },
    };
  },
  // v4: the parking garage (passes full), daily quests, missions, attendance and a nickname.
  3: (save) => ({
    ...save, v: 4,
    parking: { passes: PARK_PASS_MAX, passCarrySec: 0, best: 0 },
    daily: { day: "", entries: 0, bestDepth: 0, claimed: [] },
    missions: { step: 0, special: [] },
    attendance: { lastDay: "", count: 0 },
    nickname: "",
  }),
  // v5: costume slots renamed (투구, 갑옷, 망토, 장갑, 신발, 장신구) for the fantasy
  // look; 구매확정 count on the gear.
  4: (save) => {
    const rename: Record<string, string> = { hair: "helmet", suit: "armor", coat: "cape", gloves: "gloves", shoes: "boots", tie: "accessory" };
    const renamed = (id: unknown) => {
      if (typeof id !== "string") return id;
      const m = /^(s\d+)_(\w+)$/.exec(id);
      return m && rename[m[2]] ? `${m[1]}_${rename[m[2]]}` : id;
    };
    const wear: Record<string, unknown> = {};
    for (const [part, id] of Object.entries(obj(save.wear))) wear[rename[part] ?? part] = renamed(id);
    return {
      ...save, v: 5,
      suits: Array.isArray(save.suits) ? save.suits.map(renamed) : [],
      wear,
      gear: { ...obj(save.gear), confirmed: 0 },
    };
  },
  // v6: 자격증 became a fixed list picked one by one; the old randomly drawn ones are gone.
  5: (save) => ({ ...save, v: 6, certs: {} }),
  // v7: buffs, ad cooldowns, VX purchases, the gem shop's gear boost.
  6: (save) => ({
    ...save, v: 7,
    run: { ...obj(save.run), gearBoost: 0 },
    buffs: {}, ads: {}, startedAt: save.lastTick, vx: {}, offlineBonus: null,
  }),
  // v8: 배속.
  7: (save) => ({ ...save, v: 8, speed: { until: 0, on: false } }),
  // v9: costumes work when owned; rentals, 불꽃, 전설 costumes.
  8: (save) => ({ ...save, v: 9, costume: { auras: [], aura: 0, legend: {} } }),
  // v10: 스토리.
  9: (save) => ({ ...save, v: 10, story: [] }),
  // v11: a parking run takes 30 s of real time.
  10: (save) => ({ ...save, v: 11, parking: { ...obj(save.parking), runUntil: 0, last: null, claimed: true } }),
  // v12: when the run started (배속 halves its real time).
  11: (save) => ({ ...save, v: 12, parking: { ...obj(save.parking), runFrom: Math.max(0, seconds(obj(save.parking).runUntil) - 30_000) } }),
};

export function freshRun(): RunState {
  return { floor: 1, target: 0, carrySec: 0, farming: false, maxFloor: 1, gearBoost: 0 };
}

export function newState(now: number): GameState {
  return {
    v: SAVE_VERSION,
    lastTick: now,
    // Enough to start the first side job.
    gold: Big.of(START_GOLD),
    run: freshRun(),
    bestFloor: 1,
    gear: { tier: 0, level: 0, confirmed: 0 },
    sideJobs: {},
    reserved: {},
    tickets: 0,
    gems: 0,
    certs: {},
    rngSeed: Math.floor(now) >>> 0,
    prestiges: 0,
    coupons: 0,
    ticketCarry: 0,
    pets: {},
    relics: {},
    apartment: 0,
    suits: [],
    wear: {},
    office: { keyboard: 1, mouse: 1, chair: 1, monitor: 1 },
    parking: { passes: PARK_PASS_MAX, passCarrySec: 0, best: 0, runFrom: 0, runUntil: 0, last: null, claimed: true },
    daily: { day: "", entries: 0, bestDepth: 0, claimed: [] },
    missions: { step: 0, special: [] },
    attendance: { lastDay: "", count: 0 },
    nickname: "",
    buffs: { atk: 0, gold: 0, move: 0 },
    ads: {},
    startedAt: now,
    vx: { total: 0, premium: false, passUntil: 0, dailyClaimed: "", rookie: false, promos: [] },
    offlineBonus: null,
    speed: { until: 0, on: false },
    costume: { auras: [], aura: 0, legend: {} },
    story: [],
  };
}

export function cloneState(s: GameState): GameState {
  const sideJobs: Record<string, SideJobState> = {};
  for (const [id, job] of Object.entries(s.sideJobs)) sideJobs[id] = { ...job };
  return {
    ...s, run: { ...s.run }, gear: { ...s.gear }, sideJobs, certs: { ...s.certs },
    pets: { ...s.pets }, relics: { ...s.relics }, suits: [...s.suits], wear: { ...s.wear }, office: { ...s.office },
    parking: { ...s.parking }, daily: { ...s.daily, claimed: [...s.daily.claimed] },
    missions: { ...s.missions, special: [...s.missions.special] }, attendance: { ...s.attendance },
    buffs: { ...s.buffs }, ads: { ...s.ads }, vx: { ...s.vx, promos: [...s.vx.promos] },
    offlineBonus: s.offlineBonus && { ...s.offlineBonus },
    speed: { ...s.speed },
    costume: {
      auras: [...s.costume.auras], aura: s.costume.aura,
      legend: { ...s.costume.legend },
    },
    story: [...s.story],
  };
}

export function toSave(s: GameState): SaveData {
  const c = cloneState(s);
  return { ...c, gold: c.gold.toString() };
}

// Levels keyed by id, kept for ids the table knows and levels ≥ 1.
function levels(x: unknown, known: (id: string) => unknown): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, lv] of Object.entries(obj(x))) {
    if (known(id) && int(lv, 1, 0) >= 1) out[id] = lv as number;
  }
  return out;
}

export function fromSave(raw: unknown): GameState {
  if (!raw || typeof raw !== "object") throw new Error("bad_save");
  let data = raw as Record<string, unknown>;
  const v = data.v;
  if (typeof v !== "number" || !Number.isInteger(v) || v < 1) throw new Error("bad_save");
  if (v > SAVE_VERSION) throw new Error("save_from_future");
  for (let at = v; at < SAVE_VERSION; at++) data = MIGRATIONS[at](data);

  const run = obj(data.run);
  const floor = int(run.floor, 1, 1);
  const sideJobs: Record<string, SideJobState> = {};
  for (const [id, value] of Object.entries(obj(data.sideJobs))) {
    if (!findSideJob(id)) continue;
    const job = obj(value);
    sideJobs[id] = { level: int(job.level, 0, 0), progressSec: seconds(job.progressSec), running: job.running === true };
  }
  const gear = obj(data.gear);
  const certs: Record<string, number> = {};
  for (const [id, level] of Object.entries(obj(data.certs))) {
    const def = findCert(id);
    if (def && int(level, 1, 0) >= 1) certs[id] = Math.min(level as number, def.maxLevel);
  }
  const grade = (x: unknown) => Math.min(OFFICE_MAX_GRADE, int(x, 1, 1));
  const office = obj(data.office);
  const suits = Array.isArray(data.suits)
    ? [...new Set(data.suits.filter((x): x is string => typeof x === "string" && findSuitItem(x) !== undefined))]
    : [];
  const wear: Record<string, string> = {};
  for (const [part, id] of Object.entries(obj(data.wear))) {
    if (typeof id === "string" && suits.includes(id) && id.endsWith(`_${part}`)) wear[part] = id;
  }
  const carry = data.ticketCarry;
  const parking = obj(data.parking);
  const daily = obj(data.daily);
  const missions = obj(data.missions);
  const attendance = obj(data.attendance);
  const vx = obj(data.vx);
  const bonus = obj(data.offlineBonus);
  return {
    v: SAVE_VERSION,
    lastTick: seconds(data.lastTick),
    gold: gold(data.gold),
    run: {
      floor,
      target: int(run.target, 0, 0),
      carrySec: seconds(run.carrySec),
      farming: run.farming === true,
      maxFloor: Math.max(floor, int(run.maxFloor, 1, 1)),
      gearBoost: int(run.gearBoost, 0, 0),
    },
    bestFloor: int(data.bestFloor, 1, 1),
    gear: {
      tier: Math.min(int(gear.tier, 0, 0), GEAR_TIERS.length - 1),
      level: Math.min(int(gear.level, 0, 0), GEAR_MAX_LEVEL),
      confirmed: Math.min(int(gear.confirmed, 0, 0), GEAR_TIERS.length),
    },
    sideJobs,
    reserved: obj(data.reserved),
    tickets: int(data.tickets, 0, 0),
    gems: int(data.gems, 0, 0),
    certs,
    rngSeed: int(data.rngSeed, 0, 0) >>> 0,
    prestiges: int(data.prestiges, 0, 0),
    coupons: int(data.coupons, 0, 0),
    ticketCarry: typeof carry === "number" && carry >= 0 && carry < 1 ? carry : 0,
    pets: levels(data.pets, findPet),
    relics: levels(data.relics, findRelic),
    apartment: int(data.apartment, 0, 0),
    suits,
    wear,
    office: { keyboard: grade(office.keyboard), mouse: grade(office.mouse), chair: grade(office.chair), monitor: grade(office.monitor) },
    parking: {
      // VIP can hold up to 2 more.
      passes: Math.min(PARK_PASS_MAX + 2, int(parking.passes, 0, 0)),
      passCarrySec: seconds(parking.passCarrySec),
      best: int(parking.best, 0, 0),
      runFrom: seconds(parking.runFrom),
      runUntil: seconds(parking.runUntil),
      last: parkingRunOf(obj(parking.last)),
      claimed: parking.claimed !== false,
    },
    daily: {
      day: text(daily.day, 10),
      entries: int(daily.entries, 0, 0),
      bestDepth: int(daily.bestDepth, 0, 0),
      claimed: strings(daily.claimed),
    },
    missions: { step: int(missions.step, 0, 0), special: strings(missions.special) },
    attendance: { lastDay: text(attendance.lastDay, 10), count: int(attendance.count, 0, 0) },
    nickname: text(data.nickname, 16),
    buffs: Object.fromEntries(BUFF_KINDS.map((k) => [k, seconds(obj(data.buffs)[k])])) as Record<BuffKind, number>,
    ads: Object.fromEntries(Object.entries(obj(data.ads)).filter(([, at]) => seconds(at) > 0)) as Record<string, number>,
    startedAt: seconds(data.startedAt),
    vx: {
      total: int(vx.total, 0, 0),
      premium: vx.premium === true,
      passUntil: seconds(vx.passUntil),
      dailyClaimed: text(vx.dailyClaimed, 10),
      rookie: vx.rookie === true,
      promos: strings(vx.promos),
    },
    offlineBonus: seconds(bonus.until) > 0 && typeof bonus.gold === "string"
      ? { gold: gold(bonus.gold).toString(), tickets: int(bonus.tickets, 0, 0), until: seconds(bonus.until) }
      : null,
    speed: { until: seconds(obj(data.speed).until), on: obj(data.speed).on === true },
    costume: costumeOf(obj(data.costume)),
    story: [...new Set(strings(data.story).filter((id) => findEpisode(id)))],
  };
}

function parkingRunOf(l: Record<string, unknown>): GameState["parking"]["last"] {
  return typeof l.depth === "number" ? { depth: int(l.depth, 0, 0), chests: int(l.chests, 0, 0), tickets: int(l.tickets, 0, 0) } : null;
}

function costumeOf(c: Record<string, unknown>): CostumeState {
  const sets: number[] = SUIT_SETS.map((x) => x.set);
  const auras = Array.isArray(c.auras) ? [...new Set(c.auras.filter((x): x is number => sets.includes(x as number)))] : [];
  const legend: Partial<Record<LegendPart, number>> = {};
  for (const l of LEGENDS) {
    const lv = int(obj(c.legend)[l.part], 1, 0);
    if (lv > 0) legend[l.part] = Math.min(5, lv);
  }
  return {
    auras,
    aura: auras.includes(c.aura as number) ? (c.aura as number) : 0,
    legend,
  };
}
