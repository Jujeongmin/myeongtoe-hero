import { describe, expect, test } from "vitest";
import { BOSS_LIMIT_SEC } from "./data/floors";
import { SKILLS, skillFactor, skillsUnlocked } from "./data/skills";
import { STATS, findStat, statCost } from "./data/stats";
import { newState } from "./state";
import { heroDps, heroPower } from "./stats";

describe("stats data", () => {
  test("four stats, costs rising", () => {
    expect(STATS.map((s) => s.id)).toEqual(["atk", "crit", "critDmg", "aspd"]);
    for (const s of STATS) expect(statCost(s, 5).cmp(statCost(s, 4))).toBe(1);
    expect(findStat("nope")).toBeUndefined();
  });
});

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
    expect(p.dps.toNumber()).toBeCloseTo(10 * 2 * 1.025, 9);
    expect(p.bossDps.toNumber()).toBeCloseTo(p.dps.toNumber(), 9);
    expect(p.bossLimitSec).toBe(BOSS_LIMIT_SEC);
    expect(p.goldMult).toBe(1);
    expect(heroDps(newState(0)).toNumber()).toBeCloseTo(p.dps.toNumber(), 9);
  });

  test("stats raise damage", () => {
    const base = heroPower(newState(0)).dps.toNumber();
    const s = newState(0);
    s.stats.atk = 10;
    expect(heroPower(s).dps.toNumber()).toBeCloseTo(base * 2, 9);
    const fast = newState(0);
    fast.stats.aspd = 50;
    expect(heroPower(fast).dps.toNumber()).toBeCloseTo(base * 2, 9);
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
