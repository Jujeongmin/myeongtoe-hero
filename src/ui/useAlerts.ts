import { useRef } from "react";
import { ALERT_KEYS, activeAlerts, alertScreens, type AlertKey } from "../../shared/alerts";
import type { GameState } from "../../shared/state";

// Which red dots show (shared/alerts.ts says what is possible): one stays off while its screen is
// open and after it was opened, until the thing stops being possible and then is again, so a dot
// means "something new to do here" and never sits on forever.
export interface Dots {
  tabs: Record<string, boolean>; // bottom tabs by id ("pets", "shop", …)
  sheets: Record<string, boolean>; // menu panels by id ("suits", "office", …)
}

export function useAlerts(state: GameState | null, tab: string, sheet: string | null): Dots {
  const seen = useRef(new Set<AlertKey>());
  const dots: Dots = { tabs: {}, sheets: {} };
  if (!state) return dots;
  const active = activeAlerts(state);
  const looking = new Set([`tab:${tab}`, sheet ? `sheet:${sheet}` : ""]);
  for (const key of ALERT_KEYS) {
    if (!active[key]) {
      seen.current.delete(key);
      continue;
    }
    const screen = alertScreens[key];
    if (looking.has(screen)) seen.current.add(key);
    if (seen.current.has(key)) continue;
    const [kind, id] = screen.split(":");
    (kind === "tab" ? dots.tabs : dots.sheets)[id] = true;
  }
  return dots;
}
