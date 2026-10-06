import { Big } from "./big";
import { BUFF_KINDS } from "./data/buffs";
import { isBossFloor, killGold, targetHp, targetsOn } from "./data/floors";
import { rechargePasses } from "./data/parking";
import { findSideJob, sideJobCycle, sideJobIncome } from "./data/sideJobs";
import { cloneState, type GameState, type RunState, type SideJobState } from "./state";
import { mods, type Mods } from "./mods";
import { heroPower, offlineCapSec, type Power } from "./stats";

// Enough for 12 offline hours at one kill a second, with room to spare; only a broken table loops.
const MAX_STEPS = 200_000;

// Tickets (응시권) for each team-leader / executive boss beaten, every run.
export const BOSS_TICKETS_10 = 1;
export const BOSS_TICKETS_100 = 5;
// Gems (보석) the first time ever the best floor passes a 10th / 100th floor.
export const FIRST_CLEAR_GEMS_10 = 5;
export const FIRST_CLEAR_GEMS_100 = 50;

export function fightSec(floor: number, dps: Big): number {
  if (dps.isZero()) return Number.POSITIVE_INFINITY;
  return targetHp(floor).div(dps).toNumber();
}

// Seconds to bring down this floor's monster: its health (after cuts) against the dps, plus any
// drain of a share of its health a second (홍과장): 1 / (dps / hp + drain).
export function targetSec(floor: number, power: Power): number {
  const hp = targetHp(floor).mulN(power.hpMult);
  const dps = isBossFloor(floor) ? power.bossDps : power.dps;
  const rate = (hp.isZero() ? 0 : dps.div(hp).toNumber()) + power.drainPerSec;
  return rate > 0 ? 1 / rate : Number.POSITIVE_INFINITY;
}

function bossTickets(floor: number): number {
  if (floor % 100 === 0) return BOSS_TICKETS_100;
  if (floor % 10 === 0) return BOSS_TICKETS_10;
  return 0;
}

export function firstClearGems(oldBest: number, newBest: number): number {
  let gems = 0;
  for (let f = Math.ceil(oldBest / 10) * 10; f < newBest; f += 10) {
    gems += f % 100 === 0 ? FIRST_CLEAR_GEMS_100 : FIRST_CLEAR_GEMS_10;
  }
  return gems;
}

// Plays `dt` seconds of the tower at a fixed power. No frames, no randomness: the same answer on the
// server and on every client, and splitting the time any way gives the same result (time left over
// is carried in run.carrySec). The screen's fight only animates what this decides.
export function settleBattle(
  start: RunState, power: Power, dt: number,
): { run: RunState; gold: Big; tickets: number; kills: number } {
  const run = { ...start };
  let gold = Big.ZERO;
  let tickets = 0;
  let kills = 0;
  let t = run.carrySec + dt;

  if (run.farming && targetSec(run.floor + 1, power) <= power.bossLimitSec) {
    run.farming = false;
    run.floor += 1;
    run.target = 0;
  }

  for (let step = 0; step < MAX_STEPS; step++) {
    if (run.farming) {
      const tpk = targetSec(run.floor, power) + power.walkSec;
      const n = Math.floor(t / tpk);
      if (n > 0) {
        gold = gold.add(killGold(run.floor).mulN(n * power.goldMult));
        t = Math.max(0, t - n * tpk);
        kills += n;
      }
      break;
    }

    const floor = run.floor;
    const sec = targetSec(floor, power);
    if (isBossFloor(floor) && sec > power.bossLimitSec) {
      const spent = power.bossLimitSec + power.walkSec;
      if (t < spent) break;
      t -= spent;
      // floor - 1 is never a boss floor (bosses sit on multiples of 5).
      run.farming = true;
      run.floor = floor - 1;
      run.target = 0;
      continue;
    }

    const tpk = sec + power.walkSec;
    if (t < tpk) break;
    t -= tpk;
    gold = gold.add(killGold(floor).mulN(power.goldMult));
    kills += 1;
    run.target += 1;
    if (run.target >= targetsOn(floor)) {
      tickets += bossTickets(floor);
      run.floor += 1;
      run.target = 0;
      run.maxFloor = Math.max(run.maxFloor, run.floor);
    }
  }

  run.carrySec = t;
  return { run, gold, tickets, kills };
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
    const ends = BUFF_KINDS.map((k) => next.buffs[k]).filter((t) => t > next.lastTick && t < now);
    next = settleSpan(next, Math.min(now, ...ends));
  }
  return next;
}

// Settles lastTick to `to` at the power of lastTick (nothing changes power within the span).
function settleSpan(start: GameState, to: number): GameState {
  const next = cloneState(start);
  const dt = (to - start.lastTick) / 1000;
  const m = mods(next);
  const battle = settleBattle(next.run, heroPower(next), dt);
  const jobs = settleSideJobs(next.sideJobs, dt, m.sideJobMult);
  const best = Math.max(next.bestFloor, battle.run.maxFloor);
  const drops = next.ticketCarry + battle.kills * m.ticketPerKill;
  const pay = paidBySideJobPet(next, m, dt);
  next.gems += firstClearGems(next.bestFloor, best);
  next.lastTick = to;
  next.run = battle.run;
  next.bestFloor = best;
  next.tickets += battle.tickets + Math.floor(drops);
  next.ticketCarry = drops - Math.floor(drops);
  next.sideJobs = jobs.sideJobs;
  next.gold = next.gold.add(battle.gold).add(jobs.gold).add(pay);
  next.parking = rechargePasses(next.parking, dt);
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
