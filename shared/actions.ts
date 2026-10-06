import type { Big } from "./big";
import { GEAR_TIERS, gearLevelCost, gearPrice } from "./data/gear";
import { findSideJob, sideJobCost } from "./data/sideJobs";
import { cloneState, type GameState } from "./state";

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
  | { k: "restartSideJob"; id: string };

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
    default:
      return null;
  }
}

function spend(s: GameState, cost: Big): void {
  if (s.gold.lt(cost)) throw new RuleError("not_enough_gold");
  s.gold = s.gold.sub(cost);
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
  }
}
