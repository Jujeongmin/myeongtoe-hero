import { Big } from "../big";
import { PARK_PASS_MAX, type GameState } from "../state";
import type { Power } from "../stats";

// 지하주차장: a 30-second run down one meter per monster, a chest every
// 20 m paying 응시권 (exponentially more the deeper), entered with passes that recharge one per
// 15 minutes up to 16. First-pass numbers; tuned in step 8.
export { PARK_PASS_MAX };
export const PARK_RECHARGE_SEC = 900;
export const PARK_RUN_SEC = 30;
// A result left unclaimed this long after its run pays itself, so an idle tower never waits forever.
export const PARK_AUTO_CLAIM_MS = 5 * 60_000;

// The tower waits from entering until the result is claimed (or claims itself).
export function parkingHolds(parking: GameState["parking"], at: number): boolean {
  return at < parking.runUntil || (!parking.claimed && at < parking.runUntil + PARK_AUTO_CLAIM_MS);
}
export const PARK_STEP_SEC = 0.2;
export const PARK_CHEST_EVERY = 20;
export const PARK_HP_BASE = 100;
export const PARK_HP_GROWTH = 1.1;
const MAX_METERS = 100_000;

export function parkHp(meter: number): Big {
  return Big.pow(PARK_HP_GROWTH, meter - 1).mulN(PARK_HP_BASE);
}

// The k-th chest (at 20k m).
export function chestTickets(k: number): number {
  return Math.floor(1.25 ** (k - 1));
}

export interface ParkingRun {
  depth: number;
  chests: number;
  tickets: number;
  warped: number; // meters at the start passed through without fighting (각성)
}

// 지하주차장 각성: after this many runs ever, a run warps through the meters Park kills in one hit
// (a monster with at most half a second of his damage), up to PARK_WARP_MAX m; their chests still pay.
export const PARK_AWAKEN = 1500;
export const PARK_WARP_MAX = 7000;

// The seconds meter `meter` takes: its fight plus the step to the next one.
export function parkMeterSec(power: Power, meter: number): number {
  const hp = parkHp(meter).mulN(power.hpMult);
  const rate = (hp.isZero() ? 0 : power.dps.div(hp).toNumber()) + power.drainPerSec;
  return (rate > 0 ? 1 / rate : Number.POSITIVE_INFINITY) + PARK_STEP_SEC;
}

// Whether meter `meter` is warped through in an awakened run.
function warps(power: Power, meter: number): boolean {
  return meter <= PARK_WARP_MAX && parkHp(meter).mulN(power.hpMult).cmp(power.dps.mulN(0.5)) <= 0;
}

// One run at a fixed power, in closed form like the tower: no randomness, so the client's preview
// is exactly what the server applies.
export function runParking(power: Power, awakened = false): ParkingRun {
  let t = PARK_RUN_SEC;
  let depth = 0;
  while (awakened && depth < MAX_METERS && warps(power, depth + 1)) depth += 1;
  const warped = depth;
  while (depth < MAX_METERS) {
    const sec = parkMeterSec(power, depth + 1);
    if (sec > t) break;
    t -= sec;
    depth += 1;
  }
  const chests = Math.floor(depth / PARK_CHEST_EVERY);
  let tickets = 0;
  for (let k = 1; k <= chests; k++) tickets += chestTickets(k);
  return { depth, chests, tickets, warped };
}

// Passes refill with time (called from settle). A full stack holds no partial time.
export function rechargePasses(parking: GameState["parking"], dt: number, max = PARK_PASS_MAX): GameState["parking"] {
  if (parking.passes >= max) return { ...parking, passCarrySec: 0 };
  let { passes, passCarrySec } = parking;
  passCarrySec += dt;
  const gained = Math.floor(passCarrySec / PARK_RECHARGE_SEC);
  passes = Math.min(max, passes + gained);
  passCarrySec = passes >= max ? 0 : passCarrySec - gained * PARK_RECHARGE_SEC;
  return { ...parking, passes, passCarrySec };
}
