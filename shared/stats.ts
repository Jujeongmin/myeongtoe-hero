import type { Big } from "./big";
import { gearAtk } from "./data/gear";
import type { GameState } from "./state";

// Park's base hits (the original's knight: 2 a second, 5% crit for +50%). Step 3 adds stat upgrades.
export const HERO_ASPD = 2;
export const HERO_CRIT_CHANCE = 0.05;
export const HERO_CRIT_BONUS = 0.5;

export function heroAtk(s: GameState): Big {
  return gearAtk(s.gear.tier, s.gear.level);
}

// Expected damage a second, crits averaged in: settle works on expectations, so the server and every
// client agree without sharing a random stream.
export function heroDps(s: GameState): Big {
  return heroAtk(s).mulN(HERO_ASPD * (1 + HERO_CRIT_CHANCE * HERO_CRIT_BONUS));
}
