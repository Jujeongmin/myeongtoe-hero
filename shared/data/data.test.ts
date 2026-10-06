import { describe, expect, test } from "vitest";
import { GOLD_GROWTH, HP_GROWTH, bossMult, isBossFloor, killGold, targetHp, targetsOn } from "./floors";
import { GEAR_TIERS, gearAtk, gearLevelCost, gearPrice } from "./gear";
import { SIDE_JOBS, findSideJob, sideJobCost, sideJobCycle, sideJobIncome } from "./sideJobs";

describe("floors", () => {
  test("bosses on every 5th, 10th and 100th floor", () => {
    expect(bossMult(7)).toBe(0);
    expect(bossMult(5)).toBe(5);
    expect(bossMult(10)).toBe(10);
    expect(bossMult(100)).toBe(50);
    expect(isBossFloor(15)).toBe(true);
    expect(targetsOn(5)).toBe(1);
    expect(targetsOn(6)).toBe(10);
  });

  test("a boss has its multiple of a normal monster's health and gold", () => {
    const normal = targetHp(9).mulN(HP_GROWTH);
    expect(targetHp(10).div(normal).toNumber()).toBeCloseTo(10, 9);
    const gold = killGold(9).mulN(GOLD_GROWTH);
    expect(killGold(10).div(gold).toNumber()).toBeCloseTo(10, 9);
  });

  test("health outgrows gold, so every run hits a wall", () => {
    expect(HP_GROWTH).toBeGreaterThan(GOLD_GROWTH);
  });
});

describe("gear", () => {
  test("30 tiers with unique ids, the first one free", () => {
    expect(GEAR_TIERS).toHaveLength(30);
    expect(new Set(GEAR_TIERS.map((g) => g.id)).size).toBe(30);
    expect(gearPrice(0).isZero()).toBe(true);
  });

  test("each tier costs more and hits harder than the one before", () => {
    for (let t = 2; t < GEAR_TIERS.length; t++) expect(gearPrice(t).cmp(gearPrice(t - 1))).toBe(1);
    for (let t = 1; t < GEAR_TIERS.length; t++) expect(gearAtk(t, 0).cmp(gearAtk(t - 1, 0))).toBe(1);
  });

  test("levels raise attack and cost", () => {
    expect(gearAtk(0, 10).cmp(gearAtk(0, 0))).toBe(1);
    expect(gearLevelCost(0, 10).cmp(gearLevelCost(0, 0))).toBe(1);
  });
});

describe("side jobs", () => {
  test("20 jobs, unique ids, unlocking in floor order", () => {
    expect(SIDE_JOBS).toHaveLength(20);
    expect(new Set(SIDE_JOBS.map((j) => j.id)).size).toBe(20);
    expect(SIDE_JOBS[0].unlockFloor).toBe(1);
    for (let i = 1; i < SIDE_JOBS.length; i++) {
      expect(SIDE_JOBS[i].unlockFloor).toBeGreaterThan(SIDE_JOBS[i - 1].unlockFloor);
    }
    expect(findSideJob(SIDE_JOBS[3].id)).toBe(SIDE_JOBS[3]);
    expect(findSideJob("nope")).toBeUndefined();
  });

  test("income doubles every 25 levels, cycles shorten but never below a quarter", () => {
    const job = SIDE_JOBS[0];
    expect(sideJobIncome(job, 0).isZero()).toBe(true);
    // Income per level, the level count divided out, isolates the ×2 milestone.
    const per24 = sideJobIncome(job, 24).div(job.baseIncome).toNumber() / 24;
    const per25 = sideJobIncome(job, 25).div(job.baseIncome).toNumber() / 25;
    expect(per25 / per24).toBeCloseTo(2, 9);
    expect(sideJobCycle(job, 1)).toBeCloseTo(job.baseCycleSec, 9);
    expect(sideJobCycle(job, 1000)).toBeCloseTo(job.baseCycleSec * 0.25, 9);
    expect(sideJobCost(job, 1).cmp(sideJobCost(job, 0))).toBe(1);
  });
});
