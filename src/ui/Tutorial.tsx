import { useEffect, useRef } from "react";
import { STEP_MISSIONS } from "../../shared/data/missions";
import type { GameState } from "../../shared/state";
import { imageUrl } from "../game/sprites";
import { t } from "../i18n";
import type { NavTab } from "./BottomNav";

// The first steps, shown with Park's pen: it taps the button the current step mission needs (the
// tab first, then the button in it), and once a step is done, the mission card that pays it out.
// Nothing is blocked; the pen just goes away once the guided steps are over.
interface Aim { at: string; hint: string }

const NAV = (tab: NavTab) => `[data-tut="nav-${tab}"]`;

function aimFor(state: GameState, tab: NavTab): Aim | null {
  const m = STEP_MISSIONS[state.missions.step];
  if (!m) return null;
  const guided = ["s01", "s02", "s03", "s04", "s07", "s08"];
  if (!guided.includes(m.id)) return null;
  if (m.done(state)) return { at: ".mission-card", hint: t("미션 완료! 눌러서 보상을 받자") };
  const inTab = (want: NavTab, at: string, hint: string): Aim => (tab === want ? { at, hint } : { at: NAV(want), hint });
  switch (m.id) {
    case "s01": return inTab("sideJobs", '[data-tut="job-j00"]', t("부업부터 시작하자. 월급만으론 안 돼…"));
    case "s02": return inTab("gear", '[data-tut="gear-up"]', t("볼펜부터 손보자. 장비가 곧 공격력이다"));
    case "s03":
    case "s04": return inTab("gear", '[data-tut="gear-buy"], [data-tut="gear-up"]', t("골드가 모이면 다음 장비로 바꾸자"));
    case "s07": return inTab("certs", '[data-tut="cert"]:not(:disabled), [data-tut="cert"]', t("응시권으로 자격증을 따 두자"));
    case "s08": return inTab("dungeon", '[data-tut="park-enter"]', t("주차권으로 지하주차장을 탐사해 보자"));
    default: return null;
  }
}

// Anything over the game (a sheet, the webtoon, a popup) hides the pen.
const COVERS = ".modal-back, .story, .welcome, .screen-lock";

export function Tutorial({ state, tab }: { state: GameState; tab: NavTab }) {
  const aim = aimFor(state, tab);
  const box = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLSpanElement>(null);
  const seen = useRef("");

  useEffect(() => {
    const el = box.current;
    if (!el || !aim) return;
    let raf = 0;
    const place = () => {
      raf = requestAnimationFrame(place);
      // `at` lists the choices in order of preference.
      const target = aim.at.split(", ").map((q) => document.querySelector<HTMLElement>(q)).find((e) => e) ?? null;
      if (!target || document.querySelector(COVERS)) {
        el.hidden = true;
        return;
      }
      if (seen.current !== aim.at) {
        seen.current = aim.at;
        target.scrollIntoView({ block: "nearest" });
      }
      const r = target.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      // The game's column (on a PC it is narrower than the window).
      const game = document.querySelector(".phone")?.getBoundingClientRect() ?? new DOMRect(0, 0, window.innerWidth, window.innerHeight);
      // The pen comes from below right; near the bottom or the right edge it comes from the other
      // side, so it stays on screen.
      el.classList.toggle("up", y > game.top + game.height * 0.6);
      el.classList.toggle("left", x > game.left + game.width / 2);
      el.style.left = `${Math.round(x)}px`;
      el.style.top = `${Math.round(y)}px`;
      el.hidden = false;
      // The line keeps inside the column, slid sideways if it would run off either edge.
      const h = hint.current;
      if (h) {
        h.style.translate = "";
        const b = h.getBoundingClientRect();
        const dx = b.right > game.right - 4 ? game.right - 4 - b.right : b.left < game.left + 4 ? game.left + 4 - b.left : 0;
        if (dx) h.style.translate = `${Math.round(dx)}px 0`;
      }
    };
    place();
    return () => cancelAnimationFrame(raf);
  }, [aim?.at]);

  if (!aim) return null;
  return (
    <div ref={box} className="tutorial" hidden>
      <img src={imageUrl("ui/tutorial_pen.png")} alt="" draggable={false} />
      <span ref={hint} className="tutorial-hint">{aim.hint}</span>
    </div>
  );
}
