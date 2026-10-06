import { Big } from "./big";
import { CERTS, certBonuses, certDrawCost, certLevelCost, certTierOpen, findCert } from "./data/certs";
import { GEAR_MAX_LEVEL, GEAR_TIERS, gearConfirmCost, gearLevelCost, gearPrice } from "./data/gear";
import { OFFICE_PARTS, apartmentCost, findSuitItem, officeUpgradeCost, type OfficePart } from "./data/home";
import { dailyQuestReward, findDailyQuest } from "./data/dailyQuests";
import { ATTENDANCE_REWARDS, STEP_MISSIONS, findSpecialMission, type Reward } from "./data/missions";
import { runParking } from "./data/parking";
import { dailyOf } from "./daily";
import { PET_BOX_COUPONS, findPet, petLevelCost, petsUnlocked } from "./data/pets";
import { BOOSTED_PRESTIGE_GEMS, PRESTIGE_MIN_FLOOR, prestigeReward } from "./data/prestige";
import { findRelic, relicLevelCost } from "./data/relics";
import { findSideJob, sideJobCost } from "./data/sideJobs";
import { petLevel, relicLevel } from "./mods";
import { nextRandom } from "./rng";
import { heroPower } from "./stats";
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
  | { k: "buyCert" }
  | { k: "levelCert"; id: string }
  | { k: "prestige"; boosted: boolean }
  | { k: "levelPet"; id: string }
  | { k: "petBox" }
  | { k: "levelRelic"; id: string }
  | { k: "expandApartment" }
  | { k: "buySuit"; id: string }
  | { k: "wearSuit"; id: string }
  | { k: "upgradeOffice"; part: OfficePart }
  | { k: "enterParking" }
  | { k: "claimDaily"; id: string }
  | { k: "claimStep" }
  | { k: "claimSpecial"; id: string }
  | { k: "claimAttendance" }
  | { k: "confirmGear" };

// Untrusted input (from the network) to an Intent, or null for anything else.
export function readIntent(raw: unknown): Intent | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  switch (r.k) {
    case "buyGear":
    case "levelGear":
      return { k: r.k };
    case "levelSideJob":
      return typeof r.id === "string" && r.id.length <= 32 ? { k: r.k, id: r.id } : null;
    case "buyCert":
      return { k: "buyCert" };
    case "levelCert":
      return typeof r.id === "string" && r.id.length <= 32 ? { k: "levelCert", id: r.id } : null;
    case "prestige":
      return typeof r.boosted === "boolean" ? { k: "prestige", boosted: r.boosted } : null;
    case "petBox":
    case "expandApartment":
    case "enterParking":
    case "claimStep":
    case "claimAttendance":
    case "confirmGear":
      return { k: r.k };
    case "levelPet":
    case "levelRelic":
    case "buySuit":
    case "wearSuit":
    case "claimDaily":
    case "claimSpecial":
      return typeof r.id === "string" && r.id.length <= 32 ? { k: r.k, id: r.id } : null;
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
      spend(s, gearLevelCost(s.gear.tier, s.gear.level));
      s.gear.level += 1;
      return s;
    }
    case "buyGear": {
      const next = s.gear.tier + 1;
      if (next >= GEAR_TIERS.length) throw new RuleError("max");
      if (s.gear.level < GEAR_MAX_LEVEL) throw new RuleError("locked");
      spend(s, gearPrice(next));
      s.gear = { tier: next, level: 0, confirmed: s.gear.confirmed };
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
      if (!item || !s.suits.includes(item.id)) throw new RuleError("not_owned");
      s.wear = { ...s.wear, [item.part]: item.id };
      return s;
    }
    case "enterParking": {
      if (s.parking.passes <= 0) throw new RuleError("no_pass");
      const run = runParking(heroPower(s));
      const today = dailyOf(s);
      s.parking = { ...s.parking, passes: s.parking.passes - 1, best: Math.max(s.parking.best, run.depth) };
      s.tickets += run.tickets;
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
      grant(s, ATTENDANCE_REWARDS[s.attendance.count % ATTENDANCE_REWARDS.length]);
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
