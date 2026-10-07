import { describe, expect, test } from "vitest";
import { BOSS_LINES, PARK_QUIPS, bossKind, pickLine } from "./data/quips";

describe("quips", () => {
  test("a line for any roll, never past the end", () => {
    expect(pickLine(PARK_QUIPS, 0)).toBe(PARK_QUIPS[0]);
    expect(pickLine(PARK_QUIPS, 0.999999)).toBe(PARK_QUIPS[PARK_QUIPS.length - 1]);
  });

  test("임원 every 100th floor, 팀장 every 10th, 중간보스 otherwise", () => {
    expect(bossKind(100)).toBe("exec");
    expect(bossKind(30)).toBe("leader");
    expect(bossKind(7)).toBe("mid");
    expect(BOSS_LINES.leader).toContain("팀장님, 그동안 감사했습니다(퍽)");
  });
});
