import { describe, expect, test } from "vitest";
import { applyIntent, readIntent, RuleError, type Intent } from "./actions";
import { DAILY_QUESTS, dailyQuestReward } from "./data/dailyQuests";
import { newState, type GameState } from "./state";
import { kstDay } from "./time";

const WEDNESDAY = Date.UTC(2026, 9, 7, 3, 0);
const SATURDAY = Date.UTC(2026, 9, 10, 3, 0);

function at(now: number, entries: number, bestDepth: number, claimed: string[] = []): GameState {
  const s = newState(now);
  s.daily = { day: kstDay(now), entries, bestDepth, claimed };
  return s;
}

function code(s: GameState, intent: Intent): string {
  try {
    applyIntent(s, intent);
    return "";
  } catch (error) {
    if (error instanceof RuleError) return error.code;
    throw error;
  }
}

describe("daily parking quests", () => {
  test("worth 315 coupons a day in all, like the original's 315 coins", () => {
    expect(DAILY_QUESTS.reduce((sum, q) => sum + q.coupons, 0)).toBe(315);
    expect(new Set(DAILY_QUESTS.map((q) => q.id)).size).toBe(DAILY_QUESTS.length);
    expect(readIntent({ k: "claimDaily", id: "e1" })).toEqual({ k: "claimDaily", id: "e1" });
  });

  test("pay once when reached", () => {
    const q = DAILY_QUESTS.find((x) => x.kind === "entries")!;
    expect(code(at(WEDNESDAY, q.goal - 1, 0), { k: "claimDaily", id: q.id })).toBe("not_done");
    const after = applyIntent(at(WEDNESDAY, q.goal, 0), { k: "claimDaily", id: q.id });
    expect(after.coupons).toBe(q.coupons);
    expect(after.daily.claimed).toEqual([q.id]);
    expect(code(after, { k: "claimDaily", id: q.id })).toBe("claimed");
    expect(code(after, { k: "claimDaily", id: "nope" })).toBe("unknown");
  });

  test("depth quests count today's best run", () => {
    const q = DAILY_QUESTS.find((x) => x.kind === "depth")!;
    expect(code(at(WEDNESDAY, 1, q.goal - 1), { k: "claimDaily", id: q.id })).toBe("not_done");
    expect(applyIntent(at(WEDNESDAY, 1, q.goal), { k: "claimDaily", id: q.id }).coupons).toBe(q.coupons);
  });

  test("double on Saturdays (KST)", () => {
    const q = DAILY_QUESTS[0];
    expect(dailyQuestReward(q, SATURDAY)).toBe(q.coupons * 2);
    expect(applyIntent(at(SATURDAY, 99, 9999), { k: "claimDaily", id: q.id }).coupons).toBe(q.coupons * 2);
  });

  test("yesterday's claims do not carry over", () => {
    const s = at(WEDNESDAY, 0, 0);
    s.daily = { day: "2026-10-06", entries: 99, bestDepth: 9999, claimed: [DAILY_QUESTS[0].id] };
    expect(code(s, { k: "claimDaily", id: DAILY_QUESTS[0].id })).toBe("not_done");
  });
});
