import { Big } from "./big";
import { BOSS_LIMIT_SEC, WALK_SEC, isBossFloor, killGold, targetHp, targetsOn } from "./data/floors";
import type { RunState } from "./state";

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
