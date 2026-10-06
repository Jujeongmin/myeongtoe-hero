import { describe, expect, test } from "vitest";
import { Big } from "./big";
import { SAVE_VERSION, cloneState, fromSave, newState, toSave } from "./state";

describe("state", () => {
  test("a new state starts on floor 1 with the ballpoint pen and no gold", () => {
    const s = newState(1000);
    expect(s.v).toBe(SAVE_VERSION);
    expect(s.lastTick).toBe(1000);
    expect(s.gold.isZero()).toBe(true);
    expect(s.run).toEqual({ floor: 1, target: 0, carrySec: 0, farming: false, maxFloor: 1, gearBoost: 0 });
    expect(s.gear).toEqual({ tier: 0, level: 0, confirmed: 0 });
    expect(s.sideJobs).toEqual({});
    expect(s.tickets).toBe(0);
    expect(s.gems).toBe(0);
    expect(s.certs).toEqual({});
    expect(s.prestiges).toBe(0);
    expect(s.coupons).toBe(0);
    expect(s.ticketCarry).toBe(0);
    expect(s.pets).toEqual({});
    expect(s.relics).toEqual({});
    expect(s.apartment).toBe(0);
    expect(s.suits).toEqual([]);
    expect(s.wear).toEqual({});
    expect(s.office).toEqual({ keyboard: 1, mouse: 1, chair: 1, monitor: 1 });
    expect("stats" in s).toBe(false);
    expect(Number.isInteger(s.rngSeed)).toBe(true);
    expect(s.parking).toEqual({ passes: 16, passCarrySec: 0, best: 0 });
    expect(s.daily).toEqual({ day: "", entries: 0, bestDepth: 0, claimed: [] });
    expect(s.missions).toEqual({ step: 0, special: [] });
    expect(s.attendance).toEqual({ lastDay: "", count: 0 });
    expect(s.nickname).toBe("");
  });

  test("round-trips through a save, keeping reserved fields", () => {
    const s = { ...newState(5), gold: Big.of(1.5, 40), reserved: { raid: { week: 3 } } };
    s.sideJobs = { j00: { level: 3, progressSec: 1.5, running: true } };
    const save = toSave(s);
    expect(save.gold).toBe("1.5e40");
    expect(JSON.parse(JSON.stringify(toSave(fromSave(JSON.parse(JSON.stringify(save))))))).toEqual(
      JSON.parse(JSON.stringify(save)),
    );
  });

  test("refuses garbage and saves from a newer build", () => {
    expect(() => fromSave(null)).toThrow("bad_save");
    expect(() => fromSave({ v: "1" })).toThrow("bad_save");
    expect(() => fromSave({ ...toSave(newState(0)), gold: "lots" })).toThrow("bad_save");
    expect(() => fromSave({ ...toSave(newState(0)), v: SAVE_VERSION + 1 })).toThrow("save_from_future");
  });

  test("cleans out-of-range fields and unknown side jobs", () => {
    const save = toSave(newState(0)) as unknown as Record<string, unknown>;
    save.run = { floor: -3, target: 1.5, carrySec: -1, farming: "yes", maxFloor: 0 };
    save.gear = { tier: 999, level: 3 };
    save.sideJobs = { j00: { level: 2, progressSec: 1, running: true }, hacked: { level: 99, progressSec: 0, running: true } };
    const s = fromSave(save);
    expect(s.run).toEqual({ floor: 1, target: 0, carrySec: 0, farming: false, maxFloor: 1, gearBoost: 0 });
    expect(Object.keys(s.sideJobs)).toEqual(["j00"]);
    expect(s.gear).toEqual({ tier: 29, level: 3, confirmed: 0 });
  });

  test("a clone shares nothing mutable with the original", () => {
    const a = newState(0);
    a.sideJobs.j00 = { level: 1, progressSec: 0, running: true };
    const b = cloneState(a);
    b.run.floor = 9;
    b.sideJobs.j00.level = 5;
    expect(a.run.floor).toBe(1);
    expect(a.sideJobs.j00.level).toBe(1);
  });
  test("a version 1 save migrates with empty new fields", () => {
    const v1 = {
      v: 1, lastTick: 5, gold: "1.5e3", bestFloor: 12,
      run: { floor: 12, target: 3, carrySec: 0.5, farming: false, maxFloor: 12 },
      gear: { tier: 2, level: 4 }, sideJobs: { j00: { level: 1, progressSec: 0, running: true } },
      flags: { sideJobAuto: false }, reserved: {},
    };
    const s = fromSave(v1);
    expect(s.v).toBe(SAVE_VERSION);
    expect(s.gear).toEqual({ tier: 2, level: 4, confirmed: 0 });
    expect(s.tickets).toBe(0);
    expect(s.certs).toEqual({});
  });

  test("a version 2 save migrates, and gear above level 5 comes down to 5", () => {
    const v2 = { ...toSave(newState(0)), v: 2, gear: { tier: 3, level: 12 } } as Record<string, unknown>;
    for (const k of ["coupons", "ticketCarry", "pets", "relics", "apartment", "suits", "office", "wear"]) delete v2[k];
    v2.stats = { atk: 3, crit: 0, critDmg: 0, aspd: 0 };
    const s = fromSave(v2);
    expect(s.v).toBe(SAVE_VERSION);
    expect(s.gear).toEqual({ tier: 3, level: 5, confirmed: 0 });
    expect(s.office).toEqual({ keyboard: 1, mouse: 1, chair: 1, monitor: 1 });
    expect(s.suits).toEqual([]);
    expect("stats" in s).toBe(false);
  });

  test("office grades stay within 1..17, suits are unique, only owned parts are worn", () => {
    const save = toSave(newState(0)) as unknown as Record<string, unknown>;
    save.office = { keyboard: 40, mouse: 0, chair: 3, monitor: "x" };
    save.suits = ["s1_helmet", "s1_helmet", 5, "s2_armor"];
    save.wear = { helmet: "s1_helmet", armor: "s3_armor", accessory: "s1_helmet" };
    const s = fromSave(save);
    expect(s.office).toEqual({ keyboard: 17, mouse: 1, chair: 3, monitor: 1 });
    expect(s.suits).toEqual(["s1_helmet", "s2_armor"]);
    expect(s.wear).toEqual({ helmet: "s1_helmet" });
  });

  test("a version 5 save loses its randomly drawn certificates", () => {
    const v5 = { ...toSave(newState(0)), v: 5, certs: { c00: 3, c07: 1 } } as Record<string, unknown>;
    expect(fromSave(v5).certs).toEqual({});
  });
  test("unknown certificates and bad levels are dropped", () => {
    const save = toSave(newState(0)) as unknown as Record<string, unknown>;
    save.certs = { atk1: 3, gold1: 0, fake: 9, crit1: 1.5, b_aspd: 99 };
    expect(fromSave(save).certs).toEqual({ atk1: 3, b_aspd: 10 });
  });
  test("a version 3 save migrates with full parking passes and empty missions", () => {
    const v3 = { ...toSave(newState(0)), v: 3 } as Record<string, unknown>;
    for (const k of ["parking", "daily", "missions", "attendance", "nickname"]) delete v3[k];
    const s = fromSave(v3);
    expect(s.v).toBe(SAVE_VERSION);
    expect(s.parking.passes).toBe(16);
    expect(s.missions).toEqual({ step: 0, special: [] });
  });

  test("parking passes stay within 0..18 (16 + VIP), lists stay unique", () => {
    const save = toSave(newState(0)) as unknown as Record<string, unknown>;
    save.parking = { passes: 99, passCarrySec: -3, best: 12 };
    save.daily = { day: "2026-10-06", entries: 2, bestDepth: 40, claimed: ["e1", "e1", 3] };
    save.missions = { step: 4, special: ["f500", "f500"] };
    save.nickname = "박부장최고".repeat(10);
    const s = fromSave(save);
    expect(s.parking).toEqual({ passes: 18, passCarrySec: 0, best: 12 });
    expect(s.daily.claimed).toEqual(["e1"]);
    expect(s.missions.special).toEqual(["f500"]);
    expect(s.nickname).toBe("");
  });
  test("a version 4 save's office-suit parts become the costume slots", () => {
    const v4 = { ...toSave(newState(0)), v: 4, suits: ["s1_hair", "s2_tie", "s3_coat"], wear: { hair: "s1_hair", tie: "s2_tie" } } as Record<string, unknown>;
    const s = fromSave(v4);
    expect(s.suits).toEqual(["s1_helmet", "s2_accessory", "s3_cape"]);
    expect(s.wear).toEqual({ helmet: "s1_helmet", accessory: "s2_accessory" });
  });
});
