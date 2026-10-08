import { describe, expect, test } from "vitest";
import { AURAS, LEGENDS, SUIT_ITEMS, legendValue } from "./data/costumes";
import { mods } from "./mods";
import { newState } from "./state";
import { heroPower } from "./stats";

describe("costumes", () => {
  test("6 sets × 6 slots, each with its own effect", () => {
    expect(SUIT_ITEMS).toHaveLength(36);
    expect(new Set(SUIT_ITEMS.map((i) => i.id)).size).toBe(36);
    expect([...new Set(SUIT_ITEMS.map((i) => i.part))]).toEqual(["helmet", "armor", "cape", "gloves", "boots", "accessory"]);
    expect(AURAS).toHaveLength(6);
    expect(LEGENDS).toHaveLength(5);
  });

  test("owned costumes work without being worn; effects multiply", () => {
    const s = newState(0);
    const base = mods(s).dmgMult;
    const dmg = SUIT_ITEMS.filter((i) => i.effect.k === "dmg");
    s.suits = dmg.map((i) => i.id);
    s.wear = {};
    const want = dmg.reduce((m, i) => m * (1 + i.effect.v), 1);
    expect(mods(s).dmgMult / base).toBeCloseTo(want, 6);
  });

  test("boots make walking faster, and a 전설 set of one adds kill gold", () => {
    const s = newState(0);
    const walk = heroPower(s).walkSec;
    const boots = SUIT_ITEMS.find((i) => i.effect.k === "move")!;
    s.suits = [boots.id];
    expect(heroPower(s).walkSec).toBeCloseTo(walk / (1 + boots.effect.v), 9);
    const gold = mods(s).goldMult;
    s.costume.legend = { helmet: 1 };
    expect(mods(s).goldMult / gold).toBeCloseTo(6, 9);
  });

  test("전설 values grow by their growth each level", () => {
    expect(legendValue(LEGENDS[0], 0)).toBe(0);
    expect(legendValue(LEGENDS[0], 1)).toBe(5);
    expect(legendValue(LEGENDS[0], 3)).toBe(125);
  });
});
