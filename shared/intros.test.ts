import { describe, expect, test } from "vitest";
import { featureIntroToShow } from "./data/intros";
import { ROOKIE_OFFER_STEP } from "./data/shop";
import { newState, type GameState } from "./state";

const past = (): GameState => {
  const s = newState(0);
  s.missions.step = ROOKIE_OFFER_STEP;
  return s;
};

describe("new feature intros", () => {
  test("none during the guided first steps, even when one could be used", () => {
    const s = newState(0);
    s.gems = 1000;
    expect(featureIntroToShow(s, [])).toBeUndefined();
  });

  test("each when it can first be used, once", () => {
    const s = past();
    expect(featureIntroToShow(s, [])).toBeUndefined();
    s.gems = 10;
    expect(featureIntroToShow(s, [])).toBe("apartment");
    expect(featureIntroToShow(s, ["apartment"])).toBeUndefined();
    s.coupons = 200;
    expect(featureIntroToShow(s, ["apartment"])).toBe("office");
    s.bestFloor = 1000;
    expect(featureIntroToShow(s, ["apartment", "office"])).toBe("relics");
    expect(featureIntroToShow(s, ["apartment", "office", "relics"])).toBeUndefined();
  });

  test("not for one already in use", () => {
    const s = past();
    s.gems = 1000;
    s.coupons = 1000;
    s.bestFloor = 1000;
    s.apartment = 3;
    s.office = { ...s.office, chair: 2 };
    s.relics = { r_badge: 2 };
    expect(featureIntroToShow(s, [])).toBeUndefined();
  });
});
