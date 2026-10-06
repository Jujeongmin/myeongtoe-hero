import { Big } from "./big";
import { WALK_SEC, isBossFloor, killGold, targetHp, targetsOn } from "./data/floors";
import { findSideJob, sideJobCycle, sideJobIncome } from "./data/sideJobs";
import { cloneState, type GameState, type RunState, type SideJobState } from "./state";
import { heroPower, offlineCapSec, sideJobMult, type Power } from "./stats";

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

export function targetSec(floor: number, power: Power): number {
  return fightSec(floor, isBossFloor(floor) ? power.bossDps : power.dps);
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
export function settleBattle(start: RunState, power: Power, dt: number): { run: RunState; gold: Big; tickets: number } {
  const run = { ...start };
  let gold = Big.ZERO;
  let tickets = 0;
  let t = run.carrySec + dt;

  if (run.farming && targetSec(run.floor + 1, power) <= power.bossLimitSec) {
    run.farming = false;
    run.floor += 1;
    run.target = 0;
  }

  for (let step = 0; step < MAX_STEPS; step++) {
    if (run.farming) {
      const tpk = targetSec(run.floor, power) + WALK_SEC;
      const kills = Math.floor(t / tpk);
      if (kills > 0) {
        gold = gold.add(killGold(run.floor).mulN(kills * power.goldMult));
        t = Math.max(0, t - kills * tpk);
      }
      break;
    }

    const floor = run.floor;
    const sec = targetSec(floor, power);
    if (isBossFloor(floor) && sec > power.bossLimitSec) {
      const spent = power.bossLimitSec + WALK_SEC;
      if (t < spent) break;
      t -= spent;
      // floor - 1 is never a boss floor (bosses sit on multiples of 5).
      run.farming = true;
      run.floor = floor - 1;
      run.target = 0;
      continue;
    }

    const tpk = sec + WALK_SEC;
    if (t < tpk) break;
    t -= tpk;
    gold = gold.add(killGold(floor).mulN(power.goldMult));
    run.target += 1;
    if (run.target >= targetsOn(floor)) {
      tickets += bossTickets(floor);
      run.floor += 1;
      run.target = 0;
      run.maxFloor = Math.max(run.maxFloor, run.floor);
    }
  }

  run.carrySec = t;
  return { run, gold, tickets };
}

export function settleSideJobs(
  jobs: Record<string, SideJobState>, dt: number, auto: boolean, incomeMult = 1,
): { sideJobs: Record<string, SideJobState>; gold: Big } {
  let gold = Big.ZERO;
  const sideJobs: Record<string, SideJobState> = {};
  for (const [id, own] of Object.entries(jobs)) {
    const job = findSideJob(id);
    if (!job || own.level === 0 || !own.running) {
      sideJobs[id] = { ...own };
      continue;
    }
    const cycle = sideJobCycle(job, own.level);
    const income = sideJobIncome(job, own.level).mulN(incomeMult);
    const p = own.progressSec + dt;
    if (auto) {
      const paid = Math.floor(p / cycle);
      if (paid > 0) gold = gold.add(income.mulN(paid));
      sideJobs[id] = { ...own, progressSec: Math.max(0, p - paid * cycle) };
    } else if (p >= cycle) {
      gold = gold.add(income);
      sideJobs[id] = { ...own, progressSec: 0, running: false };
    } else {
      sideJobs[id] = { ...own, progressSec: p };
    }
  }
  return { sideJobs, gold };
}

// Everything that happens between lastTick and now (server time), at most offlineCapSec of it.
// Returns a new state; the input is never changed.
export function settle(state: GameState, now: number): GameState {
  if (now <= state.lastTick) return state;
  const dt = Math.min(offlineCapSec(state), (now - state.lastTick) / 1000);
  const next = cloneState(state);
  const battle = settleBattle(next.run, heroPower(next), dt);
  const jobs = settleSideJobs(next.sideJobs, dt, next.flags.sideJobAuto, sideJobMult(next));
  const best = Math.max(next.bestFloor, battle.run.maxFloor);
  next.gems += firstClearGems(next.bestFloor, best);
  next.lastTick = now;
  next.run = battle.run;
  next.bestFloor = best;
  next.tickets += battle.tickets;
  next.sideJobs = jobs.sideJobs;
  next.gold = next.gold.add(battle.gold).add(jobs.gold);
  return next;
}
