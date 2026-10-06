import { findProduct, grantPurchase } from "./data/shop";
import { fromSave, newState, toSave, type SaveData } from "./state";

// What Verse8 sends to the server's $onItemPurchased when a VX Shop purchase completes.
export interface PurchaseEvent {
  account: string;
  purchaseId: string;
  productId: string;
  quantity: number;
}

export function readPurchaseEvent(value: unknown): PurchaseEvent | null {
  if (!value || typeof value !== "object") return null;
  const e = value as Record<string, unknown>;
  const purchaseId = typeof e.purchaseId === "string" || typeof e.purchaseId === "number" ? String(e.purchaseId).trim() : "";
  if (typeof e.account !== "string" || e.account === "" || purchaseId === "" || purchaseId.length > 200) return null;
  if (typeof e.productId !== "string" || !Number.isInteger(e.quantity) || (e.quantity as number) < 1) return null;
  return { account: e.account, purchaseId, productId: e.productId, quantity: e.quantity as number };
}

// Receipts already paid, newest last; the oldest drop off past this many.
export const RECEIPTS_KEPT = 500;

export type PurchaseOutcome =
  | { code: "granted"; save: SaveData; receipts: string[] }
  | { code: "already_granted" }
  | { code: "unknown_product" };

// The whole of a purchase with no I/O: the stored save (undefined for a player who has none yet)
// and receipts in, the new ones out. The same purchaseId pays once however often it arrives.
export function applyPurchase(raw: unknown, receipts: unknown, event: PurchaseEvent, now: number): PurchaseOutcome {
  const paid = Array.isArray(receipts) ? receipts.filter((r): r is string => typeof r === "string") : [];
  if (paid.includes(event.purchaseId)) return { code: "already_granted" };
  if (!findProduct(event.productId)) return { code: "unknown_product" };
  const state = raw === undefined || raw === null ? newState(now) : fromSave(raw);
  const after = grantPurchase(state, event.productId, event.quantity, now);
  return { code: "granted", save: toSave(after), receipts: [...paid, event.purchaseId].slice(-RECEIPTS_KEPT) };
}
