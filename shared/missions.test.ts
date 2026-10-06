import { describe, expect, test } from "vitest";
import { applyIntent, RuleError, type Intent } from "./actions";
import { ATTENDANCE_REWARDS, SPECIAL_MISSIONS, STEP_MISSIONS } from "./data/missions";
import { newState, type GameState } from "./state";
import { kstDay } from "./time";

const NOW = Date.UTC(2026, 9, 7, 3, 0);

function code(s: GameState, intent: Intent): string {
  try {
    applyIntent(s, intent);
    return "";
  } catch (error) {
    if (error instanceof RuleError) return error.code;
    throw error;
  }
}

describe("step missions (the original's guided missions)", () => {
  test("20 steps, done one at a time, in order", () => {
    expect(STEP_MISSIONS).toHaveLength(20);
    const s = newState(NOW);
    expect(code(s, { k: "claimStep" })).toBe("not_done");
    s.sideJobs.j00 = { level: 1, progressSec: 0, running: true };
    const after = applyIntent(s, { k: "claimStep" });
    expect(after.missions.step).toBe(1);
    expect(after.gems).toBe(STEP_MISSIONS[0].reward.gems ?? 0);
    expect(code(after, { k: "claimStep" })).toBe("not_done");
  });

  test("past the last step there is nothing more", () => {
    const s = newState(NOW);
    s.missions = { step: STEP_MISSIONS.length, special: [] };
    expect(code(s, { k: "claimStep" })).toBe("max");
  });
});

describe("special missions (the original's 특수 임무)", () => {
  test("pay once each when reached", () => {
    const m = SPECIAL_MISSIONS.find((x) => x.id === "f500")!;
    const s = newState(NOW);
    expect(code(s, { k: "claimSpecial", id: "f500" })).toBe("not_done");
    s.bestFloor = 500;
    const after = applyIntent(s, { k: "claimSpecial", id: "f500" });
    expect(after.gems).toBe(m.reward.gems);
    expect(after.missions.special).toEqual(["f500"]);
    expect(code(after, { k: "claimSpecial", id: "f500" })).toBe("claimed");
    expect(code(s, { k: "claimSpecial", id: "nope" })).toBe("unknown");
  });
});

describe("attendance", () => {
  test("once a KST day, through a 7-day cycle", () => {
    expect(ATTENDANCE_REWARDS).toHaveLength(7);
    const s = newState(NOW);
    const day1 = applyIntent(s, { k: "claimAttendance" });
    expect(day1.attendance).toEqual({ lastDay: kstDay(NOW), count: 1 });
    expect(code(day1, { k: "claimAttendance" })).toBe("claimed");
    const next = { ...day1, lastTick: NOW + 24 * 3600_000 };
    expect(applyIntent(next, { k: "claimAttendance" }).attendance.count).toBe(2);
    const eighth = { ...newState(NOW), attendance: { lastDay: "2000-01-01", count: 7 } };
    const r = applyIntent(eighth, { k: "claimAttendance" });
    expect(r.gems).toBe(ATTENDANCE_REWARDS[0].gems ?? 0);
  });
});
