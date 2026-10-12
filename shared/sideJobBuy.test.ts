import { describe, expect, test } from "vitest";
import { applyIntent } from "./actions";
import { Big } from "./big";
import { SIDE_JOBS } from "./data/sideJobs";
import { sideJobBuy } from "./prices";
import { newState } from "./state";

describe("sideJobBuy preview", () => {
  const job = SIDE_JOBS[0];

  test("matches what the action really buys and charges", () => {
    // Gold the cost is a visible part of (a far larger purse loses it to Big's precision).
    for (const gold of [Big.of(1, 3), Big.of(1, 9)]) {
      for (const count of [1, 10, "max"] as const) {
        const s = { ...newState(0), gold, sideJobs: { [job.id]: { level: 7, progressSec: 0, running: true } } };
        const preview = sideJobBuy(s, job, 7, count);
        const after = applyIntent(s, { k: "levelSideJob", id: job.id, count });
        expect(after.sideJobs[job.id].level).toBe(7 + preview.levels);
        expect(s.gold.sub(after.gold).toNumber()).toBeCloseTo(preview.cost.toNumber(), 3);
      }
    }
  });

  test("with far more gold than needed the levels still agree", () => {
    const s = { ...newState(0), gold: Big.of(1, 30), sideJobs: { [job.id]: { level: 7, progressSec: 0, running: true } } };
    for (const count of [1, 10, "max"] as const) {
      expect(applyIntent(s, { k: "levelSideJob", id: job.id, count }).sideJobs[job.id].level).toBe(7 + sideJobBuy(s, job, 7, count).levels);
    }
  });

  test("a level it cannot afford is still previewed as one level (the button is disabled then)", () => {
    const s = { ...newState(0), gold: Big.ZERO };
    expect(sideJobBuy(s, job, 0, 10).levels).toBe(1);
  });
});
