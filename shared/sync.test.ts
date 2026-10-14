import { describe, expect, test } from "vitest";
import { Big } from "./big";
import { newState, toSave } from "./state";
import { MAX_INTENTS_PER_SYNC, syncSave } from "./sync";
import { PROLOGUE_ID, settle as settleTo } from "./settle";
// A new game whose prologue has been read (an unread one stands still; see settle.ts).
const played = (now: number) => ({ ...newState(now), story: [PROLOGUE_ID] });

describe("syncSave", () => {
  test("no save yet: a new game at the server's time", () => {
    const r = syncSave(undefined, [], 5000);
    expect(r.now).toBe(5000);
    expect(r.save.lastTick).toBe(5000);
    expect(r.save.run.floor).toBe(1);
    expect(r.rejected).toEqual([]);
  });

  test("settles up to now before applying intents", () => {
    const save = toSave({ ...played(0), gold: Big.of(5) });
    // Too poor for the first side job (10) at t=0, rich enough after 60 s of fighting.
    const r = syncSave(save, [{ k: "levelSideJob", id: "j00" }], 60_000);
    expect(r.rejected).toEqual([]);
    expect(r.save.sideJobs.j00.level).toBe(1);
  });

  test("reports bad and refused intents by index and keeps going", () => {
    const save = toSave({ ...played(0), gold: Big.of(1, 200) });
    const r = syncSave(save, [{ k: "hack" }, { k: "levelRelic", id: "r_badge" }, { k: "levelGear" }], 0);
    expect(r.rejected).toEqual([{ index: 0, code: "bad_intent" }, { index: 1, code: "locked" }]);
    expect(r.save.gear.level).toBe(1);
  });

  test("drops intents past the per-sync limit", () => {
    const save = toSave({ ...played(0), gold: Big.of(1, 200) });
    const many = Array.from({ length: MAX_INTENTS_PER_SYNC + 2 }, () => ({ k: "levelSideJob", id: "j00" }));
    const r = syncSave(save, many, 0);
    expect(r.save.sideJobs.j00.level).toBe(MAX_INTENTS_PER_SYNC);
    expect(r.rejected).toEqual([
      { index: MAX_INTENTS_PER_SYNC, code: "too_many" },
      { index: MAX_INTENTS_PER_SYNC + 1, code: "too_many" },
    ]);
  });

  test("an intent stamped with the moment it was tapped is applied then, so the screen's guess holds", () => {
    // Farming floor 47; 보스 도전 tapped at 1.0 s, the sync reaches the server at 2.5 s.
    const s = played(0);
    s.run = { ...s.run, floor: 47, maxFloor: 47, farming: true, target: 0, carrySec: 0 };
    const r = syncSave(toSave(s), [{ k: "challengeBoss", at: 1000 }], 2500);
    expect(r.save.run.farming).toBe(false);
    expect(r.save.run.carrySec).toBeCloseTo(1.5, 6); // the boss has been walking in since 1.0 s
    // Unstamped (an older client): at the server's time.
    expect(syncSave(toSave(s), [{ k: "challengeBoss" }], 2500).save.run.carrySec).toBe(0);
  });

  test("a stamp is kept between the last sync and now: never before the save, never in the future", () => {
    const s = played(0);
    s.run = { ...s.run, floor: 47, maxFloor: 47, farming: true, target: 0, carrySec: 0 };
    const save = toSave(settleTo(s, 1000));
    expect(syncSave(save, [{ k: "challengeBoss", at: -50_000 }], 2500).save.run.carrySec).toBeCloseTo(1.5, 6);
    expect(syncSave(save, [{ k: "challengeBoss", at: 9_999_999 }], 2500).save.run.carrySec).toBe(0);
    expect(syncSave(save, [{ k: "challengeBoss", at: "soon" }], 2500).save.run.carrySec).toBe(0);
  });

  test("after a long time away the stamps are ignored (the away report covers up to now)", () => {
    const s = played(0);
    s.run = { ...s.run, floor: 47, maxFloor: 47, farming: true, target: 0, carrySec: 0 };
    const r = syncSave(toSave(s), [{ k: "challengeBoss", at: 1000 }], 600_000);
    expect(r.offline).not.toBeNull();
    expect(r.save.run.carrySec).toBe(0);
  });

  test("a non-array intents value counts as none", () => {
    expect(syncSave(undefined, "levelGear", 0).rejected).toEqual([]);
  });

  test("a corrupt save is an error, never silently replaced", () => {
    expect(() => syncSave({ v: 1, gold: 5 }, [], 0)).toThrow("bad_save");
  });
  test("reports what happened while away, from a minute on", () => {
    const save = toSave(played(0));
    expect(syncSave(save, [], 30_000).offline).toBeNull();
    const r = syncSave(save, [], 600_000);
    expect(r.offline).not.toBeNull();
    expect(r.offline!.seconds).toBeCloseTo(600, 6);
    expect(r.offline!.floorFrom).toBe(1);
    expect(r.offline!.floorTo).toBe(r.save.run.floor);
    expect(Big.from(r.offline!.gold).add(Big.of(10)).toString()).toBe(r.save.gold);
    expect(syncSave(undefined, [], 600_000).offline).toBeNull();
  });
});
