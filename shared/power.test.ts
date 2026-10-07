import { describe, expect, test } from "vitest";
import { BOSS_LIMIT_SEC } from "./data/floors";
import { newState } from "./state";
import { heroDps, heroPower } from "./stats";

describe("heroPower", () => {
  test("a fresh Park: the pen alone", () => {
    const p = heroPower(newState(0));
    expect(p.dps.toNumber()).toBeCloseTo(50 * 2 * 1.025, 9);
    expect(p.bossDps.toNumber()).toBeCloseTo(p.dps.toNumber(), 9);
    expect(p.bossLimitSec).toBe(BOSS_LIMIT_SEC);
    expect(p.goldMult).toBe(1);
    expect(heroDps(newState(0)).toNumber()).toBeCloseTo(p.dps.toNumber(), 9);
  });
});
