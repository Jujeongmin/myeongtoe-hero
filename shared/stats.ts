import type { Big } from "./big";
import { BOSS_LIMIT_SEC } from "./data/floors";
import { gearAtk } from "./data/gear";
import { skillFactor, skillsUnlocked } from "./data/skills";
import { STAT_ASPD_PER_LEVEL, STAT_ATK_PER_LEVEL, STAT_CRITDMG_PER_LEVEL, STAT_CRIT_PER_LEVEL } from "./data/stats";
import type { GameState } from "./state";

// Park's base hits (the original's knight: 2 a second, 5% crit for +50%).
export const HERO_ASPD = 2;
export const HERO_CRIT_CHANCE = 0.05;
export const HERO_CRIT_BONUS = 0.5;

// Everything settle needs to know about how strong Park is right now. Expected values only (crits
// and skills averaged in), so the server and every client agree without a shared random stream.
export interface Power {
  dps: Big;
  bossDps: Big;
  bossLimitSec: number;
  goldMult: number;
}

function skillProduct(s: GameState, kind: string): number {
  return skillsUnlocked(s.bestFloor)
    .filter((k) => k.kind === kind)
    .reduce((m, k) => m * skillFactor(k), 1);
}

export function heroAtk(s: GameState): Big {
  return gearAtk(s.gear.tier, s.gear.level).mulN(1 + STAT_ATK_PER_LEVEL * s.stats.atk);
}

export function heroPower(s: GameState): Power {
  const aspd = HERO_ASPD * (1 + STAT_ASPD_PER_LEVEL * s.stats.aspd) * skillProduct(s, "aspd");
  const crit = Math.min(1, HERO_CRIT_CHANCE + STAT_CRIT_PER_LEVEL * s.stats.crit);
  const critBonus = HERO_CRIT_BONUS + STAT_CRITDMG_PER_LEVEL * s.stats.critDmg;
  const dps = heroAtk(s).mulN(aspd * (1 + crit * critBonus) * skillProduct(s, "damage"));
  const bossTime = skillsUnlocked(s.bestFloor)
    .filter((k) => k.kind === "bossTime")
    .reduce((sum, k) => sum + k.value, 0);
  return { dps, bossDps: dps, bossLimitSec: BOSS_LIMIT_SEC + bossTime, goldMult: skillProduct(s, "gold") };
}

export function heroDps(s: GameState): Big {
  return heroPower(s).dps;
}
