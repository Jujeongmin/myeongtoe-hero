import { VXShop } from "@verse8/platform";

// The Verse8 VX Shop, for the VX products (shared/data/shop.ts). The purchase dialog is Verse8's own;
// what is bought arrives on the server ($onItemPurchased), so after the dialog closes the store
// syncs and the screen shows it.

// The Agent8 editor preview runs on its own host, which the SDK does not recognise as a preview,
// so there the dialog is opened with the PREVIEW stage spelled out.
const EDITOR_PREVIEW_HOST = /^agent8-container-v2-[a-z0-9-]+\.agent8\.verse8\.net$/;
const VERSE: string | undefined = import.meta.env.VITE_AGENT8_VERSE;

function inEditorPreview(): boolean {
  try {
    return EDITOR_PREVIEW_HOST.test(window.location.hostname.toLowerCase());
  } catch {
    return false;
  }
}

let started = false;

export function startShop(account: string): void {
  if (started || !VERSE) return;
  started = true;
  try {
    VXShop.init({ verseId: VERSE, account, autoRefresh: true });
  } catch {
    // Outside Verse8 the shop has nothing to talk to; prices fall back to the listed ones.
  }
}

export function buyProduct(productId: string): void {
  if (!VERSE) return;
  if (inEditorPreview() && window.parent !== window) {
    window.parent.postMessage({ type: "OPEN_VX_SHOP_DIALOG", payload: { verseId: VERSE, productId, stage: "PREVIEW" } }, "*");
    return;
  }
  try {
    VXShop.buyItem(productId);
  } catch {
    // No shop outside Verse8.
  }
}

// What a product costs in VX as the shop lists it; null when the shop does not know it.
export function productPrice(productId: string): number | null {
  try {
    return VXShop.getItem(productId)?.price ?? null;
  } catch {
    return null;
  }
}

// Called when the dialog for any product closes.
export function onShopClosed(listener: (productId: string, purchased: boolean) => void): () => void {
  try {
    return VXShop.onClose((payload) => listener(payload.productId, payload.purchased));
  } catch {
    return () => undefined;
  }
}
