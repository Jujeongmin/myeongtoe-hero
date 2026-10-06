import { describe, expect, test } from "vitest";
import { Big } from "./big";
import { SAVE_VERSION, cloneState, fromSave, newState, toSave } from "./state";

describe("state", () => {
  test("a new state starts on floor 1 with the ballpoint pen and no gold", () => {
    const s = newState(1000);
    expect(s.v).toBe(SAVE_VERSION);
    expect(s.lastTick).toBe(1000);
    expect(s.gold.isZero()).toBe(true);
    expect(s.run).toEqual({ floor: 1, target: 0, carrySec: 0, farming: false, maxFloor: 1 });
    expect(s.gear).toEqual({ tier: 0, level: 0 });
    expect(s.sideJobs).toEqual({});
    expect(s.tickets).toBe(0);
    expect(s.gems).toBe(0);
    expect(s.stats).toEqual({ atk: 0, crit: 0, critDmg: 0, aspd: 0 });
    expect(s.certs).toEqual({});
    expect(s.prestiges).toBe(0);
    expect(Number.isInteger(s.rngSeed)).toBe(true);
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
    expect(s.run).toEqual({ floor: 1, target: 0, carrySec: 0, farming: false, maxFloor: 1 });
    expect(Object.keys(s.sideJobs)).toEqual(["j00"]);
    expect(s.gear).toEqual({ tier: 29, level: 3 });
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
    expect(s.gear).toEqual({ tier: 2, level: 4 });
    expect(s.tickets).toBe(0);
    expect(s.stats).toEqual({ atk: 0, crit: 0, critDmg: 0, aspd: 0 });
    expect(s.certs).toEqual({});
  });

  test("unknown certificates and bad levels are dropped", () => {
    const save = toSave(newState(0)) as unknown as Record<string, unknown>;
    save.certs = { c00: 3, c01: 0, fake: 9, c02: 1.5 };
    expect(fromSave(save).certs).toEqual({ c00: 3 });
  });
});
