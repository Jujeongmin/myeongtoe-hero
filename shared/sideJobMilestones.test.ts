import { describe, expect, test } from "vitest";
import { SIDE_JOBS, sideJobIncome, sideJobMilestone, sideJobMilestoneMult } from "./data/sideJobs";

describe("side job milestones", () => {
  const job = SIDE_JOBS[0];

  test("income doubles at each milestone level", () => {
    expect(sideJobMilestoneMult(24)).toBe(1);
    expect(sideJobMilestoneMult(25)).toBe(2);
    expect(sideJobMilestoneMult(100)).toBe(8);
    expect(sideJobIncome(job, 25).div(sideJobIncome(job, 24)).toNumber()).toBeCloseTo((26 / 25) * 2);
  });

  test("the next milestone and the one before it", () => {
    expect(sideJobMilestone(0)).toEqual({ from: 0, to: 25 });
    expect(sideJobMilestone(25)).toEqual({ from: 25, to: 50 });
    expect(sideJobMilestone(150)).toEqual({ from: 100, to: 200 });
    expect(sideJobMilestone(950)).toBeNull();
  });
});
