import { describe, expect, test } from "vitest";
import { Big } from "./big";
import { gearLevelCost } from "./data/gear";
import { newState, toSave } from "./state";
import { MAX_INTENTS_PER_SYNC, syncSave } from "./sync";

describe("syncSave", () => {
  test("no save yet: a new game at the server's time", () => {
    const r = syncSave(undefined, [], 5000);
    expect(r.now).toBe(5000);
    expect(r.save.lastTick).toBe(5000);
    expect(r.save.run.floor).toBe(1);
    expect(r.rejected).toEqual([]);
  });

  test("settles up to now before applying intents", () => {
    const save = toSave({ ...newState(0), gold: gearLevelCost(0, 0).mulN(0.5) });
    // Too poor at t=0, rich enough after 60 s of fighting.
    const r = syncSave(save, [{ k: "levelGear" }], 60_000);
    expect(r.rejected).toEqual([]);
    expect(r.save.gear.level).toBe(1);
  });

  test("reports bad and refused intents by index and keeps going", () => {
    const save = toSave({ ...newState(0), gold: Big.of(1, 200) });
    const r = syncSave(save, [{ k: "hack" }, { k: "restartSideJob", id: "j00" }, { k: "levelGear" }], 0);
    expect(r.rejected).toEqual([{ index: 0, code: "bad_intent" }, { index: 1, code: "not_owned" }]);
    expect(r.save.gear.level).toBe(1);
  });

  test("drops intents past the per-sync limit", () => {
    const save = toSave({ ...newState(0), gold: Big.of(1, 200) });
    const many = Array.from({ length: MAX_INTENTS_PER_SYNC + 2 }, () => ({ k: "levelGear" }));
    const r = syncSave(save, many, 0);
    expect(r.save.gear.level).toBe(MAX_INTENTS_PER_SYNC);
    expect(r.rejected).toEqual([
      { index: MAX_INTENTS_PER_SYNC, code: "too_many" },
      { index: MAX_INTENTS_PER_SYNC + 1, code: "too_many" },
    ]);
  });

  test("a non-array intents value counts as none", () => {
    expect(syncSave(undefined, "levelGear", 0).rejected).toEqual([]);
  });

  test("a corrupt save is an error, never silently replaced", () => {
    expect(() => syncSave({ v: 1, gold: 5 }, [], 0)).toThrow("bad_save");
  });
  test("reports what happened while away, from a minute on", () => {
    const save = toSave(newState(0));
    expect(syncSave(save, [], 30_000).offline).toBeNull();
    const r = syncSave(save, [], 600_000);
    expect(r.offline).not.toBeNull();
    expect(r.offline!.seconds).toBeCloseTo(600, 6);
    expect(r.offline!.floorFrom).toBe(1);
    expect(r.offline!.floorTo).toBe(r.save.run.floor);
    expect(r.offline!.gold).toBe(r.save.gold);
    expect(syncSave(undefined, [], 600_000).offline).toBeNull();
  });
});
