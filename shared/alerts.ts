import { AD_PLACEMENTS, adReadyAt } from "./data/ads";
import { DAILY_QUESTS } from "./data/dailyQuests";
import { dailyVxClaimed, dailyVxGems } from "./data/shop";
import { dailyOf } from "./daily";
import { parkPassMax } from "./mods";
import type { GameState } from "./state";

// 빨간 점: a red dot on a bottom tab says a free reward or a free action is waiting there (a
// rewarded ad off cooldown, the daily VX gems, a parking pass to use, a finished daily quest), so
// the player taps it. Upgrades and purchases get none: something can nearly always be bought, so
// such a dot would never go out (their buttons turn red instead). The rules read the save only.
// Whether a dot shows also depends on whether the player has looked since it appeared
// (src/ui/useAlerts.ts): a dot clears when its screen is opened and comes back the next time its
// thing becomes possible again. (The menu's 미션 dot and the 연봉협상 button's are in Battle.)
export type AlertKey = "shop:ad" | "shop:daily" | "dungeon:enter" | "dungeon:quest";

export const ALERT_KEYS: readonly AlertKey[] = ["shop:ad", "shop:daily", "dungeon:enter", "dungeon:quest"];

// The floor each bottom tab opens at (BottomNav shows it locked before).
export const NAV_OPEN_AT = { sideJobs: 1, gear: 1, pets: 100, certs: 11, shop: 1, dungeon: 5 } as const;

// Where each dot is cleared: a bottom tab. Opening that screen counts as looking.
export const alertScreens: Record<AlertKey, string> = {
  "shop:ad": "tab:shop",
  "shop:daily": "tab:shop",
  "dungeon:enter": "tab:dungeon",
  "dungeon:quest": "tab:dungeon",
};

// The rewarded ads the shop's 광고 보상 tab lists (the speed and buff ads live on the battle screen).
const SHOP_ADS = new Set(["ad_gems", "ad_gold", "ad_coupons", "ad_parking"]);

export function activeAlerts(s: GameState): Record<AlertKey, boolean> {
  const dungeon = s.bestFloor >= NAV_OPEN_AT.dungeon;
  const running = s.parking.runUntil > s.lastTick || !s.parking.claimed;
  const today = dailyOf(s);
  return {
    "shop:ad": AD_PLACEMENTS.some((ad) => {
      if (!SHOP_ADS.has(ad.id) || adReadyAt(s, ad) > s.lastTick) return false;
      return ad.id !== "ad_parking" || s.parking.passes < parkPassMax(s);
    }),
    "shop:daily": dailyVxGems(s) > 0 && !dailyVxClaimed(s),
    "dungeon:enter": dungeon && s.parking.passes > 0 && !running,
    "dungeon:quest": dungeon && DAILY_QUESTS.some((q) => !today.claimed.includes(q.id) && (q.kind === "entries" ? today.entries : today.bestDepth) >= q.goal),
  };
}
