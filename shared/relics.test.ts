import { describe, expect, test } from "vitest";
import { RELICS, relicLevelCost, relicsUnlocked } from "./data/relics";
import { mods } from "./mods";
import { newState } from "./state";

const at = (bestFloor: number, floor = 1) => {
  const s = newState(0);
  s.bestFloor = bestFloor;
  s.run = { ...s.run, floor, maxFloor: floor };
  return s;
};

describe("relics", () => {
  test("8 relics from floor 1000 to 9000 (no 7000: mining comes with stocks)", () => {
    expect(RELICS.map((r) => r.unlockFloor)).toEqual([1000, 2000, 3000, 4000, 5000, 6000, 8000, 9000]);
    expect(relicsUnlocked(2500).map((r) => r.id)).toEqual(["r_badge", "r_plaque"]);
    expect(relicLevelCost(3)).toBeGreaterThan(relicLevelCost(2));
  });

  test("금배지: +250% damage per level, only at floor 3000 or below", () => {
    const low = mods(at(1000, 500)).dmgMult;
    const high = mods(at(1000, 3500)).dmgMult;
    const none = mods(at(999, 500)).dmgMult;
    expect(low / none).toBeCloseTo(3.5, 9);
    expect(high).toBeCloseTo(none, 9);
  });

  // Level 2 against level 1 on the same floor, so pet awakening (also every 2000 floors) cancels out.
  const levelled = (bestFloor: number, floor: number, id: string) => {
    const s = at(bestFloor, floor);
    s.relics[id] = 2;
    return s;
  };

  test("공로패 gold, 손목시계 attack speed, 명함 뭉치 clone", () => {
    expect(mods(levelled(2000, 1, "r_plaque")).goldMult / mods(at(2000)).goldMult).toBeCloseTo(2 / 1.5, 9);
    expect(mods(levelled(3000, 1, "r_watch")).aspdMult / mods(at(3000)).aspdMult).toBeCloseTo(1.1 / 1.05, 9);
    expect(mods(levelled(4000, 3500, "r_cards")).dmgMult / mods(at(4000, 3500)).dmgMult).toBeCloseTo(1.8 / 1.4, 9);
  });

  test("파스 strengthens tier-3 certificates", () => {
    const atk3 = "atk3";
    const s = at(8000, 3500);
    s.certs = { [atk3]: 1 };
    const t = at(7999, 3500);
    t.certs = { [atk3]: 1 };
    const base = at(8000, 3500);
    const gainWith = mods(s).dmgMult / mods(base).dmgMult;
    const baseT = at(7999, 3500);
    const gainWithout = mods(t).dmgMult / mods(baseT).dmgMult;
    expect(gainWith).toBeGreaterThan(gainWithout + 1e-9);
  });
});
