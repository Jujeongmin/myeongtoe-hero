import { describe, expect, test } from "vitest";
import { ALERT_KEYS, activeAlerts, alertScreens, type AlertKey } from "./alerts";
import { Big } from "./big";
import { DAILY_QUESTS } from "./data/dailyQuests";
import { GEAR_MAX_LEVEL } from "./data/gear";
import { newState, type GameState } from "./state";
import { kstDay } from "./time";

const T0 = 1_000_000_000_000;

// A player with nothing waiting, standing at `floor`.
function calm(floor = 1): GameState {
  const s = newState(T0);
  s.gold = Big.ZERO;
  s.parking.passes = 0;
  // Every rewarded ad just watched (on cooldown), so the shop has nothing waiting.
  s.ads = { ad_gems: T0, ad_gold: T0, ad_coupons: T0, ad_parking: T0 };
  s.run = { ...s.run, floor, maxFloor: floor };
  s.bestFloor = floor;
  return s;
}

const on = (s: GameState): AlertKey[] => ALERT_KEYS.filter((k) => activeAlerts(s)[k]);

describe("red dots: a free reward or action waiting", () => {
  test("nothing waiting: no dot", () => {
    expect(on(calm())).toEqual([]);
    expect(on(calm(2000))).toEqual([]);
  });

  test("upgrades and purchases never light a dot, however much there is to spend", () => {
    const s = calm(2000);
    s.gold = Big.of(1, 30);
    s.gems = 1e6;
    s.coupons = 1e6;
    s.tickets = 1e6;
    s.gear = { tier: 0, level: GEAR_MAX_LEVEL, confirmed: 0 };
    expect(on(s)).toEqual([]);
  });

  test("shop: a rewarded ad off cooldown, the daily VX gems", () => {
    const s = calm();
    s.ads.ad_gems = T0 - 20 * 60_000; // its 15 minutes are over
    expect(on(s)).toEqual(["shop:ad"]);
    s.ads = {}; // never watched
    expect(on(s)).toEqual(["shop:ad"]);
    const p = calm();
    p.vx = { ...p.vx, premium: true };
    expect(on(p)).toEqual(["shop:daily"]);
    p.vx = { ...p.vx, dailyClaimed: kstDay(T0) };
    expect(on(p)).toEqual([]);
  });

  test("the parking ad is no reason for a dot while the passes are full", () => {
    const s = calm();
    s.ads.ad_parking = 0;
    s.parking.passes = 16;
    expect(on(s)).not.toContain("shop:ad");
  });

  test("dungeon: a pass to use from floor 5; a finished daily quest", () => {
    const s = calm(4);
    s.parking.passes = 3;
    expect(on(s)).toEqual([]);
    s.bestFloor = 5;
    expect(on(s)).toEqual(["dungeon:enter"]);
    s.parking = { ...s.parking, runUntil: T0 + 30_000, claimed: false };
    expect(on(s)).toEqual([]);
    const q = calm(5);
    const goal = DAILY_QUESTS.find((x) => x.kind === "entries")!;
    q.daily = { day: kstDay(T0), entries: goal.goal, bestDepth: 0, claimed: [] };
    expect(on(q)).toEqual(["dungeon:quest"]);
    q.daily = { ...q.daily, claimed: [goal.id] };
    expect(on(q)).toEqual([]);
  });

  test("every dot belongs to a screen that clears it", () => {
    expect(Object.keys(alertScreens).sort()).toEqual([...ALERT_KEYS].sort());
  });
});
