import { Verse8Ads } from "@verse8/ads";

// Verse8 rewarded ads, the only place the game talks to the ad SDK. The reward itself is the
// `watchAd` intent, paid by the server on its cooldown; this only shows the ad.
export type AdOutcome = "rewarded" | "skipped" | "unavailable";

let unsupported = false;

// Opens the handshake with the host early, so the first ad does not wait for it.
export function initAds(): void {
  try {
    Verse8Ads.init();
  } catch {
    // Nothing to talk to (outside Verse8); showAd says so when pressed.
  }
}

// Shows one rewarded ad for a placement. The dev server has no ad host, so there it counts as
// watched at once, which lets the buttons be tried.
export async function showAd(placementId: string): Promise<AdOutcome> {
  if (import.meta.env.DEV) return "rewarded";
  try {
    const result = await Verse8Ads.showRewarded({ placementId });
    if (result.status === "rewarded") return "rewarded";
    if (result.status === "failed" && result.error.code === "unsupported_env") {
      unsupported = true;
      return "unavailable";
    }
    return "skipped";
  } catch {
    return "unavailable";
  }
}

// False once the host has said it cannot show ads at all.
export function adsAvailable(): boolean {
  return !unsupported;
}
