import { describe, expect, test } from "vitest";
import { ALERT_KEYS, activeAlerts, alertScreens, type AlertKey } from "./alerts";
import { Big } from "./big";
import { GEAR_MAX_LEVEL } from "./data/gear";
import { PET_BOX_COUPONS } from "./data/pets";
import { newState, type GameState } from "./state";
import { kstDay } from "./time";
import { DAILY_QUESTS } from "./data/dailyQuests";

const T0 = 1_000_000_000_000;

// A player past the guided steps with nothing to spend, standing at `floor`.
function calm(floor = 1): GameState {
  const s = newState(T0);
  s.gold = Big.ZERO;
  s.gems = 0;
  s.coupons = 0;
  s.tickets = 0;
  s.parking.passes = 0;
  // Every rewarded ad just watched (on cooldown), so the shop has nothing waiting.
  s.ads = { ad_gems: T0, ad_gold: T0, ad_coupons: T0, ad_parking: T0 };
  s.run = { ...s.run, floor, maxFloor: floor };
  s.bestFloor = floor;
  return s;
}

const on = (s: GameState): AlertKey[] => ALERT_KEYS.filter((k) => activeAlerts(s)[k]);
const only = (s: GameState, prefix: string): AlertKey[] => on(s).filter((k) => k.startsWith(prefix));

describe("red dots: something to do right now", () => {
  test("nothing to spend: no dot anywhere", () => {
    expect(on(calm())).toEqual([]);
    expect(on(calm(2000))).toEqual([]);
  });

  test("a side job not yet started that the gold pays for", () => {
    const s = calm();
    expect(on(s)).toEqual([]);
    s.gold = Big.of(10);
    expect(on(s)).toEqual(["sideJobs:start"]);
    // Once it is started the next one (dearer) is what counts.
    s.sideJobs = { j00: { level: 1, progressSec: 0, running: true } };
    s.gold = Big.of(20);
    expect(on(s)).toEqual([]);
    s.gold = Big.of(1, 6);
    expect(on(s)).toContain("sideJobs:start");
  });

  test("gear: the next one when this is at Lv5 and the gold pays; 확정 when gems and gold pay", () => {
    const s = calm();
    s.gold = Big.of(1, 30);
    s.sideJobs = Object.fromEntries(Array.from({ length: 25 }, (_, i) => [`j${String(i).padStart(2, "0")}`, { level: 1, progressSec: 0, running: true }]));
    expect(only(s, "gear")).toEqual([]); // still levelling the current one: the +1 is not a dot
    s.gear = { tier: 0, level: GEAR_MAX_LEVEL, confirmed: 0 };
    expect(only(s, "gear")).toEqual(["gear:buy"]);
    s.gems = 10;
    expect(only(s, "gear")).toEqual(["gear:buy", "gear:confirm"]);
  });

  test("coworkers: the box when the coupons pay, a level-up when the gems pay; none before the first joins", () => {
    const s = calm(100);
    s.coupons = PET_BOX_COUPONS;
    expect(only(s, "pets")).toEqual(["pets:box"]);
    s.coupons = 0;
    s.gems = 10;
    expect(only(s, "pets")).toEqual(["pets:level"]);
    const early = calm(50);
    early.coupons = 500;
    early.gems = 500;
    expect(only(early, "pets")).toEqual([]);
  });

  test("certificates: any open one the tickets (or gems, for the career ones) pay for, from floor 11", () => {
    const s = calm(11);
    s.tickets = 1000;
    expect(on(s)).toContain("certs:buy");
    const early = calm(10);
    early.tickets = 1000;
    expect(on(early)).not.toContain("certs:buy");
  });

  test("shop: a rewarded ad off cooldown, the daily VX gems", () => {
    const s = calm();
    expect(only(s, "shop")).toEqual([]);
    s.ads.ad_gems = T0 - 20 * 60_000; // its 15 minutes are over
    expect(only(s, "shop")).toEqual(["shop:ad"]);
    s.ads = {}; // never watched
    expect(only(s, "shop")).toEqual(["shop:ad"]);
    const p = calm();
    p.vx = { ...p.vx, premium: true };
    expect(only(p, "shop")).toEqual(["shop:daily"]);
    p.vx = { ...p.vx, dailyClaimed: kstDay(T0) };
    expect(only(p, "shop")).toEqual([]);
  });

  test("the parking ad is no reason for a dot while the passes are full", () => {
    const s = calm();
    for (const id of ["ad_gems", "ad_gold", "ad_coupons"]) s.ads[id] = T0;
    s.parking.passes = 16;
    expect(on(s)).not.toContain("shop:ad");
  });

  test("dungeon: a pass to use from floor 5; a finished daily quest", () => {
    const s = calm(4);
    s.parking.passes = 3;
    expect(on(s)).not.toContain("dungeon:enter");
    s.bestFloor = 5;
    s.run = { ...s.run, maxFloor: 5 };
    expect(on(s)).toContain("dungeon:enter");
    s.parking = { ...s.parking, runUntil: T0 + 30_000, claimed: false };
    expect(on(s)).not.toContain("dungeon:enter");
    const q = calm(5);
    const goal = DAILY_QUESTS.find((x) => x.kind === "entries")!;
    q.daily = { day: kstDay(T0), entries: goal.goal, bestDepth: 0, claimed: [] };
    expect(only(q, "dungeon")).toEqual(["dungeon:quest"]);
    q.daily = { ...q.daily, claimed: [goal.id] };
    expect(only(q, "dungeon")).toEqual([]);
  });

  test("menu: a costume the coupons pay for, 아파트 and 기념품 by gems, 사무용품 by coupons", () => {
    const s = calm();
    s.coupons = 40;
    expect(on(s)).toEqual(["suits"]);
    s.coupons = 200;
    expect(on(s)).toEqual(["suits", "office"]);
    s.coupons = 0;
    s.gems = 10;
    expect(on(s)).toEqual(["apartment"]);
    s.bestFloor = 1000;
    s.run = { ...s.run, maxFloor: 1000 };
    s.gems = 100;
    expect(on(s)).toContain("relics");
  });

  test("every dot belongs to a screen that clears it", () => {
    expect(Object.keys(alertScreens).sort()).toEqual([...ALERT_KEYS].sort());
  });
});
