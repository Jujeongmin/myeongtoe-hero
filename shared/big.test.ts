import { describe, expect, test } from "vitest";
import { Big } from "./big";

describe("Big", () => {
  test("normalizes to 1 ≤ m < 10", () => {
    const b = Big.of(1234);
    expect(b.m).toBeCloseTo(1.234, 12);
    expect(b.e).toBe(3);
    expect(Big.of(0.05).e).toBe(-2);
    expect(Big.of(0).isZero()).toBe(true);
  });

  test("rejects negative and non-finite input", () => {
    expect(() => Big.of(-1)).toThrow(RangeError);
    expect(() => Big.of(Number.NaN)).toThrow(RangeError);
    expect(() => Big.of(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  test("adds and subtracts", () => {
    expect(Big.of(1000).add(Big.of(234)).toNumber()).toBeCloseTo(1234, 9);
    expect(Big.of(1234).sub(Big.of(234)).toNumber()).toBeCloseTo(1000, 9);
    expect(Big.ZERO.add(Big.of(5)).toNumber()).toBe(5);
    // A far smaller addend vanishes rather than corrupting the mantissa.
    expect(Big.of(1, 40).add(Big.of(1)).e).toBe(40);
  });

  test("never goes below zero", () => {
    expect(() => Big.of(1).sub(Big.of(2))).toThrow(RangeError);
    expect(Big.of(5).sub(Big.of(5)).toNumber()).toBeCloseTo(0, 12);
  });

  test("multiplies, divides and raises", () => {
    expect(Big.of(2, 100).mul(Big.of(3, 50)).log10()).toBeCloseTo(Math.log10(6) + 150, 12);
    expect(Big.of(6, 10).div(Big.of(2, 4)).toNumber()).toBeCloseTo(3e6, 3);
    expect(Big.of(7).mulN(3).toNumber()).toBeCloseTo(21, 12);
    expect(Big.pow(2, 10).toNumber()).toBeCloseTo(1024, 6);
    expect(Big.pow(1.16, 4999).e).toBe(Math.floor(4999 * Math.log10(1.16)));
    expect(() => Big.of(1).div(Big.ZERO)).toThrow(RangeError);
  });

  test("compares", () => {
    expect(Big.of(1, 10).cmp(Big.of(9, 9))).toBe(1);
    expect(Big.of(9, 9).cmp(Big.of(1, 10))).toBe(-1);
    expect(Big.of(5).cmp(Big.of(5))).toBe(0);
    expect(Big.ZERO.cmp(Big.of(1, -5))).toBe(-1);
    expect(Big.of(3).gte(Big.of(3))).toBe(true);
    expect(Big.of(2).lt(Big.of(3))).toBe(true);
  });

  test("round-trips through its string form", () => {
    const b = Big.of(1.5, 400);
    expect(Big.from(b.toString()).cmp(b)).toBe(0);
    expect(JSON.stringify({ g: b })).toBe(`{"g":"${b.toString()}"}`);
    expect(Big.from("0e0").isZero()).toBe(true);
    expect(Big.from(42).toNumber()).toBeCloseTo(42, 12);
    expect(() => Big.from("abc")).toThrow(RangeError);
  });
});
