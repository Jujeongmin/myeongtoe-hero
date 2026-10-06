import type { Big } from "./big";
import { gearLevelCost, gearPrice } from "./data/gear";
import { sideJobCost, type SideJob } from "./data/sideJobs";
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
