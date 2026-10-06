import { describe, expect, test } from "vitest";
import { applyIntent, readIntent, RuleError, type Intent } from "./actions";
import { Big } from "./big";
import { GEAR_TIERS, gearLevelCost, gearPrice } from "./data/gear";
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
