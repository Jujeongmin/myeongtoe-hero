import { describe, expect, test } from "vitest";
import { applyIntent, RuleError } from "./actions";
import { EPISODES } from "./data/story";
import { fromSave, newState, toSave } from "./state";

describe("스토리", () => {
  test("the prologue is open from the start; reading it marks it once", () => {
    expect(EPISODES[0].floor).toBe(0);
    const s = applyIntent(newState(0), { k: "readStory", id: "prologue2" });
    expect(s.story).toEqual(["prologue2"]);
    expect(applyIntent(s, { k: "readStory", id: "prologue2" }).story).toEqual(["prologue2"]);
    expect(() => applyIntent(newState(0), { k: "readStory", id: "nope" })).toThrow(RuleError);
  });

  test("read episodes survive a save; unknown ids are dropped", () => {
    const s = newState(0);
    s.story = ["prologue2"];
    const save = toSave(s);
    expect(fromSave({ ...save, story: ["prologue2", "nope", "prologue2"] }).story).toEqual(["prologue2"]);
  });
});
