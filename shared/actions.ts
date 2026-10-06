import { Big } from "./big";
import { CERTS, certBonuses, certDrawCost, certLevelCost, certTierOpen, findCert } from "./data/certs";
import { GEAR_TIERS, gearLevelCost, gearPrice } from "./data/gear";
import { BOOSTED_PRESTIGE_GEMS, PRESTIGE_MIN_FLOOR, prestigeReward } from "./data/prestige";
import { findSideJob, sideJobCost } from "./data/sideJobs";
import { findStat, statCost, type StatId } from "./data/stats";
import { nextRandom } from "./rng";
import { cloneState, freshRun, type GameState } from "./state";

// A player's request the rules turned down. `code` goes back to the client as is (ui/text.ts has the
// words for it).
export class RuleError extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "RuleError";
  }
}

export type Intent =
  | { k: "buyGear" }
  | { k: "levelGear" }
  | { k: "levelSideJob"; id: string }
  | { k: "restartSideJob"; id: string }
  | { k: "levelStat"; id: StatId }
  | { k: "buyCert" }
  | { k: "levelCert"; id: string }
  | { k: "prestige"; boosted: boolean };

// Untrusted input (from the network) to an Intent, or null for anything else.
export function readIntent(raw: unknown): Intent | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  switch (r.k) {
    case "buyGear":
    case "levelGear":
      return { k: r.k };
    case "levelSideJob":
    case "restartSideJob":
      return typeof r.id === "string" && r.id.length <= 32 ? { k: r.k, id: r.id } : null;
    case "buyCert":
      return { k: "buyCert" };
    case "levelStat": {
      const def = typeof r.id === "string" ? findStat(r.id) : undefined;
      return def ? { k: "levelStat", id: def.id } : null;
    }
    case "levelCert":
      return typeof r.id === "string" && r.id.length <= 32 ? { k: "levelCert", id: r.id } : null;
    case "prestige":
      return typeof r.boosted === "boolean" ? { k: "prestige", boosted: r.boosted } : null;
    default:
      return null;
  }
}

function spend(s: GameState, cost: Big): void {
  if (s.gold.lt(cost)) throw new RuleError("not_enough_gold");
  s.gold = s.gold.sub(cost);
}

function spendTickets(s: GameState, n: number): void {
  if (s.tickets < n) throw new RuleError("not_enough_tickets");
  s.tickets -= n;
}

function spendGems(s: GameState, n: number): void {
  if (s.gems < n) throw new RuleError("not_enough_gems");
  s.gems -= n;
}

// Applies one intent to a settled state. Returns a new state; throws RuleError when not allowed.
export function applyIntent(state: GameState, intent: Intent): GameState {
  const s = cloneState(state);
  switch (intent.k) {
    case "levelGear": {
      spend(s, gearLevelCost(s.gear.tier, s.gear.level));
      s.gear.level += 1;
      return s;
    }
    case "buyGear": {
      const next = s.gear.tier + 1;
      if (next >= GEAR_TIERS.length) throw new RuleError("max");
      spend(s, gearPrice(next));
      s.gear = { tier: next, level: 0 };
      return s;
    }
    case "levelSideJob": {
      const job = findSideJob(intent.id);
      if (!job) throw new RuleError("unknown");
      if (s.run.maxFloor < job.unlockFloor) throw new RuleError("locked");
      const own = s.sideJobs[job.id] ?? { level: 0, progressSec: 0, running: false };
      spend(s, sideJobCost(job, own.level));
      s.sideJobs[job.id] = own.level === 0
        ? { level: 1, progressSec: 0, running: true }
        : { ...own, level: own.level + 1 };
      return s;
    }
    case "restartSideJob": {
      const own = s.sideJobs[intent.id];
      if (!own || own.level === 0) throw new RuleError("not_owned");
      if (own.running) throw new RuleError("running");
      s.sideJobs[intent.id] = { ...own, running: true, progressSec: 0 };
      return s;
    }
    case "levelStat": {
      const def = findStat(intent.id)!;
      const level = s.stats[def.id];
      if (level >= def.max) throw new RuleError("max");
      spend(s, statCost(def, level));
      s.stats = { ...s.stats, [def.id]: level + 1 };
      return s;
    }
    case "buyCert": {
      const owned = Object.keys(s.certs).length;
      const open = certTierOpen(owned);
      const pool = CERTS.filter((c) => c.tier <= open && !(c.id in s.certs));
      if (pool.length === 0) throw new RuleError("max");
      spendTickets(s, certDrawCost(owned));
      const draw = nextRandom(s.rngSeed);
      s.rngSeed = draw.seed;
      s.certs[pool[Math.floor(draw.value * pool.length)].id] = 1;
      return s;
    }
    case "levelCert": {
      const def = findCert(intent.id);
      const level = s.certs[intent.id];
      if (!def || !level) throw new RuleError("not_owned");
      spendTickets(s, certLevelCost(def, level));
      s.certs[def.id] = level + 1;
      return s;
    }
    case "prestige": {
      if (s.run.maxFloor < PRESTIGE_MIN_FLOOR) throw new RuleError("locked");
      if (intent.boosted) spendGems(s, BOOSTED_PRESTIGE_GEMS);
      const reward = prestigeReward(s.run.maxFloor, certBonuses(s.certs).prestige);
      const mult = intent.boosted ? 2 : 1;
      s.tickets += reward.tickets * mult;
      s.gems += reward.gems * mult;
      s.gold = Big.ZERO;
      s.run = freshRun();
      s.gear = { tier: 0, level: 0 };
      s.sideJobs = {};
      s.stats = { atk: 0, crit: 0, critDmg: 0, aspd: 0 };
      s.prestiges += 1;
      return s;
    }
  }
}
