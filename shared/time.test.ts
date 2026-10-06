import { describe, expect, test } from "vitest";
import { isSaturday, kstDay, kstWeekday } from "./time";

describe("KST days", () => {
  test("a KST day starts at 00:00 KST (15:00 UTC the day before)", () => {
    expect(kstDay(Date.UTC(2026, 9, 6, 14, 59))).toBe("2026-10-06");
    expect(kstDay(Date.UTC(2026, 9, 6, 15, 0))).toBe("2026-10-07");
  });

  test("weekdays in KST", () => {
    // 2026-10-10 is a Saturday.
    expect(kstWeekday(Date.UTC(2026, 9, 10, 3, 0))).toBe(6);
    expect(isSaturday(Date.UTC(2026, 9, 9, 15, 0))).toBe(true);
    expect(isSaturday(Date.UTC(2026, 9, 10, 15, 0))).toBe(false);
  });
});
