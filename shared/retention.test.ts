import { describe, expect, test } from "vitest";
import { addDays, isAdmin, retentionDays, retentionTable, visitOf } from "./retention";

// 2026-10-15 12:00 KST
const DAY2 = Date.UTC(2026, 9, 15, 3);

describe("retention", () => {
  test("the admin account, in any letter case; nobody else", () => {
    expect(isAdmin("0x7b47Aa40357441418909f83728Da906b7C85d261")).toBe(true);
    expect(isAdmin("0x7b47aa40357441418909f83728da906b7c85d261")).toBe(true);
    expect(isAdmin("0x0000000000000000000000000000000000000000")).toBe(false);
  });

  test("days count across months", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-10-14", -1)).toBe("2026-10-13");
  });

  test("a new player's first visit starts their cohort; later visits carry it", () => {
    const a = visitOf("p", undefined, true, DAY2)!;
    expect(a.visit).toEqual({ account: "p", day: "2026-10-15", first: "2026-10-15" });
    expect(visitOf("p", a.seen, false, DAY2)).toBeNull(); // once a day
    const next = visitOf("p", a.seen, false, DAY2 + 86_400_000)!;
    expect(next.visit).toEqual({ account: "p", day: "2026-10-16", first: "2026-10-15" });
  });

  test("someone who played before the tracking began is active but in no cohort", () => {
    expect(visitOf("old", undefined, false, DAY2)!.visit.first).toBeNull();
  });

  test("nothing is written before the start day", () => {
    expect(visitOf("p", undefined, true, Date.UTC(2026, 9, 13, 3))).toBeNull();
  });

  test("the table runs from the start day to today; a return not due yet shows as -", () => {
    expect(retentionDays(DAY2)).toEqual(["2026-10-14", "2026-10-15"]);
    expect(retentionTable([{ day: "2026-10-14", newUsers: 20, active: 31, back: [9, null, null, null, null] }])).toEqual([
      { 날짜: "2026-10-14", 신규: 20, 접속: 31, D1: "45% (9)", D3: "-", D7: "-", D14: "-", D30: "-" },
    ]);
  });
});
