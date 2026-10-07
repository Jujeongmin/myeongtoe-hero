import { describe, expect, test } from "vitest";
import {
  MONSTERS_PER_FLOOR, bossGems, bossMult, bossTickets, departmentOf, isBoss, killGoldMult, normalHp, targetHp,
} from "./floors";
import { GEAR_MAX_LEVEL, GEAR_TIERS, gearAtk, gearLevelCost, gearPrice } from "./gear";
import { SIDE_JOBS, SIDE_JOB_MAX_LEVEL, findSideJob, sideJobCost, sideJobCycle, sideJobIncome } from "./sideJobs";

describe("floors", () => {
  test("five monsters a floor, the last one its boss: ×5, ×10 every 10th, ×50 every 100th", () => {
    expect(MONSTERS_PER_FLOOR).toBe(5);
    expect([0, 1, 2, 3, 4].map(isBoss)).toEqual([false, false, false, false, true]);
    expect([7, 10, 100, 110].map(bossMult)).toEqual([5, 10, 50, 10]);
    expect(targetHp(7, 4).div(targetHp(7, 0)).toNumber()).toBeCloseTo(5, 9);
    expect(killGoldMult(100, 4)).toBe(50);
    expect(killGoldMult(100, 3)).toBe(1);
  });

  test("health: 570 on floor 1, growth easing from ×1.15 to ×1.05", () => {
    expect(normalHp(1).toNumber()).toBeCloseTo(570, 6);
    expect(normalHp(2).div(normalHp(1)).toNumber()).toBeCloseTo(1.15, 9);
    expect(normalHp(101).div(normalHp(100)).toNumber()).toBeCloseTo(1.1, 9);
    expect(normalHp(201).div(normalHp(200)).toNumber()).toBeCloseTo(1.08, 9);
    expect(normalHp(401).div(normalHp(400)).toNumber()).toBeCloseTo(1.07, 9);
    expect(normalHp(501).div(normalHp(500)).toNumber()).toBeCloseTo(1.05, 9);
    expect(normalHp(1000).div(normalHp(999)).toNumber()).toBeCloseTo(1.05, 9);
    // The 100th-floor dragon: 570 / 1.15 × 1.15^100 × 50.
    expect(targetHp(100, 4).div(Big100()).toNumber()).toBeCloseTo(1, 6);
  });

  test("boss rewards: 2 tickets a floor, 5 and 3 gems every 10th, 10 and 20 gems every 100th", () => {
    expect([bossTickets(7), bossTickets(10), bossTickets(100)]).toEqual([2, 5, 10]);
    expect([bossGems(7), bossGems(10), bossGems(100)]).toEqual([0, 3, 20]);
  });

  test("a department every 100 floors, cycling through six", () => {
    expect(departmentOf(1)).toBe("총무팀");
    expect(departmentOf(100)).toBe("총무팀");
    expect(departmentOf(101)).toBe("영업팀");
    expect(departmentOf(601)).toBe("총무팀");
  });
});

function Big100() {
  return normalHp(1).mulN((1.15 ** 99) * 50);
}

describe("gear", () => {
  test("30 tiers with unique ids, the first one free", () => {
    expect(GEAR_TIERS).toHaveLength(30);
    expect(new Set(GEAR_TIERS.map((g) => g.id)).size).toBe(30);
    expect(gearPrice(0).isZero()).toBe(true);
  });

  test("bought at Lv1, upgraded to Lv5: costs 3a, 4a, 5a, 6a for a price of 2a; attack 5b … 9b", () => {
    expect(GEAR_MAX_LEVEL).toBe(4);
    const a = gearPrice(1).toNumber() / 2;
    expect([0, 1, 2, 3].map((l) => gearLevelCost(1, l).toNumber() / a)).toEqual([3, 4, 5, 6]);
    const b = gearAtk(1, 0).toNumber() / 5;
    expect([0, 1, 2, 3, 4].map((l) => gearAtk(1, l).toNumber() / b)).toEqual([5, 6, 7, 8, 9]);
    expect(gearAtk(2, 0).toNumber() / b).toBeCloseTo(15, 9);
    expect(gearPrice(2).toNumber() / a).toBeCloseTo(12, 9);
  });

  test("each tier costs more and hits harder than the one before", () => {
    for (let t = 2; t < GEAR_TIERS.length; t++) expect(gearPrice(t).cmp(gearPrice(t - 1))).toBe(1);
    for (let t = 1; t < GEAR_TIERS.length; t++) expect(gearAtk(t, 0).cmp(gearAtk(t - 1, 0))).toBe(1);
  });
});

describe("side jobs", () => {
  test("25 jobs, unique ids, all open from the start", () => {
    expect(SIDE_JOBS).toHaveLength(25);
    expect(new Set(SIDE_JOBS.map((j) => j.id)).size).toBe(25);
    expect(SIDE_JOBS.every((j) => j.unlockFloor === 1)).toBe(true);
    expect(findSideJob(SIDE_JOBS[3].id)).toBe(SIDE_JOBS[3]);
    expect(findSideJob("nope")).toBeUndefined();
    expect(SIDE_JOB_MAX_LEVEL).toBe(999);
  });

  test("the first one: 10 gold, 1 s, pays 10; levels cost 12% more each and pay half the base more", () => {
    const job = SIDE_JOBS[0];
    expect(sideJobCost(job, 0).toNumber()).toBe(10);
    expect(sideJobCost(job, 1).toNumber()).toBeCloseTo(11.2, 9);
    expect(sideJobIncome(job, 0).isZero()).toBe(true);
    expect([1, 2, 3].map((l) => sideJobIncome(job, l).toNumber())).toEqual([10, 15, 20]);
    expect(sideJobCycle(job, 1)).toBe(1);
    expect(sideJobCycle(job, 500)).toBe(1);
  });
});
