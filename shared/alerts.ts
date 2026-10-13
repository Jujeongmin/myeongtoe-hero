import { AD_PLACEMENTS, adReadyAt } from "./data/ads";
import { CERTS, certLevelCost, certOpen } from "./data/certs";
import { AURAS, LEGENDS, LEGEND_MAX_LEVEL, SUIT_ITEMS, auraOpen, legendOpen } from "./data/costumes";
import { DAILY_QUESTS } from "./data/dailyQuests";
import { GEAR_MAX_LEVEL, GEAR_TIERS, gearConfirmCost } from "./data/gear";
import { apartmentCost, officeUpgradeCost } from "./data/home";
import { PET_BOX_COUPONS, PETS, petLevelCost, petsUnlocked } from "./data/pets";
import { relicLevelCost, relicsUnlocked } from "./data/relics";
import { SIDE_JOBS } from "./data/sideJobs";
import { dailyVxClaimed, dailyVxGems } from "./data/shop";
import { dailyOf } from "./daily";
import { parkPassMax, petLevel, relicLevel } from "./mods";
import { gearPriceFor, sideJobCostFor } from "./prices";
import { OFFICE_MAX_GRADE, type GameState } from "./state";

// 빨간 점: a red dot on a menu button or tab says there is something to do there right now that the
// gold, gems, coupons or tickets pay for (or a free reward is waiting), so the player taps it. The
// rules read the save only. Whether a dot shows also depends on whether the player has looked since
// it appeared (src/ui/useAlerts.ts): a dot clears when its screen is opened and comes back the next
// time its thing becomes possible again.
export type AlertKey =
  | "sideJobs:start" | "gear:buy" | "gear:confirm" | "pets:box" | "pets:level" | "certs:buy"
  | "shop:ad" | "shop:daily" | "dungeon:enter" | "dungeon:quest"
  | "suits" | "apartment" | "relics" | "office";

export const ALERT_KEYS: readonly AlertKey[] = [
  "sideJobs:start", "gear:buy", "gear:confirm", "pets:box", "pets:level", "certs:buy",
  "shop:ad", "shop:daily", "dungeon:enter", "dungeon:quest",
  "suits", "apartment", "relics", "office",
];

// The floor each bottom tab opens at (BottomNav shows it locked before).
export const NAV_OPEN_AT = { sideJobs: 1, gear: 1, pets: 100, certs: 11, shop: 1, dungeon: 5 } as const;

// Where each dot is cleared: a bottom tab or a menu panel. Opening that screen counts as looking.
export const alertScreens: Record<AlertKey, string> = {
  "sideJobs:start": "tab:sideJobs",
  "gear:buy": "tab:gear",
  "gear:confirm": "tab:gear",
  "pets:box": "tab:pets",
  "pets:level": "tab:pets",
  "certs:buy": "tab:certs",
  "shop:ad": "tab:shop",
  "shop:daily": "tab:shop",
  "dungeon:enter": "tab:dungeon",
  "dungeon:quest": "tab:dungeon",
  suits: "sheet:suits",
  apartment: "sheet:apartment",
  relics: "sheet:relics",
  office: "sheet:office",
};

// The rewarded ads the shop's 광고 보상 tab lists (the speed and buff ads live on the battle screen).
const SHOP_ADS = new Set(["ad_gems", "ad_gold", "ad_coupons", "ad_parking"]);

export function activeAlerts(s: GameState): Record<AlertKey, boolean> {
  const open = (tab: keyof typeof NAV_OPEN_AT) => s.bestFloor >= NAV_OPEN_AT[tab];
  const out = Object.fromEntries(ALERT_KEYS.map((k) => [k, false])) as Record<AlertKey, boolean>;

  // A job not started yet that the gold pays for (the cheapest unstarted one is the first in order).
  const next = SIDE_JOBS.find((j) => (s.sideJobs[j.id]?.level ?? 0) === 0 && s.run.maxFloor >= j.unlockFloor);
  out["sideJobs:start"] = open("sideJobs") && !!next && s.gold.gte(sideJobCostFor(s, next, 0));

  // The next gear once this one is Lv5; 구매확정 once a tier at Lv5 is waiting for it.
  const tier = s.gear.tier;
  out["gear:buy"] = open("gear") && tier + 1 < GEAR_TIERS.length && s.gear.level >= GEAR_MAX_LEVEL && s.gold.gte(gearPriceFor(s, tier + 1));
  const sure = s.gear.confirmed;
  if (open("gear") && sure < GEAR_TIERS.length && (tier > sure || (tier === sure && s.gear.level >= GEAR_MAX_LEVEL))) {
    const cost = gearConfirmCost(sure);
    out["gear:confirm"] = s.gems >= cost.gems && s.gold.gte(cost.gold);
  }

  // Coworkers: the box, a level-up.
  const joined = petsUnlocked(s.bestFloor);
  out["pets:box"] = joined.length > 0 && s.coupons >= PET_BOX_COUPONS;
  out["pets:level"] = PETS.some((p) => joined.includes(p) && s.gems >= petLevelCost(petLevel(s, p.id)));

  // Certificates: any open one its currency pays a level of.
  out["certs:buy"] = open("certs") && CERTS.some((c) => {
    const level = s.certs[c.id] ?? 0;
    return level < c.maxLevel && certOpen(c, s.certs) && (c.currency === "gems" ? s.gems : s.tickets) >= certLevelCost(c, level);
  });

  // Shop: a free reward waiting.
  out["shop:ad"] = AD_PLACEMENTS.some((ad) => {
    if (!SHOP_ADS.has(ad.id) || adReadyAt(s, ad) > s.lastTick) return false;
    return ad.id !== "ad_parking" || s.parking.passes < parkPassMax(s);
  });
  out["shop:daily"] = dailyVxGems(s) > 0 && !dailyVxClaimed(s);

  // Dungeon: a pass to use, a finished daily quest to collect.
  const running = s.parking.runUntil > s.lastTick || !s.parking.claimed;
  out["dungeon:enter"] = open("dungeon") && s.parking.passes > 0 && !running;
  const today = dailyOf(s);
  out["dungeon:quest"] = open("dungeon") && DAILY_QUESTS.some((q) => !today.claimed.includes(q.id) && (q.kind === "entries" ? today.entries : today.bestDepth) >= q.goal);

  // Menu panels.
  out.suits =
    SUIT_ITEMS.some((i) => !s.suits.includes(i.id) && s.coupons >= i.price) ||
    AURAS.some((a) => !s.costume.auras.includes(a.set) && auraOpen(s.suits, a.set) && s.gems >= a.gems) ||
    LEGENDS.some((l) => legendOpen(s.suits, l.part) && (s.costume.legend[l.part] ?? 0) < LEGEND_MAX_LEVEL && s.coupons >= l.coupons);
  out.apartment = s.gems >= apartmentCost(s.apartment);
  out.relics = relicsUnlocked(s.bestFloor).some((r) => s.gems >= relicLevelCost(relicLevel(s, r.id)));
  out.office = Object.values(s.office).some((grade) => grade < OFFICE_MAX_GRADE && s.coupons >= officeUpgradeCost(grade));
  return out;
}
