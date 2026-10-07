import { Big } from "./big";
import { BUFFS, buffActive } from "./data/buffs";
import { BOSS_LIMIT_SEC, KILL_GOLD_SHARE, MIN_INCOME_PER_SEC, WALK_SEC } from "./data/floors";
import { findSideJob, sideJobCycle, sideJobIncome } from "./data/sideJobs";
import { prestigeReward } from "./data/prestige";
import { gearAtk } from "./data/gear";
import { mods } from "./mods";
import { OFFLINE_CAP_SEC, type GameState } from "./state";

// Park's base hits: 2 a second, 5% crit for +50%.
export const HERO_ASPD = 2;
export const HERO_CRIT_CHANCE = 0.05;
export const HERO_CRIT_BONUS = 0.5;

// Everything settle needs to know about how strong Park is right now. Expected values only (crits,
// buffs and random pet effects averaged in), so the server and every client agree.
export interface Power {
  dps: Big;
  bossDps: Big;
  bossLimitSec: number;
  goldMult: number;
  hpMult: number;
  drainPerSec: number;
  // Walking time between kills (halved by the 칼퇴 걸음 buff).
  walkSec: number;
  // Seconds between Park's own hits (the screen times one swing to it).
  hitSec: number;
  // Gold for one normal kill (a boss pays a multiple): a share of the side jobs' income per second.
  killGold: Big;
}

export function heroAtk(s: GameState): Big {
  const buff = buffActive(s, "atk") ? BUFFS.atk.mult : 1;
  return gearAtk(s.gear.tier, s.gear.level + s.run.gearBoost).mulN(mods(s).dmgMult * buff);
}

// The side jobs' income per second right now (what kills pay a share of).
export function incomePerSec(s: GameState): Big {
  let q = Big.ZERO;
  for (const [id, own] of Object.entries(s.sideJobs)) {
    const job = findSideJob(id);
    if (!job || own.level <= 0) continue;
    q = q.add(sideJobIncome(job, own.level).mulN(1 / sideJobCycle(job, own.level)));
  }
  return q.mulN(mods(s).sideJobMult);
}

export function heroPower(s: GameState): Power {
  const m = mods(s);
  const atk = heroAtk(s);
  const aspd = HERO_ASPD * m.aspdMult;
  const critBonus = (HERO_CRIT_BONUS + m.critDmgAdd) * m.critDmgMult;
  const critChance = Math.min(1, HERO_CRIT_CHANCE + m.critChanceAdd);
  const hits = atk.mulN(aspd * (1 + critChance * critBonus));
  const dps = m.extraHitPerSec > 0 ? hits.add(atk.mulN(m.extraHitPerSec)) : hits;
  const goldMult = m.goldMult * (buffActive(s, "gold") ? BUFFS.gold.mult : 1);
  const income = incomePerSec(s);
  const q = income.lt(Big.of(MIN_INCOME_PER_SEC)) ? Big.of(MIN_INCOME_PER_SEC) : income;
  return {
    dps,
    bossDps: dps.mulN(m.bossMult),
    bossLimitSec: BOSS_LIMIT_SEC,
    goldMult,
    killGold: q.mulN(KILL_GOLD_SHARE * goldMult),
    hpMult: m.hpMult,
    drainPerSec: m.drainPerSec,
    walkSec: buffActive(s, "move") ? WALK_SEC / BUFFS.move.mult : WALK_SEC,
    hitSec: 1 / aspd,
  };
}

// The gold one kill on the current floor pays right now (buffs and all): what gold rewards from the
// shop and ads are measured in.
export function killGoldNow(s: GameState): Big {
  return heroPower(s).killGold;
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
