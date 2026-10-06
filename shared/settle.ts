import { Big } from "./big";
import { BOSS_LIMIT_SEC, WALK_SEC, isBossFloor, killGold, targetHp, targetsOn } from "./data/floors";
import { findSideJob, sideJobCycle, sideJobIncome } from "./data/sideJobs";
import { OFFLINE_CAP_SEC, cloneState, type GameState, type RunState, type SideJobState } from "./state";
import { heroDps } from "./stats";

// Enough for 12 offline hours at one kill a second, with room to spare; only a broken table loops.
const MAX_STEPS = 200_000;

export function fightSec(floor: number, dps: Big): number {
  if (dps.isZero()) return Number.POSITIVE_INFINITY;
  return targetHp(floor).div(dps).toNumber();
}

function bossBeatable(floor: number, dps: Big): boolean {
  return fightSec(floor, dps) <= BOSS_LIMIT_SEC;
}

// Plays `dt` seconds of the tower at a fixed `dps`. No frames, no randomness: the same answer on the
// server and on every client, and splitting the time any way gives the same result (time left over
// is carried in run.carrySec). The screen's fight only animates what this decides.
export function settleBattle(start: RunState, dps: Big, dt: number): { run: RunState; gold: Big } {
  const run = { ...start };
  let gold = Big.ZERO;
  let t = run.carrySec + dt;

  if (run.farming && bossBeatable(run.floor + 1, dps)) {
    run.farming = false;
    run.floor += 1;
    run.target = 0;
  }

  for (let step = 0; step < MAX_STEPS; step++) {
    if (run.farming) {
      const tpk = fightSec(run.floor, dps) + WALK_SEC;
      const kills = Math.floor(t / tpk);
      if (kills > 0) {
        gold = gold.add(killGold(run.floor).mulN(kills));
        t = Math.max(0, t - kills * tpk);
      }
      break;
    }

    const floor = run.floor;
    const sec = fightSec(floor, dps);
    if (isBossFloor(floor) && sec > BOSS_LIMIT_SEC) {
      const spent = BOSS_LIMIT_SEC + WALK_SEC;
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
    gold = gold.add(killGold(floor));
    run.target += 1;
    if (run.target >= targetsOn(floor)) {
      run.floor += 1;
      run.target = 0;
      run.maxFloor = Math.max(run.maxFloor, run.floor);
    }
  }

  run.carrySec = t;
  return { run, gold };
}

export function settleSideJobs(
  jobs: Record<string, SideJobState>, dt: number, auto: boolean,
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
    const income = sideJobIncome(job, own.level);
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

// Everything that happens between lastTick and now (server time), at most OFFLINE_CAP_SEC of it.
// Returns a new state; the input is never changed.
export function settle(state: GameState, now: number): GameState {
  if (now <= state.lastTick) return state;
  const dt = Math.min(OFFLINE_CAP_SEC, (now - state.lastTick) / 1000);
  const next = cloneState(state);
  const battle = settleBattle(next.run, heroDps(next), dt);
  const jobs = settleSideJobs(next.sideJobs, dt, next.flags.sideJobAuto);
  next.lastTick = now;
  next.run = battle.run;
  next.bestFloor = Math.max(next.bestFloor, battle.run.maxFloor);
  next.sideJobs = jobs.sideJobs;
  next.gold = next.gold.add(battle.gold).add(jobs.gold);
  return next;
}
