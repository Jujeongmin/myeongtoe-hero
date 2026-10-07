import { describe, expect, test } from "vitest";
import { applyIntent, RuleError } from "./actions";
import { Big } from "./big";
import { BOSS_LIMIT_SEC } from "./data/floors";
import { PARK_PASS_MAX, PARK_RECHARGE_SEC, chestTickets, runParking } from "./data/parking";
import { dailyOf } from "./daily";
import { settle } from "./settle";
import { newState, type GameState } from "./state";
import { heroPower, type Power } from "./stats";
import { kstDay } from "./time";

const P = (dps: Big): Power => ({ dps, bossDps: dps, bossLimitSec: BOSS_LIMIT_SEC, goldMult: 1, hpMult: 1, drainPerSec: 0, walkSec: 1, hitSec: 0.5, killGold: Big.of(1) });

function code(s: GameState): string {
  try {
    applyIntent(s, { k: "enterParking" });
    return "";
  } catch (error) {
    if (error instanceof RuleError) return error.code;
    throw error;
  }
}

describe("a parking run", () => {
  test("30 seconds deep; a chest every 20 m with exponentially more tickets", () => {
    expect(chestTickets(1)).toBe(1);
    expect(chestTickets(10)).toBe(Math.floor(1.25 ** 9));
    const weak = runParking(P(Big.of(100)));
    expect(weak.depth).toBeGreaterThan(0);
    const strong = runParking(P(Big.of(1, 6)));
    expect(strong.depth).toBeGreaterThan(weak.depth);
    expect(strong.chests).toBe(Math.floor(strong.depth / 20));
    let sum = 0;
    for (let k = 1; k <= strong.chests; k++) sum += chestTickets(k);
    expect(strong.tickets).toBe(sum);
  });
});

describe("parking passes", () => {
  test("recharge one per 15 minutes, up to 16", () => {
    const s = newState(0);
    s.parking = { passes: 10, passCarrySec: 0, best: 0 };
    const later = settle(s, (PARK_RECHARGE_SEC * 2 + 60) * 1000);
    expect(later.parking.passes).toBe(12);
    expect(later.parking.passCarrySec).toBeCloseTo(60, 6);
    const full = settle(s, PARK_RECHARGE_SEC * 100 * 1000);
    expect(full.parking.passes).toBe(PARK_PASS_MAX);
    expect(full.parking.passCarrySec).toBe(0);
  });
});

describe("entering the parking garage", () => {
  const now = Date.UTC(2026, 9, 6, 3, 0);

  test("spends a pass, pays the run's tickets, records the day and the best", () => {
    const s = newState(now);
    const preview = runParking(heroPower(s));
    const after = applyIntent(s, { k: "enterParking" });
    expect(after.parking.passes).toBe(PARK_PASS_MAX - 1);
    expect(after.tickets - s.tickets).toBe(preview.tickets);
    expect(after.parking.best).toBe(preview.depth);
    expect(after.daily).toEqual({ day: kstDay(now), entries: 1, bestDepth: preview.depth, claimed: [] });
  });

  test("no pass, no entry", () => {
    const s = newState(now);
    s.parking = { passes: 0, passCarrySec: 0, best: 0 };
    expect(code(s)).toBe("no_pass");
  });

  test("a new KST day starts a fresh daily record", () => {
    const s = newState(now);
    s.daily = { day: "2000-01-01", entries: 9, bestDepth: 99, claimed: ["e1"] };
    expect(dailyOf(s)).toEqual({ day: kstDay(now), entries: 0, bestDepth: 0, claimed: [] });
    expect(applyIntent(s, { k: "enterParking" }).daily.entries).toBe(1);
  });
});
