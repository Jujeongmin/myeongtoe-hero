import { describe, expect, test } from "vitest";
import { applyIntent, RuleError, type Intent } from "./actions";
import { speedActive } from "./data/speed";
import { settle } from "./settle";
import { newState, type GameState } from "./state";
import { PROLOGUE_ID } from "./settle";
// A new game whose prologue has been read (an unread one stands still; see settle.ts).
const played = (now: number) => ({ ...newState(now), story: [PROLOGUE_ID] });

const T0 = 1_000_000_000_000;
const MIN = 60_000;

function strong(): GameState {
  const s = played(T0);
  s.gear = { tier: 6, level: 5, confirmed: 0 };
  s.sideJobs = { j00: { level: 5, progressSec: 0, running: true } };
  return s;
}

function codeOf(s: GameState, intent: Intent): string {
  try {
    applyIntent(s, intent);
    return "";
  } catch (error) {
    return error instanceof RuleError ? error.code : "throw";
  }
}

describe("배속", () => {
  test("an ad gives 30 minutes of double speed", () => {
    const s = applyIntent(strong(), { k: "watchAd", id: "ad_speed" });
    expect(s.speed.until).toBe(T0 + 30 * MIN);
    expect(speedActive(s)).toBe(true);
    expect(speedActive({ ...s, lastTick: T0 + 30 * MIN })).toBe(false);
  });

  test("ten minutes at double speed earn what twenty minutes do", () => {
    const fast = strong();
    fast.speed = { until: T0 + 60 * MIN, on: false };
    const a = settle(fast, T0 + 10 * MIN);
    const b = settle(strong(), T0 + 20 * MIN);
    expect(a.gold.div(b.gold).toNumber()).toBeCloseTo(1, 6);
    expect(a.run.floor).toBe(b.run.floor);
  });

  test("passes still recharge in real time", () => {
    const fast = strong();
    fast.speed = { until: T0 + 60 * MIN, on: false };
    fast.parking = { ...fast.parking, passes: 0 };
    expect(settle(fast, T0 + 15 * MIN).parking.passes).toBe(1);
  });

  test("speed ending mid-way: settling in pieces equals settling at once", () => {
    // Side jobs only (the tower's boss walls re-check per call, which is not about speed).
    const s = played(T0);
    s.sideJobs = { j00: { level: 5, progressSec: 0, running: true }, j01: { level: 3, progressSec: 0, running: true } };
    s.run = { ...s.run, farming: true };
    s.speed = { until: T0 + 7 * MIN + 321, on: false };
    const once = settle(s, T0 + 15 * MIN);
    let parts = s;
    for (const t of [T0 + 3 * MIN, T0 + 7 * MIN + 400, T0 + 15 * MIN]) parts = settle(parts, t);
    expect(parts.gold.div(once.gold).toNumber()).toBeCloseTo(1, 9);
    expect(parts.run.floor).toBe(once.run.floor);
  });

  test("프리미엄 buyers toggle it; others cannot", () => {
    expect(codeOf(strong(), { k: "toggleSpeed" })).toBe("locked");
    const p = strong();
    p.vx = { ...p.vx, premium: true };
    const on = applyIntent(p, { k: "toggleSpeed" });
    expect(speedActive(on)).toBe(true);
    expect(speedActive(applyIntent(on, { k: "toggleSpeed" }))).toBe(false);
  });
});
