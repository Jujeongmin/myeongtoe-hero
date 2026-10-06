import { describe, expect, test } from "vitest";
import { applyIntent, readIntent, RuleError, type Intent } from "./actions";
import { Big } from "./big";
import { CERTS, certDrawCost, certLevelCost } from "./data/certs";
import { GEAR_TIERS, gearLevelCost, gearPrice } from "./data/gear";
import { BOOSTED_PRESTIGE_GEMS, PRESTIGE_MIN_FLOOR, prestigeReward } from "./data/prestige";
import { SIDE_JOBS, sideJobCost } from "./data/sideJobs";
import { STATS, statCost } from "./data/stats";
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
    expect(readIntent({ k: "levelStat", id: "crit" })).toEqual({ k: "levelStat", id: "crit" });
    expect(readIntent({ k: "levelStat", id: "hp" })).toBeNull();
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
    const s = { ...rich(), gear: { tier: 0, level: 7 } };
    const after = applyIntent(s, { k: "buyGear" });
    expect(after.gear).toEqual({ tier: 1, level: 0 });
    expect(codeOf(rich(gearPrice(1).mulN(0.5)), { k: "buyGear" })).toBe("not_enough_gold");
    expect(codeOf({ ...rich(), gear: { tier: GEAR_TIERS.length - 1, level: 0 } }, { k: "buyGear" })).toBe("max");
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

describe("stats", () => {
  test("levelling a stat spends gold, up to its cap", () => {
    const crit = STATS.find((x) => x.id === "crit")!;
    const after = applyIntent(rich(), { k: "levelStat", id: "crit" });
    expect(after.stats.crit).toBe(1);
    expect(codeOf({ ...rich(), stats: { atk: 0, crit: crit.max, critDmg: 0, aspd: 0 } }, { k: "levelStat", id: "crit" })).toBe("max");
    expect(codeOf(rich(statCost(crit, 0).mulN(0.5)), { k: "levelStat", id: "crit" })).toBe("not_enough_gold");
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
    s.stats = { atk: 3, crit: 2, critDmg: 1, aspd: 1 };
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
    expect(after.stats).toEqual({ atk: 0, crit: 0, critDmg: 0, aspd: 0 });
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
