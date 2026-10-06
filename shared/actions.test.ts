import { describe, expect, test } from "vitest";
import { applyIntent, readIntent, RuleError, type Intent } from "./actions";
import { Big } from "./big";
import { CERTS, certDrawCost, certLevelCost } from "./data/certs";
import { GEAR_MAX_LEVEL, GEAR_TIERS, gearAtk, gearLevelCost, gearPrice } from "./data/gear";
import { SUIT_ITEMS, apartmentCost, officeUpgradeCost } from "./data/home";
import { PET_BOX_COUPONS, petLevelCost } from "./data/pets";
import { BOOSTED_PRESTIGE_GEMS, PRESTIGE_MIN_FLOOR, prestigeReward } from "./data/prestige";
import { relicLevelCost } from "./data/relics";
import { SIDE_JOBS, sideJobCost } from "./data/sideJobs";
import { newState, type GameState } from "./state";

function rich(gold = Big.of(1, 300)): GameState {
  return { ...newState(0), gold };
}

function codeOf(state: GameState, intent: Intent): string {
  try {
    applyIntent(state, intent);
    return "";
  } catch (error) {
    if (error instanceof RuleError) return error.code;
    throw error;
  }
}

describe("readIntent", () => {
  test("accepts the known shapes only", () => {
    expect(readIntent({ k: "buyGear" })).toEqual({ k: "buyGear" });
    expect(readIntent({ k: "levelSideJob", id: "j00" })).toEqual({ k: "levelSideJob", id: "j00" });
    expect(readIntent({ k: "levelSideJob" })).toBeNull();
    expect(readIntent({ k: "giveGold", n: 1e9 })).toBeNull();
    expect(readIntent("buyGear")).toBeNull();
    expect(readIntent(null)).toBeNull();
    expect(readIntent({ k: "levelStat", id: "atk" })).toBeNull();
    expect(readIntent({ k: "upgradeOffice", part: "chair" })).toEqual({ k: "upgradeOffice", part: "chair" });
    expect(readIntent({ k: "upgradeOffice", part: "desk" })).toBeNull();
    expect(readIntent({ k: "petBox" })).toEqual({ k: "petBox" });
    expect(readIntent({ k: "wearSuit", id: "s1_tie" })).toEqual({ k: "wearSuit", id: "s1_tie" });
    expect(readIntent({ k: "buyCert" })).toEqual({ k: "buyCert" });
    expect(readIntent({ k: "prestige", boosted: true })).toEqual({ k: "prestige", boosted: true });
    expect(readIntent({ k: "prestige" })).toBeNull();
  });
});

describe("gear", () => {
  test("levelling up spends gold", () => {
    const s = rich(gearLevelCost(0, 0).mulN(1.5));
    const after = applyIntent(s, { k: "levelGear" });
    expect(after.gear.level).toBe(1);
    expect(after.gold.toNumber()).toBeCloseTo(gearLevelCost(0, 0).toNumber() * 0.5, 9);
    expect(s.gear.level).toBe(0); // the input is untouched
  });

  test("buying the next tier resets the level", () => {
    const s = { ...rich(), gear: { tier: 0, level: GEAR_MAX_LEVEL } };
    const after = applyIntent(s, { k: "buyGear" });
    expect(after.gear).toEqual({ tier: 1, level: 0 });
    expect(codeOf({ ...rich(gearPrice(1).mulN(0.5)), gear: { tier: 0, level: GEAR_MAX_LEVEL } }, { k: "buyGear" })).toBe("not_enough_gold");
    expect(codeOf({ ...rich(), gear: { tier: GEAR_TIERS.length - 1, level: GEAR_MAX_LEVEL } }, { k: "buyGear" })).toBe("max");
  });
});

describe("the original's weapon rules", () => {
  test("levels stop at 5, and the next tier opens only then (원작 무기 규칙)", () => {
    expect(codeOf({ ...rich(), gear: { tier: 0, level: GEAR_MAX_LEVEL } }, { k: "levelGear" })).toBe("max");
    expect(codeOf({ ...rich(), gear: { tier: 0, level: GEAR_MAX_LEVEL - 1 } }, { k: "buyGear" })).toBe("locked");
  });

  test("the original's weapon numbers: ATK 50 ×3, price 600 ×6", () => {
    expect(gearAtk(0, 0).toNumber()).toBeCloseTo(50, 9);
    expect(gearAtk(1, 0).toNumber()).toBeCloseTo(150, 9);
    expect(gearPrice(1).toNumber()).toBeCloseTo(600, 6);
    expect(gearPrice(2).toNumber()).toBeCloseTo(3600, 6);
  });
});

describe("side jobs", () => {
  const first = SIDE_JOBS[0];
  const second = SIDE_JOBS[1];

  test("the first level starts the job running", () => {
    const after = applyIntent(rich(), { k: "levelSideJob", id: first.id });
    expect(after.sideJobs[first.id]).toEqual({ level: 1, progressSec: 0, running: true });
  });

  test("later levels keep its progress", () => {
    const s = rich();
    s.sideJobs[first.id] = { level: 3, progressSec: 1.25, running: false };
    expect(applyIntent(s, { k: "levelSideJob", id: first.id }).sideJobs[first.id]).toEqual({
      level: 4, progressSec: 1.25, running: false,
    });
  });

  test("locked until the run reaches its floor, and costs gold", () => {
    expect(codeOf(rich(), { k: "levelSideJob", id: second.id })).toBe("locked");
    const there = { ...rich(), run: { ...newState(0).run, floor: second.unlockFloor, maxFloor: second.unlockFloor } };
    expect(codeOf(there, { k: "levelSideJob", id: second.id })).toBe("");
    expect(codeOf(rich(sideJobCost(first, 0).mulN(0.5)), { k: "levelSideJob", id: first.id })).toBe("not_enough_gold");
    expect(codeOf(rich(), { k: "levelSideJob", id: "nope" })).toBe("unknown");
  });

  test("restarting needs an owned, stopped job", () => {
    const s = rich();
    expect(codeOf(s, { k: "restartSideJob", id: first.id })).toBe("not_owned");
    s.sideJobs[first.id] = { level: 1, progressSec: 0, running: true };
    expect(codeOf(s, { k: "restartSideJob", id: first.id })).toBe("running");
    s.sideJobs[first.id] = { level: 1, progressSec: 0, running: false };
    expect(applyIntent(s, { k: "restartSideJob", id: first.id }).sideJobs[first.id].running).toBe(true);
  });
});

describe("certificates", () => {
  const withTickets = (tickets: number) => ({ ...rich(), tickets });

  test("a draw spends tickets and gives a tier-1 certificate not owned yet", () => {
    const after = applyIntent(withTickets(10), { k: "buyCert" });
    const owned = Object.keys(after.certs);
    expect(owned).toHaveLength(1);
    expect(CERTS.find((c) => c.id === owned[0])!.tier).toBe(1);
    expect(after.certs[owned[0]]).toBe(1);
    expect(after.tickets).toBe(10 - certDrawCost(0));
    expect(after.rngSeed).not.toBe(rich().rngSeed);
  });

  test("the same seed draws the same certificate (client and server agree)", () => {
    const s = withTickets(10);
    expect(Object.keys(applyIntent(s, { k: "buyCert" }).certs)).toEqual(Object.keys(applyIntent(s, { k: "buyCert" }).certs));
  });

  test("never draws one already owned; runs out at the open tiers", () => {
    let s = withTickets(10_000);
    for (let i = 0; i < 10; i++) s = applyIntent(s, { k: "buyCert" });
    expect(Object.keys(s.certs)).toHaveLength(10);
    expect(Object.keys(s.certs).every((id) => CERTS.find((c) => c.id === id)!.tier === 1)).toBe(true);
    for (let i = 0; i < 30; i++) s = applyIntent(s, { k: "buyCert" });
    expect(Object.keys(s.certs)).toHaveLength(40);
    expect(codeOf(s, { k: "buyCert" })).toBe("max");
    expect(codeOf(withTickets(0), { k: "buyCert" })).toBe("not_enough_tickets");
  });

  test("levelling one needs it owned and tickets", () => {
    const c = CERTS[0];
    const s = { ...withTickets(100), certs: { [c.id]: 1 } };
    const after = applyIntent(s, { k: "levelCert", id: c.id });
    expect(after.certs[c.id]).toBe(2);
    expect(after.tickets).toBe(100 - certLevelCost(c, 1));
    expect(codeOf(s, { k: "levelCert", id: CERTS[1].id })).toBe("not_owned");
    expect(codeOf({ ...s, tickets: 0 }, { k: "levelCert", id: c.id })).toBe("not_enough_tickets");
  });
});

describe("prestige", () => {
  function at(floor: number) {
    const s = rich();
    s.run = { ...s.run, floor, maxFloor: floor };
    s.bestFloor = floor;
    s.gear = { tier: 4, level: 9 };
    s.sideJobs = { j00: { level: 5, progressSec: 0, running: true } };
    s.certs = { c00: 2 };
    s.tickets = 7;
    s.gems = 1500;
    return s;
  }

  test("not before floor 80", () => {
    expect(codeOf(at(PRESTIGE_MIN_FLOOR - 1), { k: "prestige", boosted: false })).toBe("locked");
  });

  test("resets the run and keeps the permanent things", () => {
    const after = applyIntent(at(120), { k: "prestige", boosted: false });
    const reward = prestigeReward(120, 0);
    expect(after.gold.isZero()).toBe(true);
    expect(after.run).toEqual({ floor: 1, target: 0, carrySec: 0, farming: false, maxFloor: 1 });
    expect(after.gear).toEqual({ tier: 0, level: 0 });
    expect(after.sideJobs).toEqual({});
    expect(after.bestFloor).toBe(120);
    expect(after.certs).toEqual({ c00: 2 });
    expect(after.tickets).toBe(7 + reward.tickets);
    expect(after.gems).toBe(1500 + reward.gems);
    expect(after.prestiges).toBe(1);
  });

  test("boosted: pays gems first, then doubles the reward", () => {
    const reward = prestigeReward(120, 0);
    const after = applyIntent(at(120), { k: "prestige", boosted: true });
    expect(after.tickets).toBe(7 + reward.tickets * 2);
    expect(after.gems).toBe(1500 - BOOSTED_PRESTIGE_GEMS + reward.gems * 2);
    expect(codeOf({ ...at(120), gems: 999 }, { k: "prestige", boosted: true })).toBe("not_enough_gems");
  });

  test("reward grows with the floor", () => {
    expect(prestigeReward(80, 0)).toEqual({ tickets: 2, gems: 4 });
    expect(prestigeReward(200, 0).tickets).toBeGreaterThan(prestigeReward(100, 0).tickets);
    expect(prestigeReward(200, 0.5).tickets).toBe(Math.floor(prestigeReward(200, 0).tickets * 1.5));
  });
});

describe("permanent growth", () => {
  const base = (extra: Partial<GameState> = {}): GameState => ({ ...rich(), gems: 10_000, coupons: 10_000, ...extra });

  test("pets: level with gems once joined", () => {
    expect(codeOf(base(), { k: "levelPet", id: "p_intern" })).toBe("locked");
    const after = applyIntent(base({ bestFloor: 100 }), { k: "levelPet", id: "p_intern" });
    expect(after.pets.p_intern).toBe(2);
    expect(after.gems).toBe(10_000 - petLevelCost(1));
    expect(codeOf(base(), { k: "levelPet", id: "p_nope" })).toBe("unknown");
  });

  test("the pet box levels a random joined pet, the same one the server picks", () => {
    expect(codeOf(base(), { k: "petBox" })).toBe("locked");
    const s = base({ bestFloor: 600 });
    const a = applyIntent(s, { k: "petBox" });
    const b = applyIntent(s, { k: "petBox" });
    expect(a.pets).toEqual(b.pets);
    expect(Object.values(a.pets)).toEqual([2]);
    expect(a.coupons).toBe(10_000 - PET_BOX_COUPONS);
    expect(codeOf({ ...s, coupons: 0 }, { k: "petBox" })).toBe("not_enough_coupons");
  });

  test("relics: level with gems once arrived", () => {
    expect(codeOf(base(), { k: "levelRelic", id: "r_badge" })).toBe("locked");
    const after = applyIntent(base({ bestFloor: 1000 }), { k: "levelRelic", id: "r_badge" });
    expect(after.relics.r_badge).toBe(2);
    expect(after.gems).toBe(10_000 - relicLevelCost(1));
  });

  test("apartment: one pyeong for gems", () => {
    const after = applyIntent(base(), { k: "expandApartment" });
    expect(after.apartment).toBe(1);
    expect(after.gems).toBe(10_000 - apartmentCost(0));
  });

  test("suits: buy each part once, worn at once if that part was bare", () => {
    const item = SUIT_ITEMS[0];
    const after = applyIntent(base(), { k: "buySuit", id: item.id });
    expect(after.suits).toEqual([item.id]);
    expect(after.coupons).toBe(10_000 - item.price);
    expect(after.wear[item.part]).toBe(item.id);
    expect(codeOf(after, { k: "buySuit", id: item.id })).toBe("owned");
    expect(codeOf(base(), { k: "buySuit", id: "s9_hat" })).toBe("unknown");
  });

  test("suits: wear an owned part, swapping what was on", () => {
    const a = SUIT_ITEMS.find((i) => i.set === 1 && i.part === "tie")!;
    const b = SUIT_ITEMS.find((i) => i.set === 2 && i.part === "tie")!;
    const s = base({ suits: [a.id, b.id], wear: { tie: a.id } });
    expect(applyIntent(s, { k: "wearSuit", id: b.id }).wear).toEqual({ tie: b.id });
    expect(codeOf(base(), { k: "wearSuit", id: b.id })).toBe("not_owned");
    const bought = applyIntent(base({ suits: [a.id], wear: { tie: a.id } }), { k: "buySuit", id: b.id });
    expect(bought.wear).toEqual({ tie: a.id });
  });

  test("office: upgrade a grade with coupons, up to 17", () => {
    const after = applyIntent(base(), { k: "upgradeOffice", part: "chair" });
    expect(after.office.chair).toBe(2);
    expect(after.coupons).toBe(10_000 - officeUpgradeCost(1));
    expect(codeOf(base({ office: { keyboard: 17, mouse: 1, chair: 1, monitor: 1 } }), { k: "upgradeOffice", part: "keyboard" })).toBe("max");
  });

  test("a job change keeps all of it", () => {
    const s = base({ bestFloor: 1000, apartment: 3, suits: [SUIT_ITEMS[0].id], wear: { hair: SUIT_ITEMS[0].id }, pets: { p_intern: 4 }, relics: { r_badge: 2 } });
    s.run = { ...s.run, floor: 100, maxFloor: 100 };
    const after = applyIntent(s, { k: "prestige", boosted: false });
    expect(after.apartment).toBe(3);
    expect(after.suits).toEqual([SUIT_ITEMS[0].id]);
    expect(after.wear).toEqual({ hair: SUIT_ITEMS[0].id });
    expect(after.pets).toEqual({ p_intern: 4 });
    expect(after.relics).toEqual({ r_badge: 2 });
  });
});
