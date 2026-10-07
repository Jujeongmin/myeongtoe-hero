import { useLayoutEffect, useRef } from "react";
import { SPECIAL_MISSIONS, STEP_MISSIONS } from "../../shared/data/missions";
import type { GameState } from "../../shared/state";
import { kstDay } from "../../shared/time";
import type { GameStore } from "../game/store";
import { t } from "../i18n";
import type { NavTab } from "./BottomNav";
import { RewardView } from "./Amount";

// Where a step mission is done: a bottom tab or a panel opened from the battle screen. Floor goals
// go to the gear tab (a stronger tool is what gets Park higher).
export type MissionPlace = { tab: NavTab } | { sheet: "suits" | "apartment" | "prestige" };

const PLACES: Record<string, MissionPlace> = {
  s01: { tab: "sideJobs" }, s02: { tab: "gear" }, s03: { tab: "gear" }, s04: { tab: "gear" },
  s05: { tab: "gear" }, s06: { tab: "gear" }, s07: { tab: "certs" }, s08: { tab: "dungeon" },
  s09: { tab: "gear" }, s10: { tab: "sideJobs" }, s11: { tab: "gear" }, s12: { sheet: "suits" },
  s13: { tab: "gear" }, s14: { sheet: "prestige" }, s15: { tab: "pets" }, s16: { sheet: "apartment" },
  s17: { tab: "gear" }, s18: { tab: "certs" }, s19: { tab: "gear" }, s20: { sheet: "prestige" },
};

// Something waiting in the mission panel: attendance today or a finished 특수 임무.
export function missionsWaiting(state: GameState): boolean {
  const attend = state.attendance.lastDay !== kstDay(state.lastTick);
  return attend || SPECIAL_MISSIONS.some((m) => m.done(state) && !state.missions.special.includes(m.id));
}

// One line, never cut: the font steps down a pixel at a time until the text fits.
function useFitText(text: string) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    for (let px = 12; px >= 7; px--) {
      el.style.fontSize = `${px}px`;
      if (el.scrollWidth <= el.clientWidth) break;
    }
  }, [text]);
  return ref;
}

// Bottom right of the battle screen: the current step mission. Done, it pays in place; not yet,
// tapping it goes to where it is done.
export function MissionCard({ state, store, onGo }: { state: GameState; store: GameStore; onGo: (p: MissionPlace) => void }) {
  const step = state.missions.step;
  const m = STEP_MISSIONS[step];
  if (!m) return null;
  const done = m.done(state);
  const place = PLACES[m.id];
  const text = t("{step}단계 · {mission}", { step: step + 1, mission: t(m.text, m.vars) });
  const line = useFitText(text);
  return (
    <div
      className={`mission-card${done ? " done" : ""}`}
      onClick={() => (done ? store.do({ k: "claimStep" }) : place && onGo(place))}
    >
      <div className="mission-line" ref={line}>{text}</div>
      {done && <div className="claim">{t("받기")} <RewardView reward={m.reward} /></div>}
    </div>
  );
}
