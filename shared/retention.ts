import { STEP_MISSIONS } from "./data/missions";
import { kstDay } from "./time";

// 리텐션: the server writes one "visits" item per account per day it plays (KST), from
// RETENTION_FROM on. An account first seen on or after that day with no save yet is a new player,
// and every visit of theirs carries `first`, the day they started; older players' visits have
// first = null (counted as active, never in a cohort). The admin accounts can ask the server for
// the table (Server.retention), from the browser console: retention().
export const ADMINS: readonly string[] = ["0x7b47aa40357441418909f83728da906b7c85d261"];
export const RETENTION_FROM = "2026-10-14";
export const RETENTION_DAYS: readonly number[] = [1, 3, 7, 14, 30];
// The table covers at most this many days back from today.
export const RETENTION_SPAN = 45;
export const VISITS = "visits";

export interface Visit {
  account: string;
  day: string;
  first: string | null;
}

// What the account's user state remembers: the last day a visit was written, the start day of a
// new player (null for one who was playing before the tracking began), the days played, the play
// time, the last sync, and when its "players" row was last written.
export interface Seen {
  last: string;
  first: string | null;
  days: number;
  playMs: number;
  at: number;
  wrote: number;
}

// One row a player in the "players" collection (id: the account), for 이탈 시점: where each player
// was the last time they played.
export interface PlayerRow {
  account: string;
  first: string | null;
  last: string;
  days: number;
  floor: number;
  step: number;
  prestiges: number;
  playMin: number;
}

export const PLAYERS = "players";
// A sync this soon after the one before counts the time between as play.
export const PLAY_GAP_MS = 90_000;
// A player's row is rewritten on a new day and at most this often while they play.
export const PLAYER_WRITE_MS = 5 * 60_000;

export function isAdmin(account: string): boolean {
  return ADMINS.includes(account.toLowerCase());
}

export function addDays(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}

function num(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

function readSeen(raw: unknown): Seen | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.last !== "string") return null;
  return {
    last: r.last, first: typeof r.first === "string" ? r.first : null,
    days: num(r.days, 1), playMs: num(r.playMs, 0), at: num(r.at, 0), wrote: num(r.wrote, 0),
  };
}

// A sync at `now`: what to remember, the day's visit to write (null if written already), and the
// player's row to write (null if written lately). Null before tracking begins. `fresh`: the account
// had no save before this sync.
export function track(
  account: string, rawSeen: unknown, fresh: boolean, progress: { floor: number; step: number; prestiges: number }, now: number,
): { seen: Seen; visit: Visit | null; player: PlayerRow | null } | null {
  const today = kstDay(now);
  if (today < RETENTION_FROM) return null;
  const prev = readSeen(rawSeen);
  const newDay = prev?.last !== today;
  const first = prev ? prev.first : fresh ? today : null;
  const gap = prev ? now - prev.at : 0;
  const seen: Seen = {
    last: today, first, days: (prev?.days ?? 0) + (newDay ? 1 : 0),
    playMs: (prev?.playMs ?? 0) + (gap > 0 && gap < PLAY_GAP_MS ? gap : 0), at: now, wrote: prev?.wrote ?? 0,
  };
  const writePlayer = newDay || now - seen.wrote >= PLAYER_WRITE_MS;
  if (writePlayer) seen.wrote = now;
  return {
    seen,
    visit: newDay ? { account, day: today, first } : null,
    player: writePlayer
      ? { account, first, last: today, days: seen.days, ...progress, playMin: Math.round(seen.playMs / 60_000) }
      : null,
  };
}

// One cohort's row: the day, how many started that day, how many played that day in all, and for
// each of RETENTION_DAYS how many of the cohort came back that many days later (null: not yet).
export interface RetentionRow {
  day: string;
  newUsers: number;
  active: number;
  back: (number | null)[];
}

// The days the table covers, oldest first.
export function retentionDays(now: number): string[] {
  const today = kstDay(now);
  const out: string[] = [];
  for (let day = today, i = 0; day >= RETENTION_FROM && i < RETENTION_SPAN; day = addDays(day, -1), i++) out.unshift(day);
  return out;
}

// For the console: one line per day, each return as "45% (9)".
export function retentionTable(rows: readonly RetentionRow[]): Record<string, string | number>[] {
  return rows.map((r) => {
    const line: Record<string, string | number> = { 날짜: r.day, 신규: r.newUsers, 접속: r.active };
    RETENTION_DAYS.forEach((n, i) => {
      const b = r.back[i];
      line[`D${n}`] = b === null ? "-" : r.newUsers === 0 ? "0" : `${Math.round((b / r.newUsers) * 100)}% (${b})`;
    });
    return line;
  });
}

// ---- 이탈 시점 ----

// A new player who has not played for this many days has left (이탈).
export const CHURN_DAYS = 2;

// How many new players are in a group (all) and how many of them have left (churned).
export interface Bucket {
  label: string;
  all: number;
  churned: number;
}

export interface ChurnReport {
  newPlayers: number;
  churned: number;
  byFloor: Bucket[];
  byStep: Bucket[];
  byPlay: Bucket[];
  byDays: Bucket[];
}

const FLOORS: readonly [number, number][] = [[1, 9], [10, 29], [30, 49], [50, 69], [70, 99], [100, 149], [150, 199], [200, 299], [300, Infinity]];
const PLAY: readonly [number, number, string][] = [
  [0, 5, "5분 미만"], [5, 15, "5~15분"], [15, 30, "15~30분"], [30, 60, "30분~1시간"], [60, 180, "1~3시간"], [180, Infinity, "3시간 이상"],
];
const DAYS: readonly [number, number, string][] = [[1, 1, "1일"], [2, 2, "2일"], [3, 6, "3~6일"], [7, Infinity, "7일 이상"]];

// Where the new players are (their best floor, step mission, play time, days played) and how many
// in each place have left: the places where many leave are where the game loses them.
export function churnReport(rows: readonly PlayerRow[], now: number): ChurnReport {
  const players = rows.filter((r) => r.first !== null);
  const cutoff = addDays(kstDay(now), -CHURN_DAYS);
  const left = (r: PlayerRow) => r.last <= cutoff;
  const group = (label: string, inIt: (r: PlayerRow) => boolean): Bucket => {
    const all = players.filter(inIt);
    return { label, all: all.length, churned: all.filter(left).length };
  };
  const steps = [...new Set(players.map((r) => r.step))].sort((a, b) => a - b);
  return {
    newPlayers: players.length,
    churned: players.filter(left).length,
    byFloor: FLOORS.map(([lo, hi]) => group(hi === Infinity ? `${lo}층+` : `${lo}~${hi}층`, (r) => r.floor >= lo && r.floor <= hi)),
    byStep: steps.map((n) => group(`${n + 1}단계: ${STEP_MISSIONS[n]?.text ?? "모두 완료"}`, (r) => r.step === n)),
    byPlay: PLAY.map(([lo, hi, label]) => group(label, (r) => r.playMin >= lo && r.playMin < hi)),
    byDays: DAYS.map(([lo, hi, label]) => group(label, (r) => r.days >= lo && r.days <= hi)),
  };
}

// For the console: one table per grouping, empty groups left out.
export function churnTable(buckets: readonly Bucket[], name: string): Record<string, string | number>[] {
  return buckets.filter((b) => b.all > 0).map((b) => ({
    [name]: b.label, 유저: b.all, 이탈: b.churned, 이탈률: `${Math.round((b.churned / b.all) * 100)}%`,
  }));
}
