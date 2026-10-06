import { Big } from "./big";
import { findCert } from "./data/certs";
import { GEAR_TIERS } from "./data/gear";
import { findSideJob } from "./data/sideJobs";

export const SAVE_VERSION = 2;
export const OFFLINE_CAP_SEC = 12 * 3600;

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

export interface StatLevels {
  atk: number;
  crit: number;
  critDmg: number;
  aspd: number;
}

export interface SideJobState {
  level: number;
  progressSec: number;
  running: boolean;
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
  stats: StatLevels;
  certs: Record<string, number>;
  rngSeed: number;
  prestiges: number;
}

export interface SaveData {
  v: number;
  lastTick: number;
  gold: string;
  run: RunState;
  bestFloor: number;
  gear: { tier: number; level: number };
  sideJobs: Record<string, SideJobState>;
  flags: { sideJobAuto: boolean };
  reserved: Record<string, unknown>;
  tickets: number;
  gems: number;
  stats: StatLevels;
  certs: Record<string, number>;
  rngSeed: number;
  prestiges: number;
}

// Save version n → n + 1; add one entry each time the version goes up.
const MIGRATIONS: Record<number, (save: Record<string, unknown>) => Record<string, unknown>> = {
  // v2: currencies, stats, certificates, the draw seed and the job-change count.
  1: (save) => ({ ...save, v: 2, tickets: 0, gems: 0, stats: {}, certs: {}, rngSeed: 0, prestiges: 0 }),
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
    stats: { atk: 0, crit: 0, critDmg: 0, aspd: 0 },
    certs: {},
    rngSeed: Math.floor(now) >>> 0,
    prestiges: 0,
  };
}

export function cloneState(s: GameState): GameState {
  const sideJobs: Record<string, SideJobState> = {};
  for (const [id, job] of Object.entries(s.sideJobs)) sideJobs[id] = { ...job };
  return { ...s, run: { ...s.run }, gear: { ...s.gear }, sideJobs, flags: { ...s.flags }, stats: { ...s.stats }, certs: { ...s.certs } };
}

export function toSave(s: GameState): SaveData {
  const c = cloneState(s);
  return {
    v: c.v, lastTick: c.lastTick, gold: c.gold.toString(), run: c.run, bestFloor: c.bestFloor,
    gear: c.gear, sideJobs: c.sideJobs, flags: c.flags, reserved: c.reserved,
    tickets: c.tickets, gems: c.gems, stats: c.stats, certs: c.certs, rngSeed: c.rngSeed, prestiges: c.prestiges,
  };
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
  const stats = obj(data.stats);
  const certs: Record<string, number> = {};
  for (const [id, level] of Object.entries(obj(data.certs))) {
    if (findCert(id) && int(level, 1, 0) >= 1) certs[id] = level as number;
  }
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
    gear: { tier: Math.min(int(gear.tier, 0, 0), GEAR_TIERS.length - 1), level: int(gear.level, 0, 0) },
    sideJobs,
    flags: { sideJobAuto: obj(data.flags).sideJobAuto === true },
    reserved: obj(data.reserved),
    tickets: int(data.tickets, 0, 0),
    gems: int(data.gems, 0, 0),
    stats: { atk: int(stats.atk, 0, 0), crit: int(stats.crit, 0, 0), critDmg: int(stats.critDmg, 0, 0), aspd: int(stats.aspd, 0, 0) },
    certs,
    rngSeed: int(data.rngSeed, 0, 0) >>> 0,
    prestiges: int(data.prestiges, 0, 0),
  };
}
