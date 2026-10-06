import { describe, expect, test } from "vitest";
import { Big } from "./big";
import { formatBig, unitName } from "./format";

describe("unitName", () => {
  test("A..Z then AA, AB …", () => {
    expect(unitName(1)).toBe("A");
    expect(unitName(26)).toBe("Z");
    expect(unitName(27)).toBe("AA");
    expect(unitName(52)).toBe("AZ");
    expect(unitName(53)).toBe("BA");
  });
});

describe("formatBig", () => {
  test("plain below a thousand", () => {
    expect(formatBig(Big.ZERO)).toBe("0");
    expect(formatBig(Big.of(7.9))).toBe("7");
    expect(formatBig(Big.of(999))).toBe("999");
  });

  test("three significant digits with a unit, never rounded up", () => {
    expect(formatBig(Big.of(1000))).toBe("1.00A");
    expect(formatBig(Big.of(1239))).toBe("1.23A");
    expect(formatBig(Big.of(12345))).toBe("12.3A");
    expect(formatBig(Big.of(123456))).toBe("123A");
    expect(formatBig(Big.of(9999))).toBe("9.99A");
    expect(formatBig(Big.of(1, 6))).toBe("1.00B");
    expect(formatBig(Big.of(1, 78))).toBe("1.00Z");
    expect(formatBig(Big.of(1, 81))).toBe("1.00AA");
  });
});
