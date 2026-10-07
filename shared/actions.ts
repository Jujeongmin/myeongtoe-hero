import { Big } from "./big";
import { certLevelCost, certOpen, findCert } from "./data/certs";
import { GEAR_MAX_LEVEL, GEAR_TIERS, gearConfirmCost } from "./data/gear";
import { OFFICE_PARTS, apartmentCost, officeUpgradeCost, type OfficePart } from "./data/home";
import {
  AURAS, LEGENDS, LEGEND_MAX_LEVEL, SUIT_PARTS, auraOpen, findSuitItem, hasCostume, legendOpen,
} from "./data/costumes";
import { episodeOpen, findEpisode } from "./data/story";
import { MONSTERS_PER_FLOOR } from "./data/floors";
import { AD_BUFF_MS, AD_COUPONS, AD_GEMS_MAX, AD_GEMS_MIN, AD_GOLD_KILLS, adReadyAt, findAd } from "./data/ads";
import { BUFF_KINDS, extendBuff, type BuffKind } from "./data/buffs";
import { SPEED_AD_MS, SPEED_MULT, speedActive } from "./data/speed";
import { dailyQuestReward, findDailyQuest } from "./data/dailyQuests";
import { BUFF_MS, findGemItem } from "./data/gemShop";
import { ATTENDANCE_REWARDS, STEP_MISSIONS, findSpecialMission, type Reward } from "./data/missions";
import { PARK_RUN_SEC, runParking } from "./data/parking";
import { dailyVxClaimed, dailyVxGems } from "./data/shop";
import { dailyOf } from "./daily";
import { PET_BOX_COUPONS, findPet, petLevelCost, petsUnlocked } from "./data/pets";
import { PRESTIGE_MIN_FLOOR, PRESTIGE_MODES, type PrestigeMode } from "./data/prestige";
import { findRelic, relicLevelCost } from "./data/relics";
import { SIDE_JOB_MAX_LEVEL, findSideJob } from "./data/sideJobs";
import { parkPassMax, petLevel, relicLevel } from "./mods";
import { vipPerks } from "./vip";
import { nextRandom } from "./rng";
import { gearLevelCostFor, gearPriceFor, sideJobCostFor } from "./prices";
import { heroPower, jobChangeReward, killGoldNow } from "./stats";
import { kstDay } from "./time";
import { OFFICE_MAX_GRADE, cloneState, freshRun, type GameState } from "./state";

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
  // Takes a certificate (level 0 → 1) or levels it; `bulk` keeps going while it can pay.
  | { k: "levelCert"; id: string; bulk: boolean }
  | { k: "prestige"; mode: PrestigeMode }
  | { k: "levelPet"; id: string }
  | { k: "petBox" }
  | { k: "levelRelic"; id: string }
  | { k: "expandApartment" }
  | { k: "buySuit"; id: string }
  | { k: "wearSuit"; id: string }
  | { k: "takeOffSuit"; part: string }
  | { k: "buyAura"; set: number }
  | { k: "wearAura"; set: number }
  | { k: "levelLegend"; part: string }
  | { k: "readStory"; id: string }
  | { k: "challengeBoss" }
  | { k: "claimParking" }
  | { k: "upgradeOffice"; part: OfficePart }
  | { k: "enterParking" }
  | { k: "claimDaily"; id: string }
  | { k: "claimStep" }
  | { k: "claimSpecial"; id: string }
  | { k: "claimAttendance" }
  | { k: "confirmGear" }
  | { k: "buyGemItem"; id: string }
  | { k: "watchAd"; id: string }
  | { k: "claimDailyVx" }
  | { k: "toggleSpeed" };

// Untrusted input (from the network) to an Intent, or null for anything else.
export function readIntent(raw: unknown): Intent | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  switch (r.k) {
    case "buyGear":
    case "levelGear":
      return { k: r.k };
    case "buyGemItem":
    case "watchAd":
      return typeof r.id === "string" && r.id.length <= 32 ? { k: r.k, id: r.id } : null;
    case "levelSideJob":
      return typeof r.id === "string" && r.id.length <= 32 ? { k: r.k, id: r.id } : null;
    case "levelCert":
      return typeof r.id === "string" && r.id.length <= 32 && typeof r.bulk === "boolean"
        ? { k: "levelCert", id: r.id, bulk: r.bulk }
        : null;
    case "prestige":
      return r.mode === "plain" || r.mode === "boosted" || r.mode === "super" ? { k: "prestige", mode: r.mode } : null;
    case "petBox":
    case "expandApartment":
    case "enterParking":
    case "claimStep":
    case "claimAttendance":
    case "confirmGear":
    case "claimDailyVx":
    case "toggleSpeed":
    case "challengeBoss":
    case "claimParking":
      return { k: r.k };
    case "levelPet":
    case "levelRelic":
    case "buySuit":
    case "wearSuit":
    case "claimDaily":
    case "claimSpecial":
    case "readStory":
      return typeof r.id === "string" && r.id.length <= 32 ? { k: r.k, id: r.id } : null;
    case "takeOffSuit":
    case "levelLegend":
      return SUIT_PARTS.some((p) => p.key === r.part) ? { k: r.k, part: r.part as string } : null;
    case "buyAura":
    case "wearAura":
      return Number.isInteger(r.set) && (r.set as number) >= 0 && (r.set as number) <= 6 ? { k: r.k, set: r.set as number } : null;
    case "upgradeOffice":
      return OFFICE_PARTS.some((p) => p.key === r.part) ? { k: "upgradeOffice", part: r.part as OfficePart } : null;
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

function spendCoupons(s: GameState, n: number): void {
  if (s.coupons < n) throw new RuleError("not_enough_coupons");
  s.coupons -= n;
}

function grant(s: GameState, r: Reward): void {
  s.gems += r.gems ?? 0;
  s.tickets += r.tickets ?? 0;
  s.coupons += r.coupons ?? 0;
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
      if (s.gear.level >= GEAR_MAX_LEVEL) throw new RuleError("max");
      spend(s, gearLevelCostFor(s, s.gear.tier, s.gear.level));
      s.gear.level += 1;
      return s;
    }
    case "buyGear": {
      const next = s.gear.tier + 1;
      if (next >= GEAR_TIERS.length) throw new RuleError("max");
      if (s.gear.level < GEAR_MAX_LEVEL) throw new RuleError("locked");
      spend(s, gearPriceFor(s, next));
      s.gear = { tier: next, level: 0, confirmed: s.gear.confirmed };
      return s;
    }
    case "levelSideJob": {
      const job = findSideJob(intent.id);
      if (!job) throw new RuleError("unknown");
      if (s.run.maxFloor < job.unlockFloor) throw new RuleError("locked");
      const own = s.sideJobs[job.id] ?? { level: 0, progressSec: 0, running: false };
      if (own.level >= SIDE_JOB_MAX_LEVEL) throw new RuleError("max");
      spend(s, sideJobCostFor(s, job, own.level));
      s.sideJobs[job.id] = own.level === 0
        ? { level: 1, progressSec: 0, running: true }
        : { ...own, level: own.level + 1 };
      return s;
    }
    case "levelCert": {
      const def = findCert(intent.id);
      if (!def) throw new RuleError("unknown");
      if (!certOpen(def, s.certs)) throw new RuleError("locked");
      let level = s.certs[def.id] ?? 0;
      if (level >= def.maxLevel) throw new RuleError("max");
      const pay = def.currency === "gems" ? spendGems : spendTickets;
      pay(s, certLevelCost(def, level));
      level += 1;
      if (intent.bulk) {
        for (; level < def.maxLevel; level++) {
          const cost = certLevelCost(def, level);
          if ((def.currency === "gems" ? s.gems : s.tickets) < cost) break;
          pay(s, cost);
        }
      }
      s.certs[def.id] = level;
      return s;
    }
    case "prestige": {
      if (s.run.maxFloor < PRESTIGE_MIN_FLOOR) throw new RuleError("locked");
      const mode = PRESTIGE_MODES[intent.mode];
      spendGems(s, mode.gems);
      const reward = jobChangeReward(s);
      s.tickets += reward.tickets * mode.ticketMult;
      s.gems += reward.gems;
      s.gold = Big.ZERO;
      s.run = freshRun();
      // 구매확정-ed tiers stay: the last of them in hand at Lv5, so the next can be bought at once.
      s.gear = s.gear.confirmed > 0
        ? { tier: s.gear.confirmed - 1, level: GEAR_MAX_LEVEL, confirmed: s.gear.confirmed }
        : { tier: 0, level: 0, confirmed: 0 };
      s.sideJobs = {};
      s.prestiges += 1;
      return s;
    }
    case "levelPet": {
      const pet = findPet(intent.id);
      if (!pet) throw new RuleError("unknown");
      if (s.bestFloor < pet.unlockFloor) throw new RuleError("locked");
      const level = petLevel(s, pet.id);
      spendGems(s, petLevelCost(level));
      s.pets[pet.id] = level + 1;
      return s;
    }
    case "petBox": {
      const pool = petsUnlocked(s.bestFloor);
      if (pool.length === 0) throw new RuleError("locked");
      spendCoupons(s, PET_BOX_COUPONS);
      const draw = nextRandom(s.rngSeed);
      s.rngSeed = draw.seed;
      const pet = pool[Math.floor(draw.value * pool.length)];
      s.pets[pet.id] = petLevel(s, pet.id) + 1;
      return s;
    }
    case "levelRelic": {
      const relic = findRelic(intent.id);
      if (!relic) throw new RuleError("unknown");
      if (s.bestFloor < relic.unlockFloor) throw new RuleError("locked");
      const level = relicLevel(s, relic.id);
      spendGems(s, relicLevelCost(level));
      s.relics[relic.id] = level + 1;
      return s;
    }
    case "expandApartment": {
      spendGems(s, apartmentCost(s.apartment));
      s.apartment += 1;
      return s;
    }
    case "buySuit": {
      const item = findSuitItem(intent.id);
      if (!item) throw new RuleError("unknown");
      if (s.suits.includes(item.id)) throw new RuleError("owned");
      spendCoupons(s, item.price);
      s.suits = [...s.suits, item.id];
      if (!s.wear[item.part]) s.wear = { ...s.wear, [item.part]: item.id };
      return s;
    }
    case "wearSuit": {
      const item = findSuitItem(intent.id);
      if (!item || !hasCostume(s, item.id)) throw new RuleError("not_owned");
      s.wear = { ...s.wear, [item.part]: item.id };
      return s;
    }
    case "takeOffSuit": {
      const wear = { ...s.wear };
      delete wear[intent.part];
      s.wear = wear;
      return s;
    }
    case "buyAura": {
      const aura = AURAS.find((a) => a.set === intent.set);
      if (!aura) throw new RuleError("unknown");
      if (s.costume.auras.includes(aura.set)) throw new RuleError("owned");
      if (!auraOpen(s.suits, aura.set)) throw new RuleError("locked");
      spendGems(s, aura.gems);
      s.costume = { ...s.costume, auras: [...s.costume.auras, aura.set], aura: aura.set };
      return s;
    }
    case "wearAura": {
      if (intent.set !== 0 && !s.costume.auras.includes(intent.set)) throw new RuleError("not_owned");
      s.costume = { ...s.costume, aura: intent.set };
      return s;
    }
    case "levelLegend": {
      const legend = LEGENDS.find((l) => l.part === intent.part);
      if (!legend) throw new RuleError("unknown");
      if (!legendOpen(s.suits, legend.part)) throw new RuleError("locked");
      const lv = s.costume.legend[legend.part] ?? 0;
      if (lv >= LEGEND_MAX_LEVEL) throw new RuleError("max");
      spendCoupons(s, legend.coupons);
      s.costume = { ...s.costume, legend: { ...s.costume.legend, [legend.part]: lv + 1 } };
      return s;
    }
    case "enterParking": {
      if (s.parking.passes <= 0) throw new RuleError("no_pass");
      if (s.parking.runUntil > s.lastTick || !s.parking.claimed) throw new RuleError("busy");
      const run = runParking(heroPower(s));
      const today = dailyOf(s);
      s.parking = {
        ...s.parking, passes: s.parking.passes - 1, best: Math.max(s.parking.best, run.depth),
        // 배속 plays the same 30 seconds in half the real time.
        runFrom: s.lastTick, runUntil: s.lastTick + (PARK_RUN_SEC * 1000) / (speedActive(s) ? SPEED_MULT : 1), last: run, claimed: false,
      };
      s.daily = { ...today, claimed: [...today.claimed], entries: today.entries + 1, bestDepth: Math.max(today.bestDepth, run.depth) };
      return s;
    }
    case "claimDaily": {
      const quest = findDailyQuest(intent.id);
      if (!quest) throw new RuleError("unknown");
      const today = dailyOf(s);
      if (today.claimed.includes(quest.id)) throw new RuleError("claimed");
      const value = quest.kind === "entries" ? today.entries : today.bestDepth;
      if (value < quest.goal) throw new RuleError("not_done");
      s.coupons += dailyQuestReward(quest, s.lastTick);
      s.daily = { ...today, claimed: [...today.claimed, quest.id] };
      return s;
    }
    case "buyGemItem": {
      const item = findGemItem(intent.id);
      if (!item) throw new RuleError("unknown");
      spendGems(s, item.gems);
      if (item.kind === "buff") extendBuff(s, item.buff, BUFF_MS);
      else if (item.kind === "gold") s.gold = s.gold.add(killGoldNow(s).mulN(item.kills));
      else s.run = { ...s.run, gearBoost: s.run.gearBoost + 1 };
      return s;
    }
    case "watchAd": {
      const ad = findAd(intent.id);
      if (!ad) throw new RuleError("unknown");
      if (s.lastTick < adReadyAt(s, ad)) throw new RuleError("cooldown");
      switch (ad.id) {
        case "ad_speed":
          s.speed = { ...s.speed, until: Math.max(s.speed.until, s.lastTick) + SPEED_AD_MS };
          break;
        case "ad_gems": {
          const draw = nextRandom(s.rngSeed);
          s.rngSeed = draw.seed;
          s.gems += AD_GEMS_MIN + Math.floor(draw.value * (AD_GEMS_MAX - AD_GEMS_MIN + 1));
          break;
        }
        case "ad_gold":
          s.gold = s.gold.add(killGoldNow(s).mulN(AD_GOLD_KILLS));
          break;
        case "ad_buff_atk":
        case "ad_buff_gold":
        case "ad_buff_move":
          extendBuff(s, ad.id.slice("ad_buff_".length) as BuffKind, AD_BUFF_MS * vipPerks(s).adBuffMult);
          break;
        case "ad_coupons":
          s.coupons += AD_COUPONS;
          break;
        case "ad_parking":
          if (s.parking.passes >= parkPassMax(s)) throw new RuleError("max");
          s.parking = { ...s.parking, passes: s.parking.passes + 1 };
          break;
        case "ad_offline": {
          const bonus = s.offlineBonus;
          if (!bonus || s.lastTick > bonus.until) throw new RuleError("not_done");
          s.gold = s.gold.add(Big.from(bonus.gold));
          s.tickets += bonus.tickets;
          s.offlineBonus = null;
          break;
        }
      }
      s.ads = { ...s.ads, [ad.id]: s.lastTick };
      return s;
    }
    case "toggleSpeed": {
      if (!s.vx.premium) throw new RuleError("locked");
      s.speed = { ...s.speed, on: !s.speed.on };
      return s;
    }
    case "claimParking": {
      // The run is over: its 응시권, and the tower goes on.
      if (s.parking.claimed || !s.parking.last) throw new RuleError("claimed");
      if (s.parking.runUntil > s.lastTick) throw new RuleError("busy");
      s.tickets += s.parking.last.tickets;
      s.parking = { ...s.parking, claimed: true };
      return s;
    }
    case "challengeBoss": {
      // Farming: try the floor's boss now (too weak, it runs out of time and farming goes on).
      if (!s.run.farming) throw new RuleError("not_farming");
      s.run = { ...s.run, farming: false, target: MONSTERS_PER_FLOOR - 1, carrySec: 0 };
      return s;
    }
    case "readStory": {
      const ep = findEpisode(intent.id);
      if (!ep) throw new RuleError("unknown");
      if (!episodeOpen(ep, s)) throw new RuleError("locked");
      if (!s.story.includes(ep.id)) s.story = [...s.story, ep.id];
      return s;
    }
    case "claimDailyVx": {
      const gems = dailyVxGems(s);
      if (gems === 0) throw new RuleError("locked");
      if (dailyVxClaimed(s)) throw new RuleError("claimed");
      s.gems += gems;
      s.vx = { ...s.vx, dailyClaimed: kstDay(s.lastTick) };
      return s;
    }
    case "confirmGear": {
      const t = s.gear.confirmed;
      if (t >= GEAR_TIERS.length) throw new RuleError("max");
      const reached = s.gear.tier > t || (s.gear.tier === t && s.gear.level >= GEAR_MAX_LEVEL);
      if (!reached) throw new RuleError("not_done");
      const cost = gearConfirmCost(t);
      spendGems(s, cost.gems);
      spend(s, cost.gold);
      s.gear = { ...s.gear, confirmed: t + 1 };
      return s;
    }
    case "claimStep": {
      const step = STEP_MISSIONS[s.missions.step];
      if (!step) throw new RuleError("max");
      if (!step.done(s)) throw new RuleError("not_done");
      grant(s, step.reward);
      s.missions = { ...s.missions, step: s.missions.step + 1 };
      return s;
    }
    case "claimSpecial": {
      const mission = findSpecialMission(intent.id);
      if (!mission) throw new RuleError("unknown");
      if (s.missions.special.includes(mission.id)) throw new RuleError("claimed");
      if (!mission.done(s)) throw new RuleError("not_done");
      grant(s, mission.reward);
      s.missions = { ...s.missions, special: [...s.missions.special, mission.id] };
      return s;
    }
    case "claimAttendance": {
      const today = kstDay(s.lastTick);
      if (s.attendance.lastDay === today) throw new RuleError("claimed");
      const reward = ATTENDANCE_REWARDS[s.attendance.count % ATTENDANCE_REWARDS.length];
      grant(s, reward.gems ? { ...reward, gems: Math.floor(reward.gems * vipPerks(s).attendanceGemMult) } : reward);
      s.attendance = { lastDay: today, count: s.attendance.count + 1 };
      return s;
    }
    case "upgradeOffice": {
      const grade = s.office[intent.part];
      if (grade >= OFFICE_MAX_GRADE) throw new RuleError("max");
      spendCoupons(s, officeUpgradeCost(grade));
      s.office = { ...s.office, [intent.part]: grade + 1 };
      return s;
    }
  }
}
