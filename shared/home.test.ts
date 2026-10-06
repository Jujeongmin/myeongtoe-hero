import { describe, expect, test } from "vitest";
import { SUIT_ITEMS, apartmentCost, apartmentDamage, officeUpgradeCost, suitSetWorn } from "./data/home";
import { mods } from "./mods";
import { newState } from "./state";

describe("apartment", () => {
  test("damage doubles every 10 pyeong; each pyeong costs more", () => {
    expect(apartmentDamage(9)).toBe(1);
    expect(apartmentDamage(10)).toBe(2);
    expect(apartmentDamage(25)).toBe(4);
    expect(apartmentCost(5)).toBeGreaterThan(apartmentCost(4));
    const s = newState(0);
    s.apartment = 10;
    expect(mods(s).dmgMult / mods(newState(0)).dmgMult).toBeCloseTo(2, 9);
  });
});

describe("suits", () => {
  test("6 sets × 6 parts, dearer by set", () => {
    expect(SUIT_ITEMS).toHaveLength(36);
    expect(new Set(SUIT_ITEMS.map((i) => i.id)).size).toBe(36);
    const p1 = SUIT_ITEMS.find((i) => i.set === 1)!.price;
    const p2 = SUIT_ITEMS.find((i) => i.set === 2)!.price;
    expect(p2).toBe(p1 * 3);
  });

  test("only worn parts count; a fully worn set adds its bonus", () => {
    const set1 = SUIT_ITEMS.filter((i) => i.set === 1);
    const s = newState(0);
    s.suits = set1.map((i) => i.id);
    expect(mods(s).dmgMult).toBeCloseTo(1, 9);
    s.wear = Object.fromEntries(set1.slice(0, 5).map((i) => [i.part, i.id]));
    expect(suitSetWorn(s.wear, 1)).toBe(false);
    expect(mods(s).dmgMult).toBeCloseTo(1 + 0.05 * 5, 9);
    s.wear = Object.fromEntries(set1.map((i) => [i.part, i.id]));
    expect(suitSetWorn(s.wear, 1)).toBe(true);
    expect(mods(s).goldMult).toBeCloseTo(1.2, 9);
  });
});

describe("office", () => {
  test("grade 1 → 2 costs 200 coupons, like the original's 200 coins", () => {
    expect(officeUpgradeCost(1)).toBe(200);
    expect(officeUpgradeCost(2)).toBeGreaterThan(200);
  });

  test("grades raise their stat", () => {
    const s = newState(0);
    s.office = { keyboard: 3, mouse: 1, chair: 1, monitor: 2 };
    expect(mods(s).dmgMult).toBeCloseTo(1.3, 9);
    expect(mods(s).goldMult).toBeCloseTo(1.1, 9);
  });
});
