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

// What the save's user state remembers: the last day a visit was written, and the start day of a
// new player (null for one who was playing before the tracking began).
export interface Seen {
  last: string;
  first: string | null;
}

export function isAdmin(account: string): boolean {
  return ADMINS.includes(account.toLowerCase());
}

export function addDays(day: string, n: number): string {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}

function readSeen(raw: unknown): Seen | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.last !== "string") return null;
  return { last: r.last, first: typeof r.first === "string" ? r.first : null };
}

// A sync at `now`: the visit to write (null if today's is written already or tracking has not
// begun) and what to remember. `fresh`: the account had no save before this sync.
export function visitOf(account: string, rawSeen: unknown, fresh: boolean, now: number): { visit: Visit; seen: Seen } | null {
  const today = kstDay(now);
  if (today < RETENTION_FROM) return null;
  const seen = readSeen(rawSeen);
  if (seen?.last === today) return null;
  const first = seen ? seen.first : fresh ? today : null;
  return { visit: { account, day: today, first }, seen: { last: today, first } };
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
