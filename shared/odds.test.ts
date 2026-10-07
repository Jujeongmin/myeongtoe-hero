import { describe, expect, test } from "vitest";
import { AD_GEMS_MAX, AD_GEMS_MIN, findAd } from "./data/ads";
import { petBoxChance } from "./data/pets";

// 확률 공개: the odds shown in the game match the rules.
describe("published odds", () => {
  test("the 동료 상자 gives each joined colleague an equal share", () => {
    expect(petBoxChance(1)).toBe(100);
    expect(petBoxChance(3)).toBe(33.33);
    expect(petBoxChance(7)).toBe(14.29);
    expect(petBoxChance(0)).toBe(0);
  });

  test("the gem ad's text states each amount's chance", () => {
    const each = 100 / (AD_GEMS_MAX - AD_GEMS_MIN + 1);
    expect(findAd("ad_gems")?.text).toContain(`${each}%`);
  });
});
