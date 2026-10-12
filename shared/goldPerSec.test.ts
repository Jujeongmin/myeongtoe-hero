import { describe, expect, test } from "vitest";
import { PROLOGUE_ID, goldPerSec, settle } from "./settle";
import { newState, type GameState } from "./state";

const played = (): GameState => ({
  ...newState(0),
  story: [PROLOGUE_ID],
  sideJobs: { j00: { level: 30, progressSec: 0, running: true }, j01: { level: 12, progressSec: 0, running: true } },
});

// Gold settle actually pays over `sec` seconds (its own floor progress and all).
function paid(s: GameState, sec: number): number {
  return settle(s, s.lastTick + sec * 1000).gold.sub(s.gold).toNumber();
}

describe("gold per second", () => {
  test("the side-job part is exactly what settle pays them", () => {
    // A boss far too strong and Park unable to scratch it: only the side jobs pay.
    const s = played();
    s.run = { ...s.run, floor: 5000, maxFloor: 5000, farming: true };
    const g = goldPerSec(s);
    expect(paid(s, 3600) / 3600).toBeCloseTo(g.total.toNumber(), 0);
    expect(g.total.toNumber()).toBeCloseTo(g.jobs.toNumber() + g.kills.toNumber(), 6);
  });

  test("with the kills it matches settle over a few minutes on the first floors", () => {
    const s = played();
    const g = goldPerSec(s).total.toNumber();
    const real = paid(s, 120) / 120;
    expect(Math.abs(real - g) / g).toBeLessThan(0.25);
  });

  test("투잡관리 raises the side jobs (and the kills, a share of them); 수금 raises the kills only", () => {
    const base = goldPerSec(played());
    const side = played();
    side.certs = { side1: 20 };
    const withSide = goldPerSec(side);
    expect(withSide.jobs.toNumber()).toBeGreaterThan(base.jobs.toNumber() * 1.05);
    expect(withSide.kills.toNumber() / base.kills.toNumber()).toBeCloseTo(withSide.jobs.toNumber() / base.jobs.toNumber(), 3);
    const gold = played();
    gold.certs = { gold1: 20 };
    const withGold = goldPerSec(gold);
    expect(withGold.jobs.toNumber()).toBeCloseTo(base.jobs.toNumber(), 6);
    expect(withGold.kills.toNumber()).toBeGreaterThan(base.kills.toNumber() * 1.05);
    // And settle pays those raises for real.
    expect(paid(side, 600)).toBeGreaterThan(paid(played(), 600) * 1.05);
    expect(paid(gold, 600)).toBeGreaterThan(paid(played(), 600));
  });
});
