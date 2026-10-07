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
    s.parking = { passes: 10, passCarrySec: 0, best: 0, runUntil: 0, last: null, claimed: true };
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

  test("spends a pass, records the day and the best; the tickets come when the result is claimed", () => {
    const s = newState(now);
    const preview = runParking(heroPower(s));
    const after = applyIntent(s, { k: "enterParking" });
    expect(after.parking.passes).toBe(PARK_PASS_MAX - 1);
    expect(after.tickets).toBe(s.tickets);
    expect(() => applyIntent(after, { k: "claimParking" })).toThrow();
    const done = settle(after, now + 31_000);
    const claimed = applyIntent(done, { k: "claimParking" });
    expect(claimed.tickets - s.tickets).toBe(preview.tickets);
    expect(after.parking.best).toBe(preview.depth);
    expect(after.daily).toEqual({ day: kstDay(now), entries: 1, bestDepth: preview.depth, claimed: [] });
  });

  test("no pass, no entry", () => {
    const s = newState(now);
    s.parking = { passes: 0, passCarrySec: 0, best: 0, runUntil: 0, last: null, claimed: true };
    expect(code(s)).toBe("no_pass");
  });

  test("a new KST day starts a fresh daily record", () => {
    const s = newState(now);
    s.daily = { day: "2000-01-01", entries: 9, bestDepth: 99, claimed: ["e1"] };
    expect(dailyOf(s)).toEqual({ day: kstDay(now), entries: 0, bestDepth: 0, claimed: [] });
    expect(applyIntent(s, { k: "enterParking" }).daily.entries).toBe(1);
  });
});

describe("a parking run takes 30 seconds", () => {
  test("the tower waits while it runs; side jobs and the rest go on", async () => {
    const { applyIntent } = await import("./actions");
    const s = newState(1000);
    s.run = { ...s.run, floor: 1, target: 0, carrySec: 0 };
    const entered = applyIntent(s, { k: "enterParking" });
    expect(entered.parking.runUntil).toBe(1000 + 30_000);
    expect(entered.parking.last).not.toBeNull();
    const during = settle(entered, 1000 + 29_000);
    expect(during.run).toEqual(entered.run);
    // Over, but unclaimed: still waiting.
    expect(settle(entered, 1000 + 60_000).run).toEqual(entered.run);
    const after = settle(applyIntent(settle(entered, 1000 + 31_000), { k: "claimParking" }), 1000 + 60_000);
    expect(after.run.carrySec + after.run.target + after.run.floor).toBeGreaterThan(entered.run.carrySec + entered.run.target + entered.run.floor);
    expect(() => applyIntent(settle(entered, 1000 + 10_000), { k: "enterParking" })).toThrow();
  });
});

describe("an unclaimed parking result", () => {
  test("pays itself after 5 minutes and the tower goes on", async () => {
    const { applyIntent } = await import("./actions");
    const s = newState(1000);
    const entered = applyIntent(s, { k: "enterParking" });
    const later = settle(entered, 1000 + 30_000 + 5 * 60_000 + 60_000);
    expect(later.parking.claimed).toBe(true);
    // (the tower's own boss tickets come on top once it moves again)
    expect(later.tickets - s.tickets).toBeGreaterThanOrEqual(entered.parking.last!.tickets);
    expect(later.run).not.toEqual(entered.run);
  });
});
