import { describe, expect, test } from "vitest";
import { applyIntent, RuleError, type Intent } from "./actions";
import { AD_PLACEMENTS, adReadyAt, findAd } from "./data/ads";
import { PARK_PASS_MAX } from "./data/parking";
import { newState, toSave, type GameState } from "./state";
import { killGoldNow } from "./stats";
import { syncSave } from "./sync";

const T0 = 1_000_000_000_000;
const MIN = 60_000;

function at(ms: number, base?: GameState): GameState {
  const s = base ? { ...base } : newState(T0);
  s.lastTick = ms;
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

describe("rewarded ads", () => {
  test("seven placements with cooldowns, no daily limit", () => {
    expect(AD_PLACEMENTS.map((a) => [a.id, a.cooldownMs / MIN])).toEqual([
      ["ad_speed", 30], ["ad_gems", 15], ["ad_gold", 15], ["ad_buff", 30], ["ad_coupons", 60], ["ad_parking", 120], ["ad_offline", 0],
    ]);
  });

  test("a placement waits out its cooldown, then can be watched again (and again)", () => {
    let s = applyIntent(at(T0), { k: "watchAd", id: "ad_coupons" });
    expect(s.coupons).toBe(20);
    expect(codeOf(at(T0 + 59 * MIN, s), { k: "watchAd", id: "ad_coupons" })).toBe("cooldown");
    s = applyIntent(at(T0 + 60 * MIN, s), { k: "watchAd", id: "ad_coupons" });
    s = applyIntent(at(T0 + 120 * MIN, s), { k: "watchAd", id: "ad_coupons" });
    expect(s.coupons).toBe(60);
  });

  test("월급 통장 halves the cooldowns", () => {
    const s = at(T0);
    s.vx = { ...s.vx, passUntil: T0 + 24 * 60 * MIN };
    const after = applyIntent(s, { k: "watchAd", id: "ad_gems" });
    expect(adReadyAt(after, findAd("ad_gems")!)).toBe(T0 + 7.5 * MIN);
  });

  test("gems 5 to 20 by the save's seed, the same on client and server", () => {
    const s = at(T0);
    const a = applyIntent(s, { k: "watchAd", id: "ad_gems" });
    const b = applyIntent(s, { k: "watchAd", id: "ad_gems" });
    expect(a.gems).toBe(b.gems);
    expect(a.gems).toBeGreaterThanOrEqual(5);
    expect(a.gems).toBeLessThanOrEqual(20);
    expect(a.rngSeed).not.toBe(s.rngSeed);
  });

  test("gold is 50 kills of the current floor; a buff is one of three for 3 minutes", () => {
    const s = at(T0);
    s.run = { ...s.run, floor: 30, maxFloor: 30 };
    const gold = applyIntent(s, { k: "watchAd", id: "ad_gold" });
    expect(gold.gold.div(killGoldNow(s)).toNumber()).toBeCloseTo(50);
    const buff = applyIntent(s, { k: "watchAd", id: "ad_buff" });
    expect(Object.values(buff.buffs).filter((t) => t === T0 + 3 * MIN)).toHaveLength(1);
  });

  test("a parking pass, but not past a full stack", () => {
    const s = at(T0);
    s.parking = { ...s.parking, passes: 3 };
    expect(applyIntent(s, { k: "watchAd", id: "ad_parking" }).parking.passes).toBe(4);
    s.parking = { ...s.parking, passes: PARK_PASS_MAX };
    expect(codeOf(s, { k: "watchAd", id: "ad_parking" })).toBe("max");
  });

  test("the welcome-back reward once more, for 10 minutes after the popup", () => {
    const start = newState(T0);
    start.gear = { tier: 3, level: 5, confirmed: 0 };
    const back = syncSave(toSave(start), [], T0 + 60 * MIN);
    expect(back.offline).not.toBeNull();
    const synced = syncSave(back.save, [{ k: "watchAd", id: "ad_offline" }], T0 + 61 * MIN);
    expect(synced.rejected).toEqual([]);
    expect(synced.save.offlineBonus).toBeNull();
    const late = at(T0 + 71 * MIN, newState(T0));
    late.offlineBonus = { gold: "1e3", tickets: 0, until: T0 + 70 * MIN };
    expect(codeOf(late, { k: "watchAd", id: "ad_offline" })).toBe("not_done");
    expect(codeOf(at(T0), { k: "watchAd", id: "ad_offline" })).toBe("not_done");
  });
});
