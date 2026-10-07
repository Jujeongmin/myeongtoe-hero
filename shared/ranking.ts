import type { GameState, SaveData } from "./state";
import type { Text } from "./text";

// Rankings: by best floor, and by deepest parking run. Each account has one row, kept by the server whenever its record goes up.
export type Board = "floor" | "depth";
export const RANKING_SIZE = 50;

export interface RankRow {
  account: string;
  nickname: string;
  floor: number;
  depth: number;
}

export interface RankingView {
  board: Board;
  rows: RankRow[];
  mine: RankRow | null;
}

// 2–8 of: Hangul, Latin letters, digits, Japanese kana (and ー), CJK ideographs (Chinese/Japanese).
const NICKNAME = /^[가-힣a-zA-Z0-9ぁ-ゖァ-ヺー一-鿿]{2,8}$/;

export function readNickname(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.trim();
  return NICKNAME.test(name) ? name : null;
}

export function readBoard(raw: unknown): Board | null {
  return raw === "floor" || raw === "depth" ? raw : null;
}

// As a pattern for t(): the nickname as it is, or 직원 and the account's last 4.
export function displayName(row: RankRow): Text {
  return row.nickname ? { key: "{name}", vars: { name: row.nickname } } : { key: "직원 {id}", vars: { id: row.account.slice(-4) } };
}

export function rankRowOf(account: string, s: Pick<GameState | SaveData, "nickname" | "bestFloor" | "parking">): RankRow {
  return { account, nickname: s.nickname, floor: s.bestFloor, depth: s.parking.best };
}
