import { describe, expect, test } from "vitest";
import { Big } from "./big";
import { BOSS_LIMIT_SEC } from "./data/floors";
import { PETS, awakenStage, petLevelCost, petsUnlocked } from "./data/pets";
import { SIDE_JOBS } from "./data/sideJobs";
import { mods } from "./mods";
import { settle, settleBattle, targetSec } from "./settle";
import { newState } from "./state";
import { heroPower, type Power } from "./stats";

const at = (bestFloor: number) => ({ ...newState(0), bestFloor });

describe("pet table", () => {
  test("7 pets unlocked by best floor, in order", () => {
    expect(PETS.map((p) => p.unlockFloor)).toEqual([100, 300, 600, 900, 1100, 4500, 6500]);
    expect(petsUnlocked(99)).toEqual([]);
    expect(petsUnlocked(600).map((p) => p.id)).toEqual(["p_intern", "p_jumim", "p_daeri"]);
    expect(petLevelCost(2)).toBeGreaterThan(petLevelCost(1));
  });

  test("awakening every 2000 floors, up to 10", () => {
    expect(awakenStage(1999)).toBe(0);
    expect(awakenStage(2000)).toBe(1);
    expect(awakenStage(99_999)).toBe(10);
  });
});

describe("pet effects", () => {
  test("none before floor 100", () => {
    const m = mods(at(1));
    expect(m.extraHitPerSec).toBe(0);
    expect(m.hpMult).toBe(1);
    expect(m.ticketPerKill).toBe(0);
  });

  test("김인턴 adds an extra hit of 100% attack every 2.5 s", () => {
    expect(mods(at(100)).extraHitPerSec).toBeCloseTo(0.4, 12);
    const s = at(100);
    s.pets.p_intern = 11;
    expect(mods(s).extraHitPerSec).toBeCloseTo(0.4 * 2, 12);
  });

  test("최대리 and 꽃미남 cut monster health, 홍과장 drains it", () => {
    expect(mods(at(600)).hpMult).toBeCloseTo(0.85, 12);
    expect(mods(at(6500)).hpMult).toBeLessThan(0.85 * 0.96 + 1e-9);
    expect(mods(at(4500)).drainPerSec).toBeGreaterThan(0);
  });

  test("a drain speeds kills: time = 1 / (dps/hp + drain)", () => {
    const p: Power = { dps: Big.of(1), bossDps: Big.of(1), bossLimitSec: BOSS_LIMIT_SEC, goldMult: 1, hpMult: 1, drainPerSec: 0.1 };
    // floor 1: 100 hp at 1 dps → 1 / (0.01 + 0.1)
    expect(targetSec(1, p)).toBeCloseTo(1 / 0.11, 9);
  });

  test("막내 오사원's ticket drops carry fractions across settles", () => {
    const s = at(1100);
    s.gear = { tier: 10, level: 0, confirmed: 0 };
    const once = settle(s, 3_600_000);
    let split = s;
    for (let t = 60_000; t <= 3_600_000; t += 60_000) split = settle(split, t);
    expect(split.tickets).toBe(once.tickets);
    expect(once.tickets).toBeGreaterThan(0);
  });

  test("박주임 pays the dearest side job every 20 s", () => {
    const s = at(300);
    s.sideJobs[SIDE_JOBS[0].id] = { level: 1, progressSec: 0, running: false };
    const quiet = { ...at(1), sideJobs: s.sideJobs };
    expect(settle(s, 200_000).gold.cmp(settle(quiet, 200_000).gold)).toBe(1);
  });

  test("they reach Park's power", () => {
    expect(heroPower(at(100)).dps.cmp(heroPower(at(1)).dps)).toBe(1);
    expect(settleBattle(newState(0).run, heroPower(at(1)), 10).kills).toBeGreaterThan(0);
  });
});
