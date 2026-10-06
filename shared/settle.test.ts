import { describe, expect, test } from "vitest";
import { Big } from "./big";
import { BOSS_LIMIT_SEC, WALK_SEC, killGold, targetHp } from "./data/floors";
import { fightSec, settleBattle } from "./settle";
import { newState } from "./state";
import { heroDps } from "./stats";

const fresh = () => newState(0).run;

describe("heroDps", () => {
  test("the ballpoint pen: 10 attack × 2 hits a second × expected crit", () => {
    expect(heroDps(newState(0)).toNumber()).toBeCloseTo(10 * 2 * 1.025, 9);
  });
});

describe("settleBattle", () => {
  test("kills a monster when enough time has passed, keeping the rest", () => {
    const dps = Big.of(20);
    const tpk = fightSec(1, dps) + WALK_SEC; // 20 hp / 20 dps + 1 s walk = 2 s
    expect(tpk).toBeCloseTo(2, 9);
    const { run, gold } = settleBattle(fresh(), dps, 5);
    expect(run.target).toBe(2);
    expect(run.carrySec).toBeCloseTo(1, 9);
    expect(gold.toNumber()).toBeCloseTo(killGold(1).toNumber() * 2, 9);
  });

  test("moves up a floor after ten kills", () => {
    const { run } = settleBattle(fresh(), Big.of(1, 9), 10 * (WALK_SEC + 1e-6) + 0.5);
    expect(run.floor).toBe(2);
    expect(run.target).toBe(0);
    expect(run.maxFloor).toBe(2);
  });

  test("one long settle equals many short ones", () => {
    const dps = Big.of(37);
    const once = settleBattle(fresh(), dps, 600);
    let run = fresh();
    let gold = Big.ZERO;
    for (let i = 0; i < 600; i++) {
      const step = settleBattle(run, dps, 1);
      run = step.run;
      gold = gold.add(step.gold);
    }
    expect(run.floor).toBe(once.run.floor);
    expect(run.target).toBe(once.run.target);
    expect(run.farming).toBe(once.run.farming);
    expect(run.carrySec).toBeCloseTo(once.run.carrySec, 6);
    expect(gold.div(once.gold).toNumber()).toBeCloseTo(1, 9);
  });

  test("a boss that takes over 30 s sends Park to farm the floor below", () => {
    // Floor 10 boss: 20 × 1.16^9 × 10 ≈ 761 hp; at 20 dps that is 38 s.
    const dps = Big.of(20);
    expect(fightSec(10, dps)).toBeGreaterThan(BOSS_LIMIT_SEC);
    const start = { ...fresh(), floor: 10, maxFloor: 10 };
    const { run, gold } = settleBattle(start, dps, BOSS_LIMIT_SEC + WALK_SEC + 0.5);
    expect(run.farming).toBe(true);
    expect(run.floor).toBe(9);
    expect(run.maxFloor).toBe(10);
    expect(gold.isZero()).toBe(true);
    expect(run.carrySec).toBeCloseTo(0.5, 9);
  });

  test("farming earns the floor-below gold and goes back up once strong enough", () => {
    const weak = Big.of(20);
    const farming = { floor: 9, target: 0, carrySec: 0, farming: true, maxFloor: 10 };
    const tpk = fightSec(9, weak) + WALK_SEC;
    const grind = settleBattle(farming, weak, tpk * 3 + 0.1);
    expect(grind.run.farming).toBe(true);
    expect(grind.gold.div(killGold(9)).toNumber()).toBeCloseTo(3, 9);

    const strong = targetHp(10).div(Big.of(BOSS_LIMIT_SEC / 2)); // beats the boss in 15 s
    const back = settleBattle(farming, strong, 0);
    expect(back.run.farming).toBe(false);
    expect(back.run.floor).toBe(10);
  });
});
