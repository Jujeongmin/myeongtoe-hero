import { describe, expect, test } from "vitest";
import { applyIntent, readIntent, RuleError, type Intent } from "./actions";
import { OFFER_ADS, PRODUCTS, ROOKIE_OFFER_STEP, findProduct, grantPurchase, offerToShow, productOffered } from "./data/shop";
import { parkPassMax } from "./mods";
import { applyPurchase, readPurchaseEvent } from "./purchase";
import { newState, toSave, type GameState } from "./state";
import { offlineCapSec } from "./stats";
import { vipLevel, vipPerks } from "./vip";

const T0 = 1_000_000_000_000;
const DAY = 24 * 3600_000;

function codeOf(s: GameState, intent: Intent): string {
  try {
    applyIntent(s, intent);
    return "";
  } catch (error) {
    return error instanceof RuleError ? error.code : "throw";
  }
}

describe("VX products", () => {
  test("the table: 6 gem packs, rookie, premium, salary pass, 4 promotion packs", () => {
    expect(PRODUCTS.map((p) => p.id)).toEqual([
      "gems_xs", "gems_s", "gems_m", "gems_l", "gems_xl", "gems_xxl",
      "pack_rookie", "premium", "pass_salary",
      "pack_promo_100", "pack_promo_300", "pack_promo_500", "pack_promo_1000",
    ]);
    expect(PRODUCTS.map((p) => p.vx).slice(0, 6)).toEqual([100, 500, 1000, 3000, 5000, 10000]);
    expect(PRODUCTS.every((p) => p.nameKo && p.nameEn && p.textKo && p.textEn)).toBe(true);
  });

  test("gem packs pay gems and count toward VIP", () => {
    const s = grantPurchase(newState(T0), "gems_xl", 2, T0);
    expect(s.gems).toBe(16_000);
    expect(s.vx.total).toBe(10_000);
    expect(vipLevel(s.vx.total)).toBe(6);
  });

  test("the rookie pack: within 7 days, once, currencies only", () => {
    const s = newState(T0);
    expect(productOffered(s, findProduct("pack_rookie")!)).toBe(true);
    expect(productOffered(s, findProduct("pack_rookie")!, T0 + 8 * DAY)).toBe(false);
    const after = grantPurchase(s, "pack_rookie", 1, T0);
    expect([after.gems, after.tickets, after.coupons]).toEqual([1000, 5000, 300]);
    expect(after.buffs).toEqual(s.buffs);
    expect(productOffered(after, findProduct("pack_rookie")!)).toBe(false);
  });

  test("premium: offline +4 hours and daily gems; the salary pass runs 30 days and stacks", () => {
    let s = grantPurchase(newState(T0), "premium", 1, T0);
    expect(offlineCapSec(s) - offlineCapSec(newState(T0))).toBe(4 * 3600 + 3600);
    s = grantPurchase(s, "pass_salary", 1, T0);
    expect(s.vx.passUntil).toBe(T0 + 30 * DAY);
    s = grantPurchase(s, "pass_salary", 1, T0 + DAY);
    expect(s.vx.passUntil).toBe(T0 + 60 * DAY);
  });

  test("promotion packs open at their floor and are offered once", () => {
    const s = newState(T0);
    const p = findProduct("pack_promo_300")!;
    expect(productOffered(s, p)).toBe(false);
    s.bestFloor = 300;
    expect(productOffered(s, p)).toBe(true);
    expect(productOffered(grantPurchase(s, p.id, 1, T0), p)).toBe(false);
  });

  test("daily VX gems: premium 100 + running pass 300, once a KST day", () => {
    expect(codeOf(newState(T0), { k: "claimDailyVx" })).toBe("locked");
    const s = grantPurchase(grantPurchase(newState(T0), "premium", 1, T0), "pass_salary", 1, T0);
    const once = applyIntent(s, { k: "claimDailyVx" });
    expect(once.gems).toBe(s.gems + 400);
    expect(codeOf(once, { k: "claimDailyVx" })).toBe("claimed");
    expect(applyIntent({ ...once, lastTick: T0 + DAY }, { k: "claimDailyVx" }).gems).toBe(once.gems + 400);
    expect(readIntent({ k: "claimDailyVx" })).toEqual({ k: "claimDailyVx" });
  });
});

describe("offer popups", () => {
  const key = (s: GameState, seen: string[] = [], now?: number) => offerToShow(s, seen, now)?.key;

  test("none for a new player still in the guided first steps", () => {
    expect(key(newState(T0))).toBeUndefined();
  });

  test("the rookie pack once the guided steps are over, and again on its last day", () => {
    const s = newState(T0);
    s.missions.step = ROOKIE_OFFER_STEP;
    expect(key(s)).toBe("pack_rookie");
    expect(key(s, ["pack_rookie"])).toBeUndefined();
    expect(key(s, ["pack_rookie"], T0 + 6 * DAY + 1)).toBe("pack_rookie_last");
    expect(key(s, ["pack_rookie", "pack_rookie_last"], T0 + 6 * DAY + 1)).toBeUndefined();
    expect(key(s, [], T0 + 8 * DAY)).toBeUndefined();
    expect(key(grantPurchase(s, "pack_rookie", 1, T0))).toBeUndefined();
  });

  test("a promotion pack when it opens, the highest one first", () => {
    const s = newState(T0);
    s.bestFloor = 320;
    expect(key(s)).toBe("pack_promo_300");
    expect(key(s, ["pack_promo_300"])).toBe("pack_promo_100");
    expect(key(grantPurchase(s, "pack_promo_300", 1, T0), ["pack_promo_100"])).toBeUndefined();
  });

  test("premium on a day with several different ads watched, once that day", () => {
    const s = newState(T0);
    const ids = ["ad_gems", "ad_gold", "ad_coupons", "ad_parking"].slice(0, OFFER_ADS);
    ids.slice(0, -1).forEach((id) => (s.ads[id] = T0));
    expect(key(s)).toBeUndefined();
    s.ads[ids[ids.length - 1]] = T0;
    const k = key(s);
    expect(k).toMatch(/^premium:/);
    expect(key(s, [k!])).toBeUndefined();
    expect(key({ ...s, ads: Object.fromEntries(ids.map((id) => [id, T0 + DAY])) }, [k!], T0 + DAY)).toMatch(/^premium:/);
    expect(key(grantPurchase(s, "premium", 1, T0))).toBeUndefined();
  });
});

describe("VIP", () => {
  test("levels by VX spent", () => {
    expect([0, 99, 100, 500, 999, 50_000, 1e9].map(vipLevel)).toEqual([0, 0, 1, 2, 2, 10, 10]);
  });

  test("perks add up", () => {
    const s = newState(T0);
    s.vx = { ...s.vx, total: 50_000 };
    expect(vipPerks(s)).toEqual({ offlineSec: 4 * 3600, attendanceGemMult: 1.2, parkPassBonus: 2, sideJobMult: 1.4, adBuffMult: 2 });
    expect(parkPassMax(s)).toBe(18);
  });

  test("VIP 2 raises attendance gems by 20%", () => {
    const s = newState(T0);
    s.vx = { ...s.vx, total: 500 };
    expect(applyIntent(s, { k: "claimAttendance" }).gems).toBe(36);
  });
});

describe("purchase events", () => {
  test("read from the platform's payload", () => {
    expect(readPurchaseEvent({ account: "a", purchaseId: 12, productId: "gems_xs", quantity: 1 }))
      .toEqual({ account: "a", purchaseId: "12", productId: "gems_xs", quantity: 1 });
    expect(readPurchaseEvent({ account: "a", purchaseId: "", productId: "gems_xs", quantity: 1 })).toBeNull();
    expect(readPurchaseEvent({ account: "a", purchaseId: "1", productId: "gems_xs", quantity: 0 })).toBeNull();
  });

  test("one receipt pays once", () => {
    const e = { account: "a", purchaseId: "r1", productId: "gems_xs", quantity: 1 };
    const first = applyPurchase(toSave(newState(T0)), [], e, T0);
    expect(first.code).toBe("granted");
    if (first.code !== "granted") return;
    expect(first.save.gems).toBe(120);
    expect(applyPurchase(first.save, first.receipts, e, T0).code).toBe("already_granted");
    expect(applyPurchase(undefined, [], { ...e, productId: "nope" }, T0).code).toBe("unknown_product");
  });
});
