import { describe, expect, test } from "vitest";
import { Big } from "./big";
import { BOSS_LIMIT_SEC, WALK_SEC, killGold, targetHp } from "./data/floors";
import { SIDE_JOBS, sideJobCycle, sideJobIncome } from "./data/sideJobs";
import { firstClearGems, fightSec, settle, settleBattle, settleSideJobs, targetSec } from "./settle";
import { OFFLINE_CAP_SEC, newState } from "./state";
import { heroDps, heroPower, type Power } from "./stats";

const P = (dps: Big, extra: Partial<Power> = {}): Power => ({ dps, bossDps: dps, bossLimitSec: BOSS_LIMIT_SEC, goldMult: 1, hpMult: 1, drainPerSec: 0, walkSec: 1, hitSec: 0.5, ...extra });

const fresh = () => newState(0).run;

describe("heroDps", () => {
  test("the ballpoint pen: 10 attack × 2 hits a second × expected crit", () => {
    expect(heroDps(newState(0)).toNumber()).toBeCloseTo(50 * 2 * 1.025, 9);
  });
});

describe("settleBattle", () => {
  test("kills a monster when enough time has passed, keeping the rest", () => {
    const dps = Big.of(100);
    const tpk = fightSec(1, dps) + WALK_SEC; // 100 hp / 100 dps + 1 s walk = 2 s
    expect(tpk).toBeCloseTo(2, 9);
    const { run, gold } = settleBattle(fresh(), P(dps), 5);
    expect(run.target).toBe(2);
    expect(run.carrySec).toBeCloseTo(1, 9);
    expect(gold.toNumber()).toBeCloseTo(killGold(1).toNumber() * 2, 9);
  });

  test("moves up a floor after ten kills", () => {
    const { run } = settleBattle(fresh(), P(Big.of(1, 9)), 10 * (WALK_SEC + 1e-6) + 0.5);
    expect(run.floor).toBe(2);
    expect(run.target).toBe(0);
    expect(run.maxFloor).toBe(2);
  });

  test("one long settle equals many short ones", () => {
    const dps = Big.of(185);
    const once = settleBattle(fresh(), P(dps), 600);
    let run = fresh();
    let gold = Big.ZERO;
    for (let i = 0; i < 600; i++) {
      const step = settleBattle(run, P(dps), 1);
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
    // Floor 10 boss: 100 × 1.16^9 × 10 ≈ 3803 hp; at 100 dps that is 38 s.
    const dps = Big.of(100);
    expect(fightSec(10, dps)).toBeGreaterThan(BOSS_LIMIT_SEC);
    const start = { ...fresh(), floor: 10, maxFloor: 10 };
    const { run, gold } = settleBattle(start, P(dps), BOSS_LIMIT_SEC + WALK_SEC + 0.5);
    expect(run.farming).toBe(true);
    expect(run.floor).toBe(9);
    expect(run.maxFloor).toBe(10);
    expect(gold.isZero()).toBe(true);
    expect(run.carrySec).toBeCloseTo(0.5, 9);
  });

  test("farming earns the floor-below gold and goes back up once strong enough", () => {
    const weak = Big.of(100);
    const farming = { floor: 9, target: 0, carrySec: 0, farming: true, maxFloor: 10, gearBoost: 0 };
    const tpk = fightSec(9, weak) + WALK_SEC;
    const grind = settleBattle(farming, P(weak), tpk * 3 + 0.1);
    expect(grind.run.farming).toBe(true);
    expect(grind.gold.div(killGold(9)).toNumber()).toBeCloseTo(3, 9);

    const strong = targetHp(10).div(Big.of(BOSS_LIMIT_SEC / 2)); // beats the boss in 15 s
    const back = settleBattle(farming, P(strong), 0);
    expect(back.run.farming).toBe(false);
    expect(back.run.floor).toBe(10);
  });
});

describe("settleBattle with Power", () => {
  test("a boss is fought with the boss dps and the boss time limit", () => {
    const dps = Big.of(100);
    expect(targetSec(10, P(dps))).toBeCloseTo(fightSec(10, dps), 9);
    expect(targetSec(10, P(dps, { bossDps: dps.mulN(2) }))).toBeCloseTo(fightSec(10, dps) / 2, 9);
    // 38 s at 100 dps: too slow for 30 s, fine for 40 s.
    const start = { floor: 10, target: 0, carrySec: 0, farming: false, maxFloor: 10, gearBoost: 0 };
    expect(settleBattle(start, P(dps, { bossLimitSec: 40 }), 40).run.floor).toBe(11);
  });

  test("gold is multiplied, and team-leader bosses pay tickets", () => {
    const strong = Big.of(1, 9);
    const start = { floor: 9, target: 0, carrySec: 0, farming: false, maxFloor: 9, gearBoost: 0 };
    const plain = settleBattle(start, P(strong), 11 * WALK_SEC + 0.5);
    expect(plain.run.floor).toBe(11);
    expect(plain.tickets).toBe(1);
    const doubled = settleBattle(start, P(strong, { goldMult: 2 }), 11 * WALK_SEC + 0.5);
    expect(doubled.gold.div(plain.gold).toNumber()).toBeCloseTo(2, 9);
    const exec = settleBattle({ ...start, floor: 100, maxFloor: 100 }, P(Big.of(1, 30)), WALK_SEC + 0.5);
    expect(exec.tickets).toBe(5);
  });
});

describe("settleSideJobs", () => {
  const job = SIDE_JOBS[0];
  const cycle = sideJobCycle(job, 2);
  const income = sideJobIncome(job, 2);

  test("a job pays every cycle on its own and carries the rest", () => {
    const jobs = { [job.id]: { level: 2, progressSec: 0, running: false } };
    const { sideJobs, gold } = settleSideJobs(jobs, cycle * 3.5);
    expect(gold.div(income).toNumber()).toBeCloseTo(3, 9);
    expect(sideJobs[job.id].progressSec).toBeCloseTo(cycle * 0.5, 6);
    expect(sideJobs[job.id].running).toBe(true);
  });

  test("an unbought job earns nothing", () => {
    const jobs = { [SIDE_JOBS[1].id]: { level: 0, progressSec: 0, running: true } };
    expect(settleSideJobs(jobs, 1e6).gold.isZero()).toBe(true);
  });
});

describe("settle", () => {
  test("advances the clock and adds battle and side job gold", () => {
    const s = newState(0);
    s.sideJobs[SIDE_JOBS[0].id] = { level: 1, progressSec: 0, running: true };
    const after = settle(s, 60_000);
    expect(after.lastTick).toBe(60_000);
    const battleOnly = settleBattle(s.run, heroPower(s), 60).gold;
    expect(after.gold.cmp(battleOnly)).toBe(1);
    expect(after.bestFloor).toBe(after.run.maxFloor);
    expect(s.lastTick).toBe(0); // the input is untouched
  });

  test("caps offline time at 12 hours", () => {
    const s = newState(0);
    const capped = settle(s, OFFLINE_CAP_SEC * 1000);
    const beyond = settle(s, OFFLINE_CAP_SEC * 4000);
    expect(beyond.run).toEqual(capped.run);
    expect(beyond.gold.cmp(capped.gold)).toBe(0);
  });

  test("ignores a clock that went backwards", () => {
    const s = newState(10_000);
    expect(settle(s, 5_000)).toBe(s);
  });

  test("a fresh Park gets stuck under the floor-10 boss", () => {
    const after = settle(newState(0), 3_600_000);
    expect(after.run.farming).toBe(true);
    expect(after.run.floor).toBe(9);
    expect(after.bestFloor).toBe(10);
  });
});

describe("firstClearGems", () => {
  test("pays once for each 10th and 100th floor passed for the first time", () => {
    expect(firstClearGems(1, 10)).toBe(0);
    expect(firstClearGems(10, 11)).toBe(5);
    expect(firstClearGems(1, 31)).toBe(15);
    expect(firstClearGems(95, 101)).toBe(50);
    expect(firstClearGems(31, 31)).toBe(0);
  });

  test("settle adds them to the save", () => {
    const after = settle(newState(0), 3_600_000);
    expect(after.bestFloor).toBe(10);
    expect(after.gems).toBe(0);
    const s = newState(0);
    s.gear = { tier: 5, level: 0, confirmed: 0 };
    expect(settle(s, 600_000).gems).toBeGreaterThan(0);
  });
});
