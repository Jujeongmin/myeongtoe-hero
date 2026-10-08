import { useEffect, useRef } from "react";
import { STEP_MISSIONS } from "../../shared/data/missions";
import type { GameState } from "../../shared/state";
import { imageUrl } from "../game/sprites";
import { t } from "../i18n";
import type { NavTab } from "./BottomNav";

// The first steps, shown with Park's pen: it taps the button the current step mission needs (the
// tab first, then the button in it), and once a step is done, the mission card that pays it out.
// When that button can be pressed now, the rest of the screen goes dark and can't be touched;
// while it waits for gold, nothing is blocked. Only the first few missions are guided.
interface Aim { at: string; hint: string }

const NAV = (tab: NavTab) => `[data-tut="nav-${tab}"]`;

function aimFor(state: GameState, tab: NavTab): Aim | null {
  const m = STEP_MISSIONS[state.missions.step];
  if (!m) return null;
  const guided = ["s01", "s01b", "s02", "s02b", "s03"];
  if (!guided.includes(m.id)) return null;
  if (m.done(state)) return { at: ".mission-card", hint: t("미션 완료! 눌러서 보상을 받자") };
  const inTab = (want: NavTab, at: string, hint: string): Aim => (tab === want ? { at, hint } : { at: NAV(want), hint });
  switch (m.id) {
    case "s01": return inTab("sideJobs", '[data-tut="job-j00"]', t("부업부터 시작하자. 월급만으론 안 돼…"));
    case "s01b": return inTab("sideJobs", '[data-tut="job-j00"]', t("알바 레벨을 올리면 수입이 늘어난다"));
    case "s02b": return inTab("sideJobs", '[data-tut="job-j01"]', t("부업을 하나 더 뛰자"));
    case "s02": return inTab("gear", '[data-tut="gear-up"]', t("볼펜부터 손보자. 장비가 곧 공격력이다"));
    case "s03": return inTab("gear", '[data-tut="gear-buy"], [data-tut="gear-up"]', t("골드가 모이면 다음 장비로 바꾸자"));
    default: return null;
  }
}

// Anything over the game (a sheet, the webtoon, a popup) hides the pen.
const COVERS = ".modal-back, .story, .welcome, .screen-lock";

export function Tutorial({ state, tab }: { state: GameState; tab: NavTab }) {
  const aim = aimFor(state, tab);
  const box = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLSpanElement>(null);
  const shades = useRef<(HTMLDivElement | null)[]>([]);
  const seen = useRef("");

  useEffect(() => {
    const el = box.current;
    if (!el || !aim) return;
    let raf = 0;
    const place = () => {
      raf = requestAnimationFrame(place);
      // `at` lists the choices in order of preference.
      const target = aim.at.split(", ").map((q) => document.querySelector<HTMLElement>(q)).find((e) => e) ?? null;
      const shade = (rects: [number, number, number, number][] | null) =>
        shades.current.forEach((d, i) => {
          if (!d) return;
          const r = rects?.[i];
          d.hidden = !r;
          if (r) Object.assign(d.style, { left: `${r[0]}px`, top: `${r[1]}px`, width: `${Math.max(0, r[2])}px`, height: `${Math.max(0, r[3])}px` });
        });
      if (!target || document.querySelector(COVERS)) {
        el.hidden = true;
        shade(null);
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
      // Dark around the button (four panels that also catch every other touch), only while it can
      // be pressed.
      if ((target as HTMLButtonElement).disabled) shade(null);
      else {
        const p = 4;
        const [l, tp, rt, b] = [r.left - p, r.top - p, r.right + p, r.bottom + p];
        const W = window.innerWidth;
        const H = window.innerHeight;
        shade([[0, 0, W, tp], [0, b, W, H - b], [0, tp, l, b - tp], [rt, tp, W - rt, b - tp]]);
      }
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
    return () => {
      cancelAnimationFrame(raf);
      shades.current.forEach((d) => d && (d.hidden = true));
    };
  }, [aim?.at]);

  if (!aim) return null;
  return (
    <>
    {[0, 1, 2, 3].map((i) => <div key={i} ref={(d) => { shades.current[i] = d; }} className="tutorial-shade" hidden />)}
    <div ref={box} className="tutorial" hidden>
      <img src={imageUrl("ui/tutorial_pen.png")} alt="" draggable={false} />
      <span ref={hint} className="tutorial-hint">{aim.hint}</span>
    </div>
    </>
  );
}
