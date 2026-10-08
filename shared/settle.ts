import { Big } from "./big";
import { BUFF_KINDS } from "./data/buffs";
import { SPEED_MULT, speedActive } from "./data/speed";
import { MONSTERS_PER_FLOOR, bossGems, bossTickets, isBoss, killGoldMult, targetHp } from "./data/floors";
import { FEVER_KILL_SEC, feverActive } from "./data/fever";
import { PARK_AUTO_CLAIM_MS, parkingHolds, rechargePasses } from "./data/parking";
import { findSideJob, sideJobCycle, sideJobIncome } from "./data/sideJobs";
import { cloneState, type GameState, type RunState, type SideJobState } from "./state";
import { mods, parkPassMax, type Mods } from "./mods";
import { heroPower, offlineCapSec, type Power } from "./stats";

// Enough for 12 offline hours at one kill a second, with room to spare; only a broken table loops.
const MAX_STEPS = 200_000;

export function fightSec(floor: number, target: number, dps: Big): number {
  if (dps.isZero()) return Number.POSITIVE_INFINITY;
  return targetHp(floor, target).div(dps).toNumber();
}

// Seconds to bring down the `target`-th monster of this floor: its health (after cuts) against the
// dps (the boss dps for a boss), plus any drain of a share of its health a second (홍과장):
// 1 / (dps / hp + drain).
export function targetSec(floor: number, target: number, power: Power): number {
  const hp = targetHp(floor, target).mulN(power.hpMult);
  const dps = isBoss(target) ? power.bossDps : power.dps;
  const rate = (hp.isZero() ? 0 : dps.div(hp).toNumber()) + power.drainPerSec;
  return rate > 0 ? 1 / rate : Number.POSITIVE_INFINITY;
}

const BOSS = MONSTERS_PER_FLOOR - 1;

// Plays `dt` seconds of the tower at a fixed power. No frames, no randomness: the same answer on the
// server and on every client, and splitting the time any way gives the same result (time left over
// is carried in run.carrySec). The screen's fight only animates what this decides.
// A boss not beaten within its time limit sends Park to farm the floor's other monsters; at the
// start of each settle he tries the boss again once he could beat it in time.
export function settleBattle(
  start: RunState, power: Power, dt: number,
): { run: RunState; gold: Big; tickets: number; gems: number; kills: number } {
  const run = { ...start };
  let gold = Big.ZERO;
  let tickets = 0;
  let gems = 0;
  let kills = 0;
  let t = run.carrySec + dt;

  if (run.farming && targetSec(run.floor, BOSS, power) <= power.bossLimitSec) {
    run.farming = false;
    run.target = BOSS;
  }

  for (let step = 0; step < MAX_STEPS; step++) {
    if (run.farming) {
      // The floor's normal monsters, over and over.
      const tpk = targetSec(run.floor, 0, power) + power.walkSec;
      const n = Math.floor(t / tpk);
      if (n > 0) {
        gold = gold.add(power.killGold.mulN(n));
        t = Math.max(0, t - n * tpk);
        kills += n;
      }
      break;
    }

    const floor = run.floor;
    const target = Math.min(run.target, BOSS);
    const sec = targetSec(floor, target, power);
    if (isBoss(target) && sec > power.bossLimitSec) {
      const spent = power.bossLimitSec + power.walkSec;
      if (t < spent) break;
      t -= spent;
      run.farming = true;
      run.target = 0;
      continue;
    }

    const tpk = sec + power.walkSec;
    if (t < tpk) break;
    t -= tpk;
    gold = gold.add(power.killGold.mulN(killGoldMult(floor, target)));
    kills += 1;
    run.target = target + 1;
    if (isBoss(target)) {
      tickets += bossTickets(floor);
      gems += bossGems(floor);
      run.floor += 1;
      run.target = 0;
      run.maxFloor = Math.max(run.maxFloor, run.floor);
    }
  }

  run.carrySec = t;
  return { run, gold, tickets, gems, kills };
}

// 피버타임: monsters fall one every FEVER_KILL_SEC (bosses too) until the time runs out or the run
// reaches `toFloor`. Whatever time is left is kept in run.carrySec: for the next kill while the
// fever lasts, or for the usual fight once Park is back at his floor.
export function settleFever(
  start: RunState, power: Power, dt: number, toFloor: number,
): { run: RunState; gold: Big; tickets: number; gems: number; kills: number } {
  const run = { ...start, farming: false };
  let gold = Big.ZERO;
  let tickets = 0;
  let gems = 0;
  let kills = 0;
  let t = start.carrySec + dt;
  while (run.floor < toFloor && t >= FEVER_KILL_SEC && kills < MAX_STEPS) {
    t -= FEVER_KILL_SEC;
    const target = Math.min(run.target, BOSS);
    gold = gold.add(power.killGold.mulN(killGoldMult(run.floor, target)));
    kills += 1;
    run.target = target + 1;
    if (isBoss(target)) {
      tickets += bossTickets(run.floor);
      gems += bossGems(run.floor);
      run.floor += 1;
      run.target = 0;
      run.maxFloor = Math.max(run.maxFloor, run.floor);
    }
  }
  run.carrySec = t;
  return { run, gold, tickets, gems, kills };
}

// Every owned side job pays once per cycle and starts over on its own, the time left over carried.
export function settleSideJobs(
  jobs: Record<string, SideJobState>, dt: number, incomeMult = 1,
): { sideJobs: Record<string, SideJobState>; gold: Big } {
  let gold = Big.ZERO;
  const sideJobs: Record<string, SideJobState> = {};
  for (const [id, own] of Object.entries(jobs)) {
    const job = findSideJob(id);
    if (!job || own.level === 0) {
      sideJobs[id] = { ...own };
      continue;
    }
    const cycle = sideJobCycle(job, own.level);
    const income = sideJobIncome(job, own.level).mulN(incomeMult);
    const p = own.progressSec + dt;
    const paid = Math.floor(p / cycle);
    if (paid > 0) gold = gold.add(income.mulN(paid));
    sideJobs[id] = { ...own, running: true, progressSec: Math.max(0, p - paid * cycle) };
  }
  return { sideJobs, gold };
}

// Everything that happens between lastTick and now (server time), at most offlineCapSec of it (the
// latest part). The time is cut where a buff ends, so each piece runs at one power; where the cuts
// fall depends only on the buffs, so settling in any number of calls gives the same result.
// Returns a new state; the input is never changed.
export function settle(state: GameState, now: number): GameState {
  if (now <= state.lastTick) return state;
  let next = cloneState(state);
  next.lastTick = Math.max(state.lastTick, now - offlineCapSec(state) * 1000);
  while (next.lastTick < now) {
    const parkingEnds = next.parking.claimed ? [next.parking.runUntil] : [next.parking.runUntil, next.parking.runUntil + PARK_AUTO_CLAIM_MS];
    const ends = [...BUFF_KINDS.map((k) => next.buffs[k]), next.speed.until, next.fever.until, ...parkingEnds].filter((t) => t > next.lastTick && t < now);
    next = settleSpan(next, Math.min(now, ...ends));
  }
  return next;
}

// Settles lastTick to `to` at the power of lastTick (nothing changes power within the span). With
// 배속 on, the tower and the side jobs get twice the time; passes recharge in real time.
function settleSpan(start: GameState, to: number): GameState {
  const next = cloneState(start);
  const real = (to - start.lastTick) / 1000;
  const dt = speedActive(next) ? real * SPEED_MULT : real;
  const m = mods(next);
  // During a parking run, and until its result is claimed, the tower waits (side jobs and the rest
  // go on). An unclaimed result pays itself after PARK_AUTO_CLAIM_MS.
  const parked = parkingHolds(next.parking, start.lastTick);
  const power = heroPower(next);
  // 피버타임 first; once Park is back at his floor the rest of the span is fought as usual.
  let fightDt = parked ? 0 : dt;
  let fever: ReturnType<typeof settleFever> | null = null;
  if (!parked && feverActive(next, start.lastTick)) {
    fever = settleFever(next.run, power, fightDt, next.fever.toFloor);
    fightDt = 0; // the fever's leftover time is in its run.carrySec
    if (fever.run.floor >= next.fever.toFloor) next.fever = { ...next.fever, until: 0 };
  }
  const fought = settleBattle(fever ? fever.run : next.run, power, fightDt);
  const battle = fever
    ? { run: fought.run, gold: fever.gold.add(fought.gold), tickets: fever.tickets + fought.tickets, gems: fever.gems + fought.gems, kills: fever.kills + fought.kills }
    : fought;
  const jobs = settleSideJobs(next.sideJobs, dt, m.sideJobMult);
  const best = Math.max(next.bestFloor, battle.run.maxFloor);
  const drops = next.ticketCarry + battle.kills * m.ticketPerKill;
  const pay = paidBySideJobPet(next, m, dt);
  next.gems += battle.gems;
  next.lastTick = to;
  next.run = battle.run;
  next.bestFloor = best;
  next.tickets += battle.tickets + Math.floor(drops);
  next.ticketCarry = drops - Math.floor(drops);
  next.sideJobs = jobs.sideJobs;
  next.gold = next.gold.add(battle.gold).add(jobs.gold).add(pay);
  next.parking = rechargePasses(next.parking, real, parkPassMax(next));
  if (!next.parking.claimed && next.parking.last && to >= next.parking.runUntil + PARK_AUTO_CLAIM_MS) {
    next.tickets += next.parking.last.tickets;
    next.parking = { ...next.parking, claimed: true };
  }
  return next;
}

// 박주임: the dearest owned side job's income, once every sideJobPaySec seconds (counted
// continuously, so splitting the time changes nothing).
function paidBySideJobPet(s: GameState, m: Mods, dt: number): Big {
  if (m.sideJobPaySec <= 0) return Big.ZERO;
  let best = Big.ZERO;
  for (const [id, own] of Object.entries(s.sideJobs)) {
    const job = findSideJob(id);
    if (!job || own.level === 0) continue;
    const income = sideJobIncome(job, own.level);
    if (income.cmp(best) > 0) best = income;
  }
  return best.mulN((dt / m.sideJobPaySec) * m.sideJobPayMult * m.sideJobMult);
}
