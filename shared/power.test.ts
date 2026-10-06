import { describe, expect, test } from "vitest";
import { BOSS_LIMIT_SEC } from "./data/floors";
import { SKILLS, skillFactor, skillsUnlocked } from "./data/skills";
import { newState } from "./state";
import { heroDps, heroPower } from "./stats";

describe("skills data", () => {
  test("unlock by best floor, in order", () => {
    expect(skillsUnlocked(1)).toEqual([]);
    expect(skillsUnlocked(SKILLS[1].unlockFloor).map((s) => s.id)).toEqual([SKILLS[0].id, SKILLS[1].id]);
  });

  test("a timed skill counts as its average", () => {
    const kaltoe = SKILLS[0];
    expect(skillFactor(kaltoe)).toBeCloseTo(1 + ((kaltoe.value - 1) * kaltoe.durationSec) / kaltoe.cooldownSec, 12);
  });
});

describe("heroPower", () => {
  test("a fresh Park: the pen alone", () => {
    const p = heroPower(newState(0));
    expect(p.dps.toNumber()).toBeCloseTo(50 * 2 * 1.025, 9);
    expect(p.bossDps.toNumber()).toBeCloseTo(p.dps.toNumber(), 9);
    expect(p.bossLimitSec).toBe(BOSS_LIMIT_SEC);
    expect(p.goldMult).toBe(1);
    expect(heroDps(newState(0)).toNumber()).toBeCloseTo(p.dps.toNumber(), 9);
  });

  test("unlocked skills add their averages and boss time", () => {
    const s = newState(0);
    s.bestFloor = 1000;
    const p = heroPower(s);
    const fresh = heroPower(newState(0));
    expect(p.dps.cmp(fresh.dps)).toBe(1);
    expect(p.bossLimitSec).toBe(BOSS_LIMIT_SEC + 10);
    expect(p.goldMult).toBeGreaterThan(1);
  });
});
