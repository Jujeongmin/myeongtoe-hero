import { describe, expect, test } from "vitest";
import { applyIntent, RuleError } from "./actions";
import { MONSTERS_PER_FLOOR } from "./data/floors";
import { newState } from "./state";

describe("보스 도전", () => {
  test("farming: the boss is tried at once", () => {
    const s = newState(0);
    s.run = { ...s.run, floor: 7, farming: true, target: 0, carrySec: 1.5 };
    const after = applyIntent(s, { k: "challengeBoss" });
    expect(after.run.farming).toBe(false);
    expect(after.run.target).toBe(MONSTERS_PER_FLOOR - 1);
    expect(after.run.carrySec).toBe(0);
    expect(after.run.floor).toBe(7);
  });

  test("only while farming", () => {
    expect(() => applyIntent(newState(0), { k: "challengeBoss" })).toThrow(RuleError);
  });
});
