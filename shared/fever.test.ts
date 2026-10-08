import { describe, expect, test } from "vitest";
import { applyIntent } from "./actions";
import { FEVER_KILL_SEC, FEVER_MS } from "./data/fever";
import { MONSTERS_PER_FLOOR } from "./data/floors";
import { settle } from "./settle";
import { newState, type GameState } from "./state";
import { PROLOGUE_ID } from "./settle";
// A new game whose prologue has been read (an unread one stands still; see settle.ts).
const played = (now: number) => ({ ...newState(now), story: [PROLOGUE_ID] });

// A save at floor 80 ready for a 연봉협상.
function ready(): GameState {
  const s = played(0);
  s.run = { ...s.run, floor: 80, maxFloor: 80 };
  s.bestFloor = 80;
  return s;
}

// Just after a 연봉협상 from floor `toFloor` (the fever climbs a floor a second).
function feverFrom(toFloor: number): GameState {
  const s = played(0);
  s.fever = { until: s.lastTick + FEVER_MS, toFloor };
  return s;
}

describe("피버타임", () => {
  test("a 연봉협상 starts it: back up to the floor reached, at most FEVER_MS", () => {
    const after = applyIntent(ready(), { k: "prestige", mode: "plain" });
    expect(after.fever).toEqual({ until: after.lastTick + FEVER_MS, toFloor: 80 });
    expect(after.run.floor).toBe(1);
  });

  test("Park charges up a floor every ten quick kills and stops at the old floor", () => {
    const s = feverFrom(20);
    const floorSec = FEVER_KILL_SEC * MONSTERS_PER_FLOOR;
    const mid = settle(s, s.lastTick + 10 * floorSec * 1000 + 1);
    expect(mid.run.floor).toBe(11);
    expect(mid.gold.isZero()).toBe(false);
    const done = settle(s, s.lastTick + FEVER_MS);
    expect(done.run.floor).toBeGreaterThanOrEqual(20);
    expect(done.fever.until).toBe(0);
  });

  test("splitting the time any way gives the same result", () => {
    const s = feverFrom(20);
    const whole = settle(s, s.lastTick + 12_345);
    let parts = s;
    for (let ms = 1_111; ms <= 12_345; ms += 1_111) parts = settle(parts, s.lastTick + ms);
    parts = settle(parts, s.lastTick + 12_345);
    expect(parts.run.floor).toBe(whole.run.floor);
    expect(parts.run.target).toBe(whole.run.target);
  });

  test("it ends after FEVER_MS even short of the old floor", () => {
    const s = ready();
    s.run = { ...s.run, floor: 5000, maxFloor: 5000 };
    const after = applyIntent(s, { k: "prestige", mode: "plain" });
    const later = settle(after, after.lastTick + FEVER_MS + 60_000);
    const atEnd = settle(after, after.lastTick + FEVER_MS);
    expect(atEnd.run.floor).toBeLessThan(5000);
    expect(later.run.floor - atEnd.run.floor).toBeLessThan(50);
  });
});
