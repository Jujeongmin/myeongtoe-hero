import { describe, expect, test } from "vitest";
import { SIDE_JOBS, sideJobIncome, sideJobMilestone, sideJobMilestoneMult } from "./data/sideJobs";

describe("side job milestones", () => {
  const job = SIDE_JOBS[0];

  test("income doubles at each milestone level", () => {
    expect(sideJobMilestoneMult(9)).toBe(1);
    expect(sideJobMilestoneMult(10)).toBe(2);
    expect(sideJobMilestoneMult(24)).toBe(2);
    expect(sideJobMilestoneMult(25)).toBe(4);
    expect(sideJobMilestoneMult(100)).toBe(16);
    expect(sideJobIncome(job, 10).div(sideJobIncome(job, 9)).toNumber()).toBeCloseTo((11 / 10) * 2);
    expect(sideJobIncome(job, 25).div(sideJobIncome(job, 24)).toNumber()).toBeCloseTo((26 / 25) * 2);
  });

  test("the level-10 milestone pays for itself: from level 10 on, the pay is what it was before it", () => {
    // Before: level n paid 10 × (n + 1) / 2, doubled at 25, 50, 100, …
    const before = (n: number) => 10 * ((n + 1) / 2) * 2 ** [25, 50, 100, 200].filter((m) => m <= n).length;
    for (const n of [10, 24, 25, 99, 100, 150]) expect(sideJobIncome(job, n).toNumber()).toBeCloseTo(before(n));
    expect(sideJobIncome(job, 9).toNumber()).toBeCloseTo(before(9) / 2);
  });

  test("the next milestone and the one before it", () => {
    expect(sideJobMilestone(0)).toEqual({ from: 0, to: 10 });
    expect(sideJobMilestone(10)).toEqual({ from: 10, to: 25 });
    expect(sideJobMilestone(25)).toEqual({ from: 25, to: 50 });
    expect(sideJobMilestone(150)).toEqual({ from: 100, to: 200 });
    expect(sideJobMilestone(950)).toBeNull();
  });
});
