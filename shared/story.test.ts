import { describe, expect, test } from "vitest";
import { applyIntent, RuleError } from "./actions";
import { EPISODES, PARKING_EPISODE_ID } from "./data/story";
import { fromSave, newState, toSave } from "./state";

describe("스토리", () => {
  test("the prologue is open from the start; reading it marks it once", () => {
    expect(EPISODES[0].floor).toBe(0);
    const s = applyIntent(newState(0), { k: "readStory", id: "prologue2" });
    expect(s.story).toEqual(["prologue2"]);
    expect(applyIntent(s, { k: "readStory", id: "prologue2" }).story).toEqual(["prologue2"]);
    expect(() => applyIntent(newState(0), { k: "readStory", id: "nope" })).toThrow(RuleError);
  });

  test("the 지하주차장 episode opens with the 던전 tab (5층), is shown by hand, and reads like any other", () => {
    const ep = EPISODES.find((e) => e.id === PARKING_EPISODE_ID)!;
    expect(ep.manual).toBe(true);
    expect(ep.floor).toBe(5);
    expect(EPISODES.filter((e) => e.manual).map((e) => e.id)).toEqual([PARKING_EPISODE_ID]);
    const at = (floor: number) => ({ ...newState(0), bestFloor: floor });
    expect(() => applyIntent(at(4), { k: "readStory", id: PARKING_EPISODE_ID })).toThrow(RuleError);
    expect(applyIntent(at(5), { k: "readStory", id: PARKING_EPISODE_ID }).story).toEqual([PARKING_EPISODE_ID]);
  });

  test("read episodes survive a save; unknown ids are dropped", () => {
    const s = newState(0);
    s.story = ["prologue2"];
    const save = toSave(s);
    expect(fromSave({ ...save, story: ["prologue2", "nope", "prologue2"] }).story).toEqual(["prologue2"]);
  });
});
