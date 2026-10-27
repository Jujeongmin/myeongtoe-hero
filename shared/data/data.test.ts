import { describe, expect, test } from "vitest";
import { Big } from "../big";
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

  test("floors 1-3 are a warm-up: a new player's 공격력 (50) kills a monster in 2-3 hits, easing into the usual health by floor 6", () => {
    const hits = (f: number) => Math.ceil(targetHp(f, 0).toNumber() / gearAtk(0, 0).toNumber());
    expect([1, 2, 3].map(hits).every((n) => n >= 2 && n <= 3)).toBe(true);
    for (const f of [6, 10, 100]) expect(targetHp(f, 0).div(normalHp(f)).toNumber()).toBeCloseTo(1, 9);
    // Each floor still harder than the one before.
    for (let f = 1; f < 8; f++) expect(targetHp(f + 1, 0).cmp(targetHp(f, 0))).toBe(1);
    // Their bosses: ×2 on floors 1-3 (a few seconds each), the usual ×5 from floor 4.
    expect(targetHp(1, 4).div(targetHp(1, 0)).toNumber()).toBeCloseTo(2, 9);
    expect(targetHp(4, 4).div(targetHp(4, 0)).toNumber()).toBeCloseTo(5, 9);
  });

  test("health: 570 on floor 1, 10% more a floor, 5% from floor 600", () => {
    expect(normalHp(1).toNumber()).toBeCloseTo(570, 6);
    const growth = (f: number) => normalHp(f + 1).div(normalHp(f)).toNumber();
    for (const f of [1, 50, 100, 300, 599]) expect(growth(f)).toBeCloseTo(1.1, 9);
    for (const f of [600, 1000, 5000]) expect(growth(f)).toBeCloseTo(1.05, 9);
    expect(normalHp(100).div(Big.of(570 * 1.1 ** 99)).toNumber()).toBeCloseTo(1, 6);
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

describe("gear", () => {
  test("40 tiers with unique ids and names, the first one free", () => {
    expect(GEAR_TIERS).toHaveLength(40);
    expect(new Set(GEAR_TIERS.map((g) => g.id)).size).toBe(40);
    expect(new Set(GEAR_TIERS.map((g) => g.name)).size).toBe(40);
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
  test("35 jobs, unique ids and names, all open from the start, each a minute or less", () => {
    expect(SIDE_JOBS).toHaveLength(35);
    expect(new Set(SIDE_JOBS.map((j) => j.id)).size).toBe(35);
    expect(new Set(SIDE_JOBS.map((j) => j.name)).size).toBe(35);
    expect(SIDE_JOBS.every((j) => j.baseCycleSec <= 60)).toBe(true);
    // Each next job costs more and earns more a second than the one before.
    for (let i = 1; i < SIDE_JOBS.length; i++) {
      const [a, b] = [SIDE_JOBS[i - 1], SIDE_JOBS[i]];
      expect(b.baseCost.cmp(a.baseCost)).toBe(1);
      expect(b.baseIncome.mulN(1 / b.baseCycleSec).cmp(a.baseIncome.mulN(1 / a.baseCycleSec))).toBe(1);
    }
    expect(SIDE_JOBS.every((j) => j.unlockFloor === 1)).toBe(true);
    expect(findSideJob(SIDE_JOBS[3].id)).toBe(SIDE_JOBS[3]);
    expect(findSideJob("nope")).toBeUndefined();
    expect(SIDE_JOB_MAX_LEVEL).toBe(999);
  });

  test("the first one: 10 gold, 1 s, pays 6; levels cost 12% more each and pay half the base more", () => {
    const job = SIDE_JOBS[0];
    expect(sideJobCost(job, 0).toNumber()).toBe(10);
    expect(sideJobCost(job, 1).toNumber()).toBeCloseTo(11.2, 9);
    expect(sideJobIncome(job, 0).isZero()).toBe(true);
    expect([1, 2, 3].map((l) => sideJobIncome(job, l).toNumber())).toEqual([6, 9, 12]);
    expect(sideJobCycle(job, 1)).toBe(1);
    expect(sideJobCycle(job, 500)).toBe(1);
  });
});
