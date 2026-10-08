import { describe, expect, test } from "vitest";
import {
  CERTS, CERT_GRADES, CERT_MAX_LEVEL, certEffects, certLevelCost, certOpen, certValue, findCert, prestigeCertBonus,
} from "./data/certs";
import { newState } from "./state";
import { heroPower } from "./stats";

const cert = (id: string) => findCert(id)!;

describe("certificate table", () => {
  test("5 lines × 5 grades, 4 basic, 3 career; unique ids", () => {
    expect(CERTS.filter((c) => c.group === "main")).toHaveLength(25);
    expect(CERTS.filter((c) => c.group === "basic")).toHaveLength(4);
    expect(CERTS.filter((c) => c.group === "career")).toHaveLength(3);
    expect(new Set(CERTS.map((c) => c.id)).size).toBe(CERTS.length);
    expect(cert("atk1").name).toBe("타격" + CERT_GRADES[0]);
    expect(cert("grit5").name).toBe("근성기술사");
  });

  test("caps: 99999 for the lines (근성기능사 200), small ones for the basics", () => {
    expect(cert("atk3").maxLevel).toBe(CERT_MAX_LEVEL);
    expect(cert("grit1").maxLevel).toBe(200);
    expect([cert("b_crit"), cert("b_aspd"), cert("b_cost"), cert("b_side")].map((c) => c.maxLevel)).toEqual([45, 10, 40, 10]);
    expect(cert("c_coach").maxLevel).toBe(50);
  });

  test("a grade opens once the grade below is maxed", () => {
    expect(certOpen(cert("atk1"), {})).toBe(true);
    expect(certOpen(cert("atk2"), { atk1: CERT_MAX_LEVEL - 1 })).toBe(false);
    expect(certOpen(cert("atk2"), { atk1: CERT_MAX_LEVEL })).toBe(true);
    expect(certOpen(cert("grit2"), { grit1: 200 })).toBe(true);
    expect(certOpen(cert("b_crit"), {})).toBe(true);
  });
});

describe("certificate costs", () => {
  test("linear lines: base + step × level", () => {
    expect([0, 1, 2].map((l) => certLevelCost(cert("atk1"), l))).toEqual([10, 15, 20]);
    expect([0, 1].map((l) => certLevelCost(cert("gold1"), l))).toEqual([20, 30]);
    expect([0, 1].map((l) => certLevelCost(cert("atk2"), l))).toEqual([1e6, 1e6 + 1e4]);
    expect(certLevelCost(cert("b_aspd"), 3)).toBe(300 + 450);
  });

  test("근성기능사: 5 million, then 5% more a level", () => {
    expect(certLevelCost(cert("grit1"), 0)).toBe(5_000_000);
    expect(certLevelCost(cert("grit1"), 1)).toBe(5_250_000);
    expect(certLevelCost(cert("grit1"), 2)).toBe(5_512_500);
  });

  test("gem ones: 커리어코치 200 a level more, the other two capped at 2500", () => {
    expect([0, 1, 2].map((l) => certLevelCost(cert("c_coach"), l))).toEqual([200, 400, 600]);
    expect([0, 1, 8, 20].map((l) => certLevelCost(cert("c_resume"), l))).toEqual([500, 750, 2500, 2500]);
  });
});

describe("certificate effects", () => {
  test("타격기능사: 15% a level, 30% from level 26, 45% from 51", () => {
    expect(certValue(cert("atk1"), 1)).toBe(15);
    expect(certValue(cert("atk1"), 25)).toBe(375);
    expect(certValue(cert("atk1"), 26)).toBe(405);
    expect(certValue(cert("atk1"), 51)).toBe(375 + 750 + 45);
  });

  test("투잡관리기능사: 10% a level, 5 more every 50 levels", () => {
    expect(certValue(cert("side1"), 50)).toBe(500);
    expect(certValue(cert("side1"), 51)).toBe(515);
  });

  test("근성기능사: 1% a level, doubling every 10, quadrupling past 150", () => {
    expect(certValue(cert("grit1"), 10)).toBe(10);
    expect(certValue(cert("grit1"), 11)).toBe(12);
    expect(certValue(cert("grit1"), 21)).toBe(34);
    expect(certValue(cert("grit1"), 200)).toBe(223_805_430);
  });

  test("maxed totals", () => {
    expect(certValue(cert("atk1"), CERT_MAX_LEVEL)).toBe(3_000_690_000);
    expect(certValue(cert("crit2"), CERT_MAX_LEVEL)).toBeCloseTo(1_000_480, 0);
    expect(certValue(cert("atk4"), CERT_MAX_LEVEL)).toBeCloseTo(788_937_830_000, -3);
  });

  test("grades multiply; 급소공략기능사 adds to the crit bonus", () => {
    const e = certEffects({ atk1: 1, grit1: 10, crit1: 2, b_crit: 5, b_cost: 10, b_side: 2, side1: 1 });
    expect(e.dmgMult).toBeCloseTo(1.15 * 1.1);
    expect(e.critDmgAdd).toBeCloseTo(0.5);
    expect(e.critChanceAdd).toBeCloseTo(0.05);
    expect(e.costMult).toBeCloseTo(0.8);
    expect(e.sideJobMult).toBeCloseTo(1.2 * 1.1);
  });

  test("워드프로세서 takes 0.04 s a level off the 0.5 s attack", () => {
    expect(certEffects({ b_aspd: 10 }).aspdMult).toBeCloseTo(5);
    expect(certEffects({ b_aspd: 5 }).aspdMult).toBeCloseTo(0.5 / 0.3);
  });

  test("파스 strengthens the 기사 grade only", () => {
    expect(certEffects({ atk3: 100 }, 2).dmgMult - 1).toBeCloseTo((certEffects({ atk3: 100 }).dmgMult - 1) * 2);
    expect(certEffects({ atk1: 100 }, 2).dmgMult).toBe(certEffects({ atk1: 100 }).dmgMult);
  });

  test("they reach Park's power", () => {
    const s = newState(0);
    const before = heroPower(s).dps;
    s.certs = { atk1: 10 };
    expect(heroPower(s).dps.div(before).toNumber()).toBeCloseTo(1 + 1.5);
    s.certs = { b_crit: 45, crit1: 4 };
    // crit chance 5% → 50%, crit bonus 50% → 150%.
    expect(heroPower(s).dps.div(before).toNumber()).toBeCloseTo((1 + 0.5 * 1.5) / (1 + 0.05 * 0.5));
  });
});

describe("연봉협상 certificate bonus", () => {
  test("the highest-grade 타격 and 수금 held go up 2 levels, capped at their max", () => {
    const next = prestigeCertBonus({ atk1: 10, atk2: 3, gold1: 49, crit1: 5 });
    expect(next.atk1).toBe(10);
    expect(next.atk2).toBe(5);
    expect(next.gold1).toBe(Math.min(findCert("gold1")!.maxLevel, 51));
    expect(next.crit1).toBe(5);
    expect(prestigeCertBonus({})).toEqual({});
  });
});
