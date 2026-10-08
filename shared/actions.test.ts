import { describe, expect, test } from "vitest";
import { applyIntent, readIntent, RuleError, type Intent } from "./actions";
import { Big } from "./big";
import { CERT_MAX_LEVEL, certLevelCost, findCert } from "./data/certs";
import { GEAR_MAX_LEVEL, GEAR_TIERS, gearAtk, gearConfirmCost, gearLevelCost, gearPrice } from "./data/gear";
import { LEGENDS, SUIT_ITEMS } from "./data/costumes";
import { apartmentCost, officeUpgradeCost } from "./data/home";
import { PET_BOX_COUPONS, petLevelCost } from "./data/pets";
import { PRESTIGE_MIN_FLOOR, PRESTIGE_MOVE_MS, prestigeReward } from "./data/prestige";
import { relicLevelCost } from "./data/relics";
import { SIDE_JOBS, sideJobCost } from "./data/sideJobs";
import { gearPriceFor, sideJobCostFor } from "./prices";
import { newState, type GameState } from "./state";
import { jobChangeReward } from "./stats";

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
    expect(readIntent({ k: "restartSideJob", id: "j00" })).toBeNull();
    expect(readIntent({ k: "giveGold", n: 1e9 })).toBeNull();
    expect(readIntent("buyGear")).toBeNull();
    expect(readIntent(null)).toBeNull();
    expect(readIntent({ k: "levelStat", id: "atk" })).toBeNull();
    expect(readIntent({ k: "upgradeOffice", part: "chair" })).toEqual({ k: "upgradeOffice", part: "chair" });
    expect(readIntent({ k: "upgradeOffice", part: "desk" })).toBeNull();
    expect(readIntent({ k: "petBox" })).toEqual({ k: "petBox" });
    expect(readIntent({ k: "wearSuit", id: "s1_accessory" })).toEqual({ k: "wearSuit", id: "s1_accessory" });
    expect(readIntent({ k: "confirmGear" })).toEqual({ k: "confirmGear" });
    expect(readIntent({ k: "buyCert" })).toBeNull();
    expect(readIntent({ k: "levelCert", id: "atk1", bulk: true })).toEqual({ k: "levelCert", id: "atk1", bulk: true });
    expect(readIntent({ k: "levelCert", id: "atk1" })).toBeNull();
    expect(readIntent({ k: "prestige", mode: "super" })).toEqual({ k: "prestige", mode: "super" });
    expect(readIntent({ k: "prestige", mode: "toString" })).toBeNull();
    expect(readIntent({ k: "prestige", boosted: true })).toBeNull();
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
    const s = { ...rich(), gear: { tier: 0, level: GEAR_MAX_LEVEL, confirmed: 0 } };
    const after = applyIntent(s, { k: "buyGear" });
    expect(after.gear).toEqual({ tier: 1, level: 0, confirmed: 0 });
    expect(codeOf({ ...rich(gearPrice(1).mulN(0.5)), gear: { tier: 0, level: GEAR_MAX_LEVEL, confirmed: 0 } }, { k: "buyGear" })).toBe("not_enough_gold");
    expect(codeOf({ ...rich(), gear: { tier: GEAR_TIERS.length - 1, level: GEAR_MAX_LEVEL, confirmed: 0 } }, { k: "buyGear" })).toBe("max");
  });
});

describe("gear rules", () => {
  test("levels stop at 5, and the next tier opens only then", () => {
    expect(codeOf({ ...rich(), gear: { tier: 0, level: GEAR_MAX_LEVEL, confirmed: 0 } }, { k: "levelGear" })).toBe("max");
    expect(codeOf({ ...rich(), gear: { tier: 0, level: GEAR_MAX_LEVEL - 1, confirmed: 0 } }, { k: "buyGear" })).toBe("locked");
  });

  test("gear numbers: ATK 50 ×3, price 600 ×6", () => {
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

  test("open from the start, cost gold, stop at level 999", () => {
    expect(codeOf(rich(), { k: "levelSideJob", id: second.id })).toBe("");
    const maxed = { ...rich(), sideJobs: { [first.id]: { level: 999, progressSec: 0, running: true } } };
    expect(codeOf(maxed, { k: "levelSideJob", id: first.id })).toBe("max");
    expect(codeOf(rich(sideJobCost(first, 0).mulN(0.5)), { k: "levelSideJob", id: first.id })).toBe("not_enough_gold");
    expect(codeOf(rich(), { k: "levelSideJob", id: "nope" })).toBe("unknown");
  });

});

describe("certificates", () => {
  const withTickets = (tickets: number) => ({ ...rich(), tickets });
  const atk1 = findCert("atk1")!;

  test("taking one costs its level-0 price; levelling then costs base + step × level", () => {
    const took = applyIntent(withTickets(100), { k: "levelCert", id: "atk1", bulk: false });
    expect(took.certs.atk1).toBe(1);
    expect(took.tickets).toBe(100 - 10);
    const again = applyIntent(took, { k: "levelCert", id: "atk1", bulk: false });
    expect(again.certs.atk1).toBe(2);
    expect(again.tickets).toBe(90 - certLevelCost(atk1, 1));
    expect(certLevelCost(atk1, 1)).toBe(15);
  });

  test("bulk keeps levelling while the tickets last", () => {
    const after = applyIntent(withTickets(100), { k: "levelCert", id: "atk1", bulk: true });
    // 10 + 15 + 20 + 25 + 30 = 100; the next (35) is out of reach.
    expect(after.certs.atk1).toBe(5);
    expect(after.tickets).toBe(0);
    expect(applyIntent(withTickets(99), { k: "levelCert", id: "atk1", bulk: true }).certs.atk1).toBe(4);
  });

  test("bulk stops at the cap", () => {
    const after = applyIntent(withTickets(1e9), { k: "levelCert", id: "b_aspd", bulk: true });
    expect(after.certs.b_aspd).toBe(10);
    expect(codeOf(after, { k: "levelCert", id: "b_aspd", bulk: false })).toBe("max");
  });

  test("a higher grade opens only once the one below is maxed", () => {
    const s = { ...withTickets(1e12), certs: { atk1: CERT_MAX_LEVEL - 1 } };
    expect(codeOf(s, { k: "levelCert", id: "atk2", bulk: false })).toBe("locked");
    const maxed = { ...s, certs: { atk1: CERT_MAX_LEVEL } };
    expect(applyIntent(maxed, { k: "levelCert", id: "atk2", bulk: false }).certs.atk2).toBe(1);
  });

  test("연봉협상 자격증 are paid in gems", () => {
    const s = { ...rich(), gems: 1000, tickets: 0 };
    const after = applyIntent(s, { k: "levelCert", id: "c_coach", bulk: false });
    expect(after.certs.c_coach).toBe(1);
    expect(after.gems).toBe(800);
    expect(codeOf({ ...s, gems: 199 }, { k: "levelCert", id: "c_coach", bulk: false })).toBe("not_enough_gems");
  });

  test("unknown ids and empty wallets are turned down", () => {
    expect(codeOf(withTickets(100), { k: "levelCert", id: "nope", bulk: false })).toBe("unknown");
    expect(codeOf(withTickets(9), { k: "levelCert", id: "atk1", bulk: false })).toBe("not_enough_tickets");
  });

  test("구매관리사 makes gear and side jobs cheaper", () => {
    const s = { ...rich(), certs: { b_cost: 40 } };
    expect(gearPriceFor(s, 1).toNumber()).toBeCloseTo(gearPrice(1).toNumber() * 0.2);
    expect(sideJobCostFor(s, SIDE_JOBS[0], 3).toNumber()).toBeCloseTo(sideJobCost(SIDE_JOBS[0], 3).toNumber() * 0.2);
  });
});

describe("prestige", () => {
  function at(floor: number) {
    const s = rich();
    s.run = { ...s.run, floor, maxFloor: floor };
    s.bestFloor = floor;
    s.gear = { tier: 4, level: 5, confirmed: 0 };
    s.sideJobs = { j00: { level: 5, progressSec: 0, running: true } };
    s.certs = { atk1: 2 };
    s.tickets = 7;
    s.gems = 1500;
    return s;
  }

  test("not before floor 100", () => {
    expect(codeOf(at(PRESTIGE_MIN_FLOOR - 1), { k: "prestige", mode: "plain" })).toBe("locked");
  });

  test("resets the run and keeps the permanent things", () => {
    const after = applyIntent(at(120), { k: "prestige", mode: "plain" });
    expect(after.buffs.move).toBe(Math.max(at(120).buffs.move, after.lastTick) + PRESTIGE_MOVE_MS);
    const reward = prestigeReward(120, 0);
    expect(after.gold.isZero()).toBe(true);
    expect(after.run).toEqual({ floor: 1, target: 0, carrySec: 0, farming: false, maxFloor: 1, gearBoost: 0 });
    expect(after.gear).toEqual({ tier: 0, level: 0, confirmed: 0 });
    expect(after.sideJobs).toEqual({});
    expect(after.bestFloor).toBe(120);
    expect(after.certs).toEqual({ atk1: 2 });
    expect(after.tickets).toBe(7 + reward.tickets);
    expect(after.gems).toBe(1500 + reward.gems);
    expect(after.prestiges).toBe(1);
  });

  test("강화 연봉협상: 500 gems for ×3 tickets; 초강화 연봉협상: 1000 gems for ×5; gems reward unchanged", () => {
    const reward = prestigeReward(120, 0);
    const boosted = applyIntent(at(120), { k: "prestige", mode: "boosted" });
    expect(boosted.tickets).toBe(7 + reward.tickets * 3);
    expect(boosted.gems).toBe(1500 - 500 + reward.gems);
    const sup = applyIntent(at(120), { k: "prestige", mode: "super" });
    expect(sup.tickets).toBe(7 + reward.tickets * 5);
    expect(sup.gems).toBe(1500 - 1000 + reward.gems);
    expect(codeOf({ ...at(120), gems: 499 }, { k: "prestige", mode: "boosted" })).toBe("not_enough_gems");
    expect(codeOf({ ...at(120), gems: 999 }, { k: "prestige", mode: "super" })).toBe("not_enough_gems");
  });

  test("tickets grow exponentially: 100 at floor 100, about 300,000 at floor 1000", () => {
    expect(prestigeReward(100, 0)).toEqual({ tickets: 100, gems: 5 });
    expect(prestigeReward(70, 0)).toEqual({ tickets: Math.floor(100 * 1.009 ** -30), gems: 3 });
    expect(prestigeReward(69, 0).tickets).toBe(0);
    expect(prestigeReward(1000, 0).tickets).toBeGreaterThan(250_000);
    expect(prestigeReward(1000, 0).tickets).toBeLessThan(400_000);
    expect(prestigeReward(300, 0).tickets).toBe(Math.floor(100 * 1.009 ** 200));
    expect(prestigeReward(200, 0.5).tickets).toBe(Math.floor(100 * 1.009 ** 100 * 1.5));
  });

  test("커리어코치, 자소서첨삭사 and 인맥관리사 raise the tickets", () => {
    const s = at(300);
    const plain = jobChangeReward(s).tickets;
    s.certs = { c_coach: 10 };
    expect(jobChangeReward(s).tickets).toBe(Math.floor(100 * 1.009 ** 200 * 2));
    s.certs = { c_coach: 10, c_resume: 20 };
    expect(jobChangeReward(s).tickets).toBe(Math.floor(100 * 1.009 ** 200 * 3));
    s.certs = { c_network: 10 };
    expect(jobChangeReward(s).tickets).toBe(Math.floor(100 * 1.009 ** 250));
    expect(jobChangeReward(s).gems).toBe(15);
    expect(plain).toBe(Math.floor(100 * 1.009 ** 200));
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

  test("suits: wear an owned part, swapping what was on; take it off", () => {
    const a = SUIT_ITEMS.find((i) => i.set === 1 && i.part === "accessory")!;
    const b = SUIT_ITEMS.find((i) => i.set === 2 && i.part === "accessory")!;
    const s = base({ suits: [a.id, b.id], wear: { accessory: a.id } });
    expect(applyIntent(s, { k: "wearSuit", id: b.id }).wear).toEqual({ accessory: b.id });
    expect(applyIntent(s, { k: "takeOffSuit", part: "accessory" }).wear).toEqual({});
    expect(codeOf(base(), { k: "wearSuit", id: b.id })).toBe("not_owned");
    const bought = applyIntent(base({ suits: [a.id], wear: { accessory: a.id } }), { k: "buySuit", id: b.id });
    expect(bought.wear).toEqual({ accessory: a.id });
  });

  test("불꽃: needs the set's five parts, bought with gems, shown at once", () => {
    const five = SUIT_ITEMS.filter((i) => i.set === 1 && i.part !== "accessory").map((i) => i.id);
    expect(codeOf(base(), { k: "buyAura", set: 1 })).toBe("locked");
    const after = applyIntent(base({ suits: five }), { k: "buyAura", set: 1 });
    expect(after.costume.auras).toEqual([1]);
    expect(after.costume.aura).toBe(1);
    expect(after.gems).toBe(10_000 - 300);
    expect(applyIntent(after, { k: "wearAura", set: 0 }).costume.aura).toBe(0);
    expect(codeOf(after, { k: "wearAura", set: 2 })).toBe("not_owned");
  });

  test("전설: all six of a slot open it; levels to 5 with coupons", () => {
    const helmets = SUIT_ITEMS.filter((i) => i.part === "helmet").map((i) => i.id);
    expect(codeOf(base(), { k: "levelLegend", part: "helmet" })).toBe("locked");
    let s = base({ suits: helmets });
    for (let i = 0; i < 5; i++) s = applyIntent(s, { k: "levelLegend", part: "helmet" });
    expect(s.costume.legend.helmet).toBe(5);
    expect(s.coupons).toBe(10_000 - 5 * LEGENDS[0].coupons);
    expect(codeOf(s, { k: "levelLegend", part: "helmet" })).toBe("max");
  });

  test("office: upgrade a grade with coupons, up to 17", () => {
    const after = applyIntent(base(), { k: "upgradeOffice", part: "chair" });
    expect(after.office.chair).toBe(2);
    expect(after.coupons).toBe(10_000 - officeUpgradeCost(1));
    expect(codeOf(base({ office: { keyboard: 17, mouse: 1, chair: 1, monitor: 1 } }), { k: "upgradeOffice", part: "keyboard" })).toBe("max");
  });

  test("a job change keeps all of it", () => {
    const s = base({ bestFloor: 1000, apartment: 3, suits: [SUIT_ITEMS[0].id], wear: { helmet: SUIT_ITEMS[0].id }, pets: { p_intern: 4 }, relics: { r_badge: 2 } });
    s.run = { ...s.run, floor: 100, maxFloor: 100 };
    const after = applyIntent(s, { k: "prestige", mode: "plain" });
    expect(after.apartment).toBe(3);
    expect(after.suits).toEqual([SUIT_ITEMS[0].id]);
    expect(after.wear).toEqual({ helmet: SUIT_ITEMS[0].id });
    expect(after.pets).toEqual({ p_intern: 4 });
    expect(after.relics).toEqual({ r_badge: 2 });
  });
});

describe("구매확정 (confirming gear)", () => {
  const rich2 = (gear: { tier: number; level: number; confirmed: number }) => ({ ...rich(), gems: 10_000, gear });

  test("a weapon at Lv5 can be confirmed for gold and gems", () => {
    const s = rich2({ tier: 0, level: GEAR_MAX_LEVEL, confirmed: 0 });
    const cost = gearConfirmCost(0);
    const after = applyIntent(s, { k: "confirmGear" });
    expect(after.gear.confirmed).toBe(1);
    expect(after.gems).toBe(10_000 - cost.gems);
    expect(after.gold.toNumber()).toBeCloseTo(s.gold.sub(cost.gold).toNumber(), 0);
    expect(codeOf(rich2({ tier: 0, level: GEAR_MAX_LEVEL - 1, confirmed: 0 }), { k: "confirmGear" })).toBe("not_done");
  });

  test("only in order: the next one to confirm is always the lowest unconfirmed", () => {
    const s = rich2({ tier: 3, level: 2, confirmed: 1 });
    const after = applyIntent(s, { k: "confirmGear" });
    expect(after.gear.confirmed).toBe(2);
    expect(codeOf(rich2({ tier: 1, level: 2, confirmed: 1 }), { k: "confirmGear" })).toBe("not_done");
    expect(codeOf({ ...rich2({ tier: 0, level: 5, confirmed: 0 }), gems: 0 }, { k: "confirmGear" })).toBe("not_enough_gems");
    expect(codeOf(rich2({ tier: GEAR_TIERS.length - 1, level: 5, confirmed: GEAR_TIERS.length }), { k: "confirmGear" })).toBe("max");
  });

  test("a job change keeps confirmed weapons: the last one at Lv5, ready to buy the next", () => {
    const s = rich2({ tier: 4, level: 3, confirmed: 3 });
    s.run = { ...s.run, floor: 120, maxFloor: 120 };
    expect(applyIntent(s, { k: "prestige", mode: "plain" }).gear).toEqual({ tier: 2, level: GEAR_MAX_LEVEL, confirmed: 3 });
    const none = rich2({ tier: 4, level: 3, confirmed: 0 });
    none.run = { ...none.run, floor: 120, maxFloor: 120 };
    expect(applyIntent(none, { k: "prestige", mode: "plain" }).gear).toEqual({ tier: 0, level: 0, confirmed: 0 });
  });
});
