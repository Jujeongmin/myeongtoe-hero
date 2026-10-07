import { describe, expect, test } from "vitest";
import { applyIntent, readIntent, RuleError, type Intent } from "./actions";
import { GEM_ITEMS } from "./data/gemShop";
import { newState, type GameState } from "./state";
import { heroAtk, killGoldNow } from "./stats";

const T0 = 1_000_000_000_000;
const MIN = 60_000;

function withGems(gems: number): GameState {
  const s = newState(T0);
  s.gems = gems;
  s.run = { ...s.run, floor: 20, maxFloor: 20 };
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

describe("gem shop", () => {
  test("three items with their prices (buffs come from ads, not gems)", () => {
    expect(GEM_ITEMS.map((i) => [i.id, i.gems])).toEqual([["gold_100", 100], ["gold_1000", 500]]);
    expect(readIntent({ k: "buyGemItem", id: "gold_100" })).toEqual({ k: "buyGemItem", id: "gold_100" });
    expect(readIntent({ k: "buyGemItem" })).toBeNull();
  });

  test("gold charges pay N kills of the current floor", () => {
    const s = withGems(1000);
    const after = applyIntent(s, { k: "buyGemItem", id: "gold_100" });
    expect(after.gold.sub(s.gold).div(killGoldNow(s)).toNumber()).toBeCloseTo(100);
    const big = applyIntent(s, { k: "buyGemItem", id: "gold_1000" });
    expect(big.gems).toBe(500);
    expect(big.gold.sub(s.gold).div(killGoldNow(s)).toNumber()).toBeCloseTo(1000);
  });
  test("not enough gems, unknown items", () => {
    expect(codeOf(withGems(99), { k: "buyGemItem", id: "gold_100" })).toBe("not_enough_gems");
    expect(codeOf(withGems(999), { k: "buyGemItem", id: "nope" })).toBe("unknown");
  });
});
