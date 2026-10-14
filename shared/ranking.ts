import { SUIT_ITEMS, hasCostume } from "./data/costumes";
import { isRude } from "./profanity";
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
  return nicknameError(raw) ? null : (raw as string).trim();
}

// Why a nickname is refused: not 2–8 allowed characters, or a word it may not contain (profanity.ts).
export function nicknameError(raw: unknown): "bad_nickname" | "rude_nickname" | null {
  if (typeof raw !== "string" || !NICKNAME.test(raw.trim())) return "bad_nickname";
  return isRude(raw.trim()) ? "rude_nickname" : null;
}

export function readBoard(raw: unknown): Board | null {
  return raw === "floor" || raw === "depth" ? raw : null;
}

// As a pattern for t(): the nickname as it is, or 직원 and the account's last 4 (also for a rude
// nickname saved before the filter).
export function displayName(row: RankRow): Text {
  return row.nickname && !isRude(row.nickname) ? { key: "{name}", vars: { name: row.nickname } } : { key: "직원 {id}", vars: { id: row.account.slice(-4) } };
}

export function rankRowOf(account: string, s: Pick<GameState | SaveData, "nickname" | "bestFloor" | "parking">): RankRow {
  return { account, nickname: s.nickname, floor: s.bestFloor, depth: s.parking.best };
}

// What anyone on the boards can see of a player (tap a row): the records, and Park as they dressed
// him (only pieces they own) with the tool in hand.
export interface PublicProfile {
  account: string;
  nickname: string;
  floor: number;
  depth: number;
  prestiges: number;
  gearTier: number;
  wear: Record<string, string>;
  costumes: number;
  costumesAll: number;
}

export function profileOf(account: string, s: GameState): PublicProfile {
  const wear: Record<string, string> = {};
  for (const [part, id] of Object.entries(s.wear)) if (hasCostume(s, id)) wear[part] = id;
  return {
    account, nickname: s.nickname, floor: s.bestFloor, depth: s.parking.best, prestiges: s.prestiges,
    gearTier: s.gear.tier, wear, costumes: s.suits.length, costumesAll: SUIT_ITEMS.length,
  };
}

// An account id as a caller may send it.
export function readAccount(raw: unknown): string | null {
  return typeof raw === "string" && raw.length > 0 && raw.length <= 128 ? raw : null;
}
