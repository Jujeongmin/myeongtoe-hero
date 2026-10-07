import { describe, expect, test } from "vitest";
import { apartmentCost, apartmentDamage, officeUpgradeCost } from "./data/home";
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

describe("office", () => {
  test("grade 1 → 2 costs 200 coupons", () => {
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
