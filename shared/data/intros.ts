import type { GameState } from "../state";
import { apartmentCost, officeUpgradeCost } from "./home";
import { relicsUnlocked } from "./relics";
import { ROOKIE_OFFER_STEP } from "./shop";

// 새 기능 안내: the menu's 아파트, 퇴직 기념품 and 사무용품 are easy to miss, so each is introduced
// once in a popup the first time it can be used (and not before the guided first steps are over):
// 아파트 when the gems pay for a pyeong, 기념품 when the first one arrives (1000층), 사무용품 when the
// coupons pay for an upgrade. One already in use needs no introduction. `seen` lists the ones shown.
export type FeatureId = "apartment" | "relics" | "office";

export const FEATURE_INTRO_ORDER: readonly FeatureId[] = ["apartment", "office", "relics"];

export function featureIntroToShow(s: GameState, seen: readonly string[]): FeatureId | undefined {
  if (s.missions.step < ROOKIE_OFFER_STEP) return undefined;
  const ready: Record<FeatureId, boolean> = {
    apartment: s.apartment === 0 && s.gems >= apartmentCost(0),
    relics: Object.keys(s.relics).length === 0 && relicsUnlocked(s.bestFloor).length > 0,
    office: Object.values(s.office).every((g) => g <= 1) && s.coupons >= officeUpgradeCost(1),
  };
  return FEATURE_INTRO_ORDER.find((id) => ready[id] && !seen.includes(id));
}
