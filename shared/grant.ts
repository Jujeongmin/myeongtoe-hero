import type { GameState } from "./state";

// 운영자 지급: an admin account (shared/retention.ts ADMINS) gives a player 보석, 상품권 or 응시권 from
// the browser console (grant(...), Server.grant). Whole numbers, each at most GRANT_MAX a time.
export interface Grant {
  gems: number;
  coupons: number;
  tickets: number;
}

export const GRANT_MAX = 1_000_000;
export const GRANTS = "grants";

function amount(v: unknown): number | null {
  if (v === undefined) return 0;
  return typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= GRANT_MAX ? v : null;
}

// What a console call asked for, or null if anything in it is wrong (or it gives nothing).
export function readGrant(raw: unknown): Grant | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const gems = amount(r.gems);
  const coupons = amount(r.coupons);
  const tickets = amount(r.tickets);
  if (gems === null || coupons === null || tickets === null || gems + coupons + tickets === 0) return null;
  return { gems, coupons, tickets };
}

export function applyGrant(s: GameState, g: Grant): GameState {
  return { ...s, gems: s.gems + g.gems, coupons: s.coupons + g.coupons, tickets: s.tickets + g.tickets };
}
