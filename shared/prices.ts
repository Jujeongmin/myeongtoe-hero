import type { Big } from "./big";
import { gearLevelCost, gearPrice } from "./data/gear";
import { SIDE_JOB_MAX_LEVEL, sideJobCost, type SideJob } from "./data/sideJobs";
import { mods } from "./mods";
import type { GameState } from "./state";

// Gold prices with 구매관리사's discount applied. Actions charge these and the panels show them.
export function gearPriceFor(s: GameState, tier: number): Big {
  return gearPrice(tier).mulN(mods(s).costMult);
}

export function gearLevelCostFor(s: GameState, tier: number, level: number): Big {
  return gearLevelCost(tier, level).mulN(mods(s).costMult);
}

export function sideJobCostFor(s: GameState, job: SideJob, level: number): Big {
  return sideJobCost(job, level).mulN(mods(s).costMult);
}

// What buying `count` levels of a side job from `level` would do with `gold`: how many levels and
// what they cost together (the same walk the levelSideJob action makes: the first level is always
// charged, the rest only while the gold lasts).
export function sideJobBuy(s: GameState, job: SideJob, level: number, count: 1 | 10 | "max"): { levels: number; cost: Big } {
  const want = count === "max" ? SIDE_JOB_MAX_LEVEL - level : Math.min(count, SIDE_JOB_MAX_LEVEL - level);
  let cost = sideJobCostFor(s, job, level);
  let levels = 1;
  while (levels < want) {
    const next = sideJobCostFor(s, job, level + levels);
    if (s.gold.lt(cost.add(next))) break;
    cost = cost.add(next);
    levels += 1;
  }
  return { levels, cost };
}
