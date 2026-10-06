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
  test("six items with their prices", () => {
    expect(GEM_ITEMS.map((i) => [i.id, i.gems])).toEqual([
      ["buff_atk", 100], ["buff_gold", 100], ["buff_move", 250], ["gold_100", 100], ["gold_1000", 500], ["gear_boost", 20],
    ]);
    expect(readIntent({ k: "buyGemItem", id: "buff_atk" })).toEqual({ k: "buyGemItem", id: "buff_atk" });
    expect(readIntent({ k: "buyGemItem" })).toBeNull();
  });

  test("a buff runs 30 minutes, and buying again adds on", () => {
    const once = applyIntent(withGems(1000), { k: "buyGemItem", id: "buff_atk" });
    expect(once.buffs.atk).toBe(T0 + 30 * MIN);
    expect(once.gems).toBe(900);
    const twice = applyIntent(once, { k: "buyGemItem", id: "buff_atk" });
    expect(twice.buffs.atk).toBe(T0 + 60 * MIN);
  });

  test("gold charges pay N kills of the current floor", () => {
    const s = withGems(1000);
    const after = applyIntent(s, { k: "buyGemItem", id: "gold_100" });
    expect(after.gold.sub(s.gold).div(killGoldNow(s)).toNumber()).toBeCloseTo(100);
    const big = applyIntent(s, { k: "buyGemItem", id: "gold_1000" });
    expect(big.gems).toBe(500);
    expect(big.gold.div(killGoldNow(s)).toNumber()).toBeCloseTo(1000);
  });

  test("the gear boost stacks and is gone after a job change", () => {
    let s = withGems(100);
    const base = heroAtk(s);
    s = applyIntent(s, { k: "buyGemItem", id: "gear_boost" });
    s = applyIntent(s, { k: "buyGemItem", id: "gear_boost" });
    expect(s.run.gearBoost).toBe(2);
    expect(heroAtk(s).cmp(base)).toBe(1);
    s.run = { ...s.run, maxFloor: 100 };
    expect(applyIntent(s, { k: "prestige", mode: "plain" }).run.gearBoost).toBe(0);
  });

  test("not enough gems, unknown items", () => {
    expect(codeOf(withGems(99), { k: "buyGemItem", id: "buff_gold" })).toBe("not_enough_gems");
    expect(codeOf(withGems(999), { k: "buyGemItem", id: "nope" })).toBe("unknown");
  });
});
