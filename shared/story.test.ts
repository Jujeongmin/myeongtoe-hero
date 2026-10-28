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

describe("동료 episodes come with the colleague", () => {
  test("each colleague's joining episode opens on the floor it joins; the list runs in floor order", async () => {
    const { PETS } = await import("./data/pets");
    for (const pet of PETS) {
      const ep = EPISODES.find((e) => e.panels.some((p) => p.lines.some((l) => l.text === `${pet.name}이 동료가 되었다.` || l.text === `${pet.name}가 동료가 되었다.`)));
      expect(ep?.floor, pet.name).toBe(pet.unlockFloor);
    }
    const main = EPISODES.filter((e) => /^\d+화/.test(e.title));
    main.forEach((e, i) => expect(e.title.startsWith(`${i + 1}화`), e.title).toBe(true));
    for (let i = 1; i < main.length; i++) expect(main[i].floor).toBeGreaterThan(main[i - 1].floor);
  });
});
