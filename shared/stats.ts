import type { Big } from "./big";
import { BUFFS, buffActive } from "./data/buffs";
import { BOSS_LIMIT_SEC, WALK_SEC, killGold } from "./data/floors";
import { prestigeReward } from "./data/prestige";
import { gearAtk } from "./data/gear";
import { skillFactor, skillsUnlocked } from "./data/skills";
import { mods } from "./mods";
import { OFFLINE_CAP_SEC, type GameState } from "./state";

// Park's base hits: 2 a second, 5% crit for +50%.
export const HERO_ASPD = 2;
export const HERO_CRIT_CHANCE = 0.05;
export const HERO_CRIT_BONUS = 0.5;

// Everything settle needs to know about how strong Park is right now. Expected values only (crits,
// skills and random pet effects averaged in), so the server and every client agree.
export interface Power {
  dps: Big;
  bossDps: Big;
  bossLimitSec: number;
  goldMult: number;
  hpMult: number;
  drainPerSec: number;
  // Walking time between kills (halved by the 칼퇴 걸음 buff).
  walkSec: number;
}

function skillProduct(s: GameState, kind: string): number {
  return skillsUnlocked(s.bestFloor)
    .filter((k) => k.kind === kind)
    .reduce((m, k) => m * skillFactor(k), 1);
}

export function heroAtk(s: GameState): Big {
  const buff = buffActive(s, "atk") ? BUFFS.atk.mult : 1;
  return gearAtk(s.gear.tier, s.gear.level + s.run.gearBoost).mulN(mods(s).dmgMult * buff);
}

export function heroPower(s: GameState): Power {
  const m = mods(s);
  const atk = heroAtk(s);
  const aspd = HERO_ASPD * m.aspdMult * skillProduct(s, "aspd");
  const critBonus = (HERO_CRIT_BONUS + m.critDmgAdd) * m.critDmgMult;
  const critChance = Math.min(1, HERO_CRIT_CHANCE + m.critChanceAdd);
  const hits = atk.mulN(aspd * (1 + critChance * critBonus) * skillProduct(s, "damage"));
  const dps = m.extraHitPerSec > 0 ? hits.add(atk.mulN(m.extraHitPerSec)) : hits;
  const bossTime = skillsUnlocked(s.bestFloor)
    .filter((k) => k.kind === "bossTime")
    .reduce((sum, k) => sum + k.value, 0);
  return {
    dps,
    bossDps: dps.mulN(m.bossMult),
    bossLimitSec: BOSS_LIMIT_SEC + bossTime,
    goldMult: skillProduct(s, "gold") * m.goldMult * (buffActive(s, "gold") ? BUFFS.gold.mult : 1),
    hpMult: m.hpMult,
    drainPerSec: m.drainPerSec,
    walkSec: buffActive(s, "move") ? WALK_SEC / BUFFS.move.mult : WALK_SEC,
  };
}

// The gold one kill on the current floor pays right now (buffs and all): what gold rewards from the
// shop and ads are measured in.
export function killGoldNow(s: GameState): Big {
  return killGold(s.run.floor).mulN(heroPower(s).goldMult);
}

export function heroDps(s: GameState): Big {
  return heroPower(s).dps;
}

// What a job change now would pay: 응시권 count from the best floor stretched by 공주임 and with
// 인맥관리사's floors added.
export function jobChangeReward(s: GameState): { tickets: number; gems: number } {
  const m = mods(s);
  const floor = s.run.maxFloor;
  return prestigeReward(floor, m.prestigeBonus, Math.floor(floor * m.prestigeFloorMult) + m.prestigeFloorAdd);
}

export function offlineCapSec(s: GameState): number {
  return OFFLINE_CAP_SEC + mods(s).offlineSec;
}
