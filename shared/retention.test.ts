import { describe, expect, test } from "vitest";
import { addDays, churnReport, churnTable, isAdmin, retentionDays, retentionTable, track, type PlayerRow } from "./retention";

const P = { floor: 12, step: 3, prestiges: 0 };

// 2026-10-15 12:00 KST
const DAY2 = Date.UTC(2026, 9, 15, 3);

describe("retention", () => {
  test("the admin account, in any letter case; nobody else", () => {
    expect(isAdmin("0x7b47Aa40357441418909f83728Da906b7C85d261")).toBe(true);
    expect(isAdmin("0x7b47aa40357441418909f83728da906b7c85d261")).toBe(true);
    expect(isAdmin("0x0000000000000000000000000000000000000000")).toBe(false);
  });

  test("days count across months", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-10-14", -1)).toBe("2026-10-13");
  });

  test("a new player's first visit starts their cohort; later visits carry it", () => {
    const a = track("p", undefined, true, P, DAY2)!;
    expect(a.visit).toEqual({ account: "p", day: "2026-10-15", first: "2026-10-15" });
    expect(a.player).toEqual({ account: "p", first: "2026-10-15", last: "2026-10-15", days: 1, floor: 12, step: 3, prestiges: 0, playMin: 0 });
    const again = track("p", a.seen, false, P, DAY2 + 30_000)!;
    expect(again.visit).toBeNull(); // once a day
    const next = track("p", again.seen, false, P, DAY2 + 86_400_000)!;
    expect(next.visit).toEqual({ account: "p", day: "2026-10-16", first: "2026-10-15" });
    expect(next.seen.days).toBe(2);
  });

  test("play time adds up the gaps between syncs, not the time away", () => {
    let seen: unknown = undefined;
    let t = DAY2;
    for (let i = 0; i < 61; i++) {
      seen = track("p", seen, i === 0, P, t)!.seen;
      t += 10_000; // a sync every 10 s for 10 minutes
    }
    t += 3_600_000; // an hour away
    const back = track("p", seen, false, P, t)!;
    expect(back.seen.playMs).toBe(600_000);
    expect(back.player?.playMin).toBe(10); // written again: 5 minutes have passed
  });

  test("the player's row is written on a new day and every 5 minutes, not every sync", () => {
    const a = track("p", undefined, true, P, DAY2)!;
    expect(track("p", a.seen, false, P, DAY2 + 60_000)!.player).toBeNull();
    expect(track("p", a.seen, false, P, DAY2 + 5 * 60_000)!.player).not.toBeNull();
  });

  test("someone who played before the tracking began is active but in no cohort", () => {
    expect(track("old", undefined, false, P, DAY2)!.visit?.first).toBeNull();
  });

  test("nothing is written before the start day", () => {
    expect(track("p", undefined, true, P, Date.UTC(2026, 9, 13, 3))).toBeNull();
  });

  test("이탈: where the new players who have not played for 2 days stopped", () => {
    const row = (account: string, last: string, floor: number, step: number, playMin: number, days: number, first: string | null = "2026-10-14"): PlayerRow =>
      ({ account, first, last, days, floor, step, prestiges: 0, playMin });
    const rows = [
      row("a", "2026-10-14", 5, 1, 3, 1), // left on floor 5, step 2, after 3 minutes
      row("b", "2026-10-14", 8, 1, 12, 1), // left too
      row("c", "2026-10-17", 40, 6, 50, 3), // still playing
      row("old", "2026-10-14", 300, 20, 900, 9, null), // not a new player
    ];
    const r = churnReport(rows, Date.UTC(2026, 9, 17, 3));
    expect([r.newPlayers, r.churned]).toEqual([3, 2]);
    expect(r.byFloor[0]).toEqual({ label: "1~9층", all: 2, churned: 2 });
    expect(r.byStep.map((b) => [b.label.slice(0, 4), b.all, b.churned])).toEqual([["2단계:", 2, 2], ["7단계:", 1, 0]]);
    expect(churnTable(r.byPlay, "플레이 시간")).toEqual([
      { "플레이 시간": "5분 미만", 유저: 1, 이탈: 1, 이탈률: "100%" },
      { "플레이 시간": "5~15분", 유저: 1, 이탈: 1, 이탈률: "100%" },
      { "플레이 시간": "30분~1시간", 유저: 1, 이탈: 0, 이탈률: "0%" },
    ]);
  });

  test("the table runs from the start day to today; a return not due yet shows as -", () => {
    expect(retentionDays(DAY2)).toEqual(["2026-10-14", "2026-10-15"]);
    expect(retentionTable([{ day: "2026-10-14", newUsers: 20, active: 31, back: [9, null, null, null, null] }])).toEqual([
      { 날짜: "2026-10-14", 신규: 20, 접속: 31, D1: "45% (9)", D3: "-", D7: "-", D14: "-", D30: "-" },
    ]);
  });
});
