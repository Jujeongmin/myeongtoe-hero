import { describe, expect, test } from "vitest";
import { GRANT_MAX, applyGrant, readGrant } from "./grant";
import { newState } from "./state";

describe("운영자 지급", () => {
  test("gems, coupons and tickets as whole numbers up to the cap; anything else refused", () => {
    expect(readGrant({ gems: 1000, coupons: 200 })).toEqual({ gems: 1000, coupons: 200, tickets: 0 });
    expect(readGrant({ tickets: 5 })).toEqual({ gems: 0, coupons: 0, tickets: 5 });
    for (const bad of [null, "gems", {}, { gems: 0 }, { gems: -1 }, { gems: 1.5 }, { gems: GRANT_MAX + 1 }, { gems: "10" }]) {
      expect(readGrant(bad), JSON.stringify(bad)).toBeNull();
    }
  });

  test("adds to what the player has", () => {
    const s = { ...newState(0), gems: 5, coupons: 1, tickets: 2 };
    const g = applyGrant(s, { gems: 100, coupons: 50, tickets: 0 });
    expect([g.gems, g.coupons, g.tickets]).toEqual([105, 51, 2]);
  });
});
