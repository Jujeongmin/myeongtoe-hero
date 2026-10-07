import { describe, expect, test } from "vitest";
import { Big } from "./big";
import { BOSS_LIMIT_SEC, WALK_SEC, targetHp } from "./data/floors";
import { SIDE_JOBS, sideJobCycle, sideJobIncome } from "./data/sideJobs";
import { fightSec, settle, settleBattle, settleSideJobs, targetSec } from "./settle";
import { OFFLINE_CAP_SEC, newState } from "./state";
import { heroDps, heroPower, type Power } from "./stats";

const KG = Big.of(7);
const P = (dps: Big, extra: Partial<Power> = {}): Power => ({
  dps, bossDps: dps, bossLimitSec: BOSS_LIMIT_SEC, goldMult: 1, hpMult: 1, drainPerSec: 0, walkSec: WALK_SEC, hitSec: 0.5, killGold: KG, ...extra,
});

const fresh = () => newState(0).run;

describe("heroDps", () => {
  test("the ballpoint pen: 10 attack × 2 hits a second × expected crit", () => {
    expect(heroDps(newState(0)).toNumber()).toBeCloseTo(50 * 2 * 1.025, 9);
  });
});

describe("settleBattle", () => {
  test("kills a monster when enough time has passed, keeping the rest", () => {
    const dps = Big.of(570);
    const tpk = fightSec(1, 0, dps) + WALK_SEC; // 570 hp / 570 dps + 0.5 s walk = 1.5 s
    expect(tpk).toBeCloseTo(1.5, 9);
    const { run, gold } = settleBattle(fresh(), P(dps), 3.5);
    expect(run.target).toBe(2);
    expect(run.carrySec).toBeCloseTo(0.5, 9);
    expect(gold.toNumber()).toBeCloseTo(KG.toNumber() * 2, 9);
  });

  test("moves up a floor after five kills, the fifth a boss paying 5× and 2 tickets", () => {
    const { run, gold, tickets } = settleBattle(fresh(), P(Big.of(1, 9)), 5 * (WALK_SEC + 1e-6) + 0.1);
    expect(run.floor).toBe(2);
    expect(run.target).toBe(0);
    expect(run.maxFloor).toBe(2);
    expect(gold.div(KG).toNumber()).toBeCloseTo(4 + 5, 9);
    expect(tickets).toBe(2);
  });

  test("one long settle equals many short ones", () => {
    const dps = Big.of(2000);
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

  test("a boss that takes over 30 s sends Park to farm the floor's other monsters", () => {
    const start = { ...fresh(), floor: 10, target: 4, maxFloor: 10 };
    const dps = targetHp(10, 4).div(Big.of(40)); // 40 s for the boss
    expect(fightSec(10, 4, dps)).toBeCloseTo(40, 6);
    const { run, gold } = settleBattle(start, P(dps), BOSS_LIMIT_SEC + WALK_SEC + 0.25);
    expect(run.farming).toBe(true);
    expect(run.floor).toBe(10);
    expect(run.target).toBe(0);
    expect(gold.isZero()).toBe(true);
    expect(run.carrySec).toBeCloseTo(0.25, 9);
  });

  test("farming earns normal-kill gold and goes back to the boss once strong enough", () => {
    const weak = targetHp(10, 4).div(Big.of(40));
    const farming = { floor: 10, target: 0, carrySec: 0, farming: true, maxFloor: 10, gearBoost: 0 };
    const tpk = fightSec(10, 0, weak) + WALK_SEC;
    const grind = settleBattle(farming, P(weak), tpk * 3 + 0.01);
    expect(grind.run.farming).toBe(true);
    expect(grind.gold.div(KG).toNumber()).toBeCloseTo(3, 9);

    const strong = targetHp(10, 4).div(Big.of(BOSS_LIMIT_SEC / 2)); // beats the boss in 15 s
    const back = settleBattle(farming, P(strong), 0);
    expect(back.run.farming).toBe(false);
    expect(back.run.floor).toBe(10);
    expect(back.run.target).toBe(4);
  });
});

describe("settleBattle with Power", () => {
  test("a boss is fought with the boss dps and the boss time limit", () => {
    const dps = targetHp(10, 4).div(Big.of(38));
    expect(targetSec(10, 4, P(dps))).toBeCloseTo(38, 6);
    expect(targetSec(10, 4, P(dps, { bossDps: dps.mulN(2) }))).toBeCloseTo(19, 6);
    // 38 s: too slow for 30 s, fine for 40 s.
    const start = { floor: 10, target: 4, carrySec: 0, farming: false, maxFloor: 10, gearBoost: 0 };
    expect(settleBattle(start, P(dps, { bossLimitSec: 40 }), 40).run.floor).toBe(11);
  });

  test("gold follows the kill gold; 10th and 100th floor bosses pay more tickets and gems", () => {
    const strong = Big.of(1, 12);
    const start = { floor: 10, target: 0, carrySec: 0, farming: false, maxFloor: 10, gearBoost: 0 };
    const plain = settleBattle(start, P(strong), 5 * WALK_SEC + 0.1);
    expect(plain.run.floor).toBe(11);
    expect(plain.tickets).toBe(5);
    expect(plain.gems).toBe(3);
    const doubled = settleBattle(start, P(strong, { killGold: KG.mulN(2) }), 5 * WALK_SEC + 0.1);
    expect(doubled.gold.div(plain.gold).toNumber()).toBeCloseTo(2, 9);
    const exec = settleBattle({ ...start, floor: 100, target: 4, maxFloor: 100 }, P(Big.of(1, 30)), WALK_SEC + 0.1);
    expect(exec.tickets).toBe(10);
    expect(exec.gems).toBe(20);
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

  test("a fresh Park climbs a little and gets stuck at an early boss", () => {
    const after = settle(newState(0), 3_600_000);
    expect(after.run.farming).toBe(true);
    expect(after.bestFloor).toBeGreaterThan(1);
    expect(after.bestFloor).toBeLessThan(20);
  });
});
