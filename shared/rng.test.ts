import { describe, expect, test } from "vitest";
import { nextRandom } from "./rng";

describe("nextRandom", () => {
  test("the same seed gives the same draw, and moves the seed on", () => {
    const a = nextRandom(42);
    expect(nextRandom(42)).toEqual(a);
    expect(a.seed).not.toBe(42);
    expect(nextRandom(a.seed).value).not.toBe(a.value);
  });

  test("draws stay in [0, 1) and spread out", () => {
    let seed = 1;
    const buckets = [0, 0, 0, 0];
    for (let i = 0; i < 4000; i++) {
      const r = nextRandom(seed);
      seed = r.seed;
      expect(r.value).toBeGreaterThanOrEqual(0);
      expect(r.value).toBeLessThan(1);
      buckets[Math.floor(r.value * 4)] += 1;
    }
    for (const n of buckets) expect(n).toBeGreaterThan(800);
  });
});
