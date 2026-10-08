import { describe, expect, test } from "vitest";
import { extendBuff } from "./data/buffs";
import { WALK_SEC } from "./data/floors";
import { settle } from "./settle";
import { fromSave, newState, toSave, type GameState } from "./state";
import { heroAtk, heroPower } from "./stats";
import { PROLOGUE_ID } from "./settle";
// A new game whose prologue has been read (an unread one stands still; see settle.ts).
const played = (now: number) => ({ ...newState(now), story: [PROLOGUE_ID] });

const T0 = 1_000_000_000_000;
const MIN = 60_000;

function strong(): GameState {
  const s = played(T0);
  s.gear = { tier: 6, level: 5, confirmed: 0 };
  return s;
}

describe("buffs", () => {
  test("each buff changes Park's power only while it lasts", () => {
    const s = strong();
    const base = heroPower(s);
    s.buffs = { atk: T0 + MIN, gold: T0 + MIN, move: T0 + MIN };
    const on = heroPower(s);
    expect(on.dps.div(base.dps).toNumber()).toBeCloseTo(6);
    expect(on.goldMult / base.goldMult).toBeCloseTo(3);
    expect(on.walkSec).toBe(WALK_SEC / 2);
    s.lastTick = T0 + MIN;
    expect(heroPower(s).dps.div(base.dps).toNumber()).toBeCloseTo(1);
  });

  test("a buff bought while one runs adds on after it", () => {
    const s = played(T0);
    extendBuff(s, "gold", 30 * MIN);
    extendBuff(s, "gold", 30 * MIN);
    expect(s.buffs.gold).toBe(T0 + 60 * MIN);
  });

  test("gold earned under 성과급 is three times more", () => {
    const plain = strong();
    const buffed = strong();
    buffed.buffs.gold = T0 + 10 * MIN;
    const a = settle(plain, T0 + 5 * MIN).gold;
    const b = settle(buffed, T0 + 5 * MIN).gold;
    expect(b.div(a).toNumber()).toBeCloseTo(3, 1);
  });

  test("a buff ending mid-way: settling in pieces equals settling at once", () => {
    const s = strong();
    s.buffs = { atk: T0 + 3 * MIN + 1234, gold: T0 + 7 * MIN, move: T0 + 90_000 };
    const once = settle(s, T0 + 10 * MIN);
    let parts = s;
    for (const t of [T0 + 61_000, T0 + 3 * MIN + 5, T0 + 6 * MIN, T0 + 10 * MIN]) parts = settle(parts, t);
    expect(parts.gold.div(once.gold).toNumber()).toBeCloseTo(1, 12);
    expect({ ...parts.run, carrySec: 0 }).toEqual({ ...once.run, carrySec: 0 });
    expect(parts.run.carrySec).toBeCloseTo(once.run.carrySec, 6);
  });

  test("the gem shop's gear boost counts as extra gear levels", () => {
    const s = strong();
    const base = heroAtk(s);
    s.run.gearBoost = 2;
    expect(heroAtk(s).cmp(base)).toBe(1);
    expect(heroAtk(s).div(base).toNumber()).toBeCloseTo((1 + 0.2 * 7) / (1 + 0.2 * 5), 6);
  });

  test("a version 6 save gets empty buffs, ads and VX fields", () => {
    const v6 = { ...toSave(played(T0)), v: 6 } as Record<string, unknown>;
    for (const k of ["buffs", "ads", "startedAt", "vx", "offlineBonus"]) delete v6[k];
    v6.run = { floor: 3, target: 0, carrySec: 0, farming: false, maxFloor: 3 };
    const s = fromSave(v6);
    expect(s.buffs).toEqual({ atk: 0, gold: 0, move: 0 });
    expect(s.ads).toEqual({});
    expect(s.startedAt).toBe(T0);
    expect(s.vx).toEqual({ total: 0, premium: false, passUntil: 0, dailyClaimed: "", rookie: false, promos: [] });
    expect(s.run.gearBoost).toBe(0);
    expect(s.offlineBonus).toBeNull();
  });
});

describe("프리미엄 buffs", () => {
  test("all three are always on for premium buyers", async () => {
    const { newState } = await import("./state");
    const { buffActive, BUFF_KINDS } = await import("./data/buffs");
    const s = played(0);
    expect(BUFF_KINDS.some((k) => buffActive(s, k))).toBe(false);
    s.vx.premium = true;
    expect(BUFF_KINDS.every((k) => buffActive(s, k))).toBe(true);
  });
});
