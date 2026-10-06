import { Big } from "./big";
import { findCert } from "./data/certs";
import { GEAR_MAX_LEVEL, GEAR_TIERS } from "./data/gear";
import { findSuitItem } from "./data/home";
import { findPet } from "./data/pets";
import { findRelic } from "./data/relics";
import { findSideJob } from "./data/sideJobs";

export const SAVE_VERSION = 3;
export const OFFLINE_CAP_SEC = 12 * 3600;
export const OFFICE_MAX_GRADE = 17;

// Where Park is in the tower this run. `target` counts monsters killed on the floor; `carrySec` is
// time already spent toward the next kill; `farming` means a boss beat him and he is grinding the
// floor below until he is strong enough (see settle.ts).
export interface RunState {
  floor: number;
  target: number;
  carrySec: number;
  farming: boolean;
  maxFloor: number;
}

export interface SideJobState {
  level: number;
  progressSec: number;
  running: boolean;
}

// 사무용품 (the original's 마왕성 gear) grades, 1..OFFICE_MAX_GRADE.
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
  gear: { tier: number; level: number };
  sideJobs: Record<string, SideJobState>;
  flags: { sideJobAuto: boolean };
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
  // comes down to 5 (the original's weapon rule); gold stat upgrades are gone.
  2: (save) => {
    const { stats: _gone, ...rest } = save;
    const gear = obj(save.gear);
    return {
      ...rest, v: 3, coupons: 0, ticketCarry: 0, pets: {}, relics: {}, apartment: 0, suits: [], wear: {},
      office: { keyboard: 1, mouse: 1, chair: 1, monitor: 1 },
      gear: { ...gear, level: Math.min(int(gear.level, 0, 0), GEAR_MAX_LEVEL) },
    };
  },
};

export function freshRun(): RunState {
  return { floor: 1, target: 0, carrySec: 0, farming: false, maxFloor: 1 };
}

export function newState(now: number): GameState {
  return {
    v: SAVE_VERSION,
    lastTick: now,
    gold: Big.ZERO,
    run: freshRun(),
    bestFloor: 1,
    gear: { tier: 0, level: 0 },
    sideJobs: {},
    flags: { sideJobAuto: false },
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
  };
}

export function cloneState(s: GameState): GameState {
  const sideJobs: Record<string, SideJobState> = {};
  for (const [id, job] of Object.entries(s.sideJobs)) sideJobs[id] = { ...job };
  return {
    ...s, run: { ...s.run }, gear: { ...s.gear }, sideJobs, flags: { ...s.flags }, certs: { ...s.certs },
    pets: { ...s.pets }, relics: { ...s.relics }, suits: [...s.suits], wear: { ...s.wear }, office: { ...s.office },
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
    if (findCert(id) && int(level, 1, 0) >= 1) certs[id] = level as number;
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
    },
    bestFloor: int(data.bestFloor, 1, 1),
    gear: { tier: Math.min(int(gear.tier, 0, 0), GEAR_TIERS.length - 1), level: Math.min(int(gear.level, 0, 0), GEAR_MAX_LEVEL) },
    sideJobs,
    flags: { sideJobAuto: obj(data.flags).sideJobAuto === true },
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
  };
}
