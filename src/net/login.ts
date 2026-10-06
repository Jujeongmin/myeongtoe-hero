import { getUser } from "@verse8/platform";

// Whether the player is logged in to Verse8. A guest plays on an address made for this visit, so
// their save cannot be found again next time. "unknown" outside Verse8 (no login token at all).
export type LoginState = "member" | "guest" | "unknown";

export function loginState(): LoginState {
  try {
    getUser({ requireTrustedSigner: true });
    return "member";
  } catch {
    try {
      getUser();
      return "guest";
    } catch {
      return "unknown";
    }
  }
}
