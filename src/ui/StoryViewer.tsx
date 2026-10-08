import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { EPISODES, episodeOpen, type Episode, type StoryPanel } from "../../shared/data/story";
import type { GameState } from "../../shared/state";
import { imageUrl } from "../game/sprites";
import type { GameStore } from "../game/store";
import { useFitText } from "./useFitText";
import { t } from "../i18n";

// An episode can be shown once every panel's picture is in art/story.
export function episodeReady(ep: Episode): boolean {
  return ep.panels.length > 0 && ep.panels.every((p) => imageUrl(`story/${p.img}.png`));
}

const PANEL_W = 192;
// The game is a portrait column this wide at most (index.css .phone).
const COLUMN_PX = 480;

// An episode's panels split into pages of up to three, as even as possible (7 → 3, 2, 2).
function pagesOf(n: number): number[][] {
  const count = Math.ceil(n / 3);
  const pages: number[][] = [];
  let i = 0;
  for (let k = 0; k < count; k++) {
    const size = Math.ceil((n - i) / (count - k));
    pages.push(Array.from({ length: size }, (_, j) => i + j));
    i += size;
  }
  return pages;
}

// The webtoon a page at a time, like a comic: up to three panels stacked to fill the screen, each
// with its lines on it (speech bubbles over the speaker's head, narration in a caption box along
// the bottom). Tap anywhere for the next page; after the last it closes and counts as read.
export function StoryViewer({ episode, onClose }: { episode: Episode; onClose: () => void }) {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [page, setPage] = useState(0);
  useEffect(() => {
    const resize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  const pages = pagesOf(episode.panels.length);
  const panels = pages[page];
  // Panel width: the game's column (the screen on a phone, 480px on a wide screen), unless three
  // panels would be taller than the room left.
  const width = Math.floor(Math.min(size.w, COLUMN_PX, ((size.h - 84) / panels.length - 4) * 1.5));
  const last = page === pages.length - 1;
  return (
    <div className="story" onClick={() => (last ? onClose() : setPage(page + 1))}>
      <header onClick={(e) => e.stopPropagation()}>
        <b>{t(episode.title)}</b>
        <button onClick={onClose}>{t("건너뛰기")}</button>
      </header>
      <div className="story-body" key={page}>
        {panels.map((i) => <Panel key={i} panel={episode.panels[i]} width={width} />)}
      </div>
      <div className="story-next">{page + 1} / {pages.length} · {last ? t("눌러서 닫기") : t("눌러서 다음")}</div>
    </div>
  );
}

function Panel({ panel, width }: { panel: StoryPanel; width: number }) {
  const ref = useRef<HTMLElement>(null);
  const k = width / PANEL_W;
  // Lay the bubbles out in reading order: each starts where its line says (tail on the speaker's
  // head), slides in from the panel edges, and if it would cover an earlier bubble it first tries
  // the other side, then moves down a step at a time until it is clear.
  useLayoutEffect(() => {
    const box = ref.current;
    if (!box) return;
    const b = box.getBoundingClientRect();
    const placed: DOMRect[] = [];
    const hits = (r: DOMRect) => placed.some((p) => Math.min(r.right, p.right) - Math.max(r.left, p.left) > 1 && Math.min(r.bottom, p.bottom) - Math.max(r.top, p.top) > 1);
    const fit = (el: HTMLElement, dy: number) => {
      el.style.marginLeft = "0px";
      el.style.marginTop = `${dy}px`;
      const r = el.getBoundingClientRect();
      const dx = r.left < b.left + 2 ? b.left + 2 - r.left : r.right > b.right - 2 ? b.right - 2 - r.right : 0;
      const up = r.top < b.top + 2 ? b.top + 2 - r.top : 0;
      el.style.marginLeft = `${dx}px`;
      el.style.marginTop = `${dy + up}px`;
      return el.getBoundingClientRect();
    };
    for (const el of box.querySelectorAll<HTMLElement>(".story-say")) {
      let best: DOMRect | null = null;
      search: for (let dy = 0; dy <= b.height; dy += 4) {
        for (const flip of [el.dataset.flip === "1", el.dataset.flip !== "1"]) {
          el.classList.toggle("flip", flip);
          const r = fit(el, dy);
          if (!hits(r)) {
            best = r;
            break search;
          }
        }
      }
      if (!best) {
        el.classList.toggle("flip", el.dataset.flip === "1");
        best = fit(el, 0);
      }
      placed.push(best);
    }
  }, [panel, width]);
  let free = 0;
  return (
    <section ref={ref} className="story-cut" style={{ width, height: (width * 2) / 3, ["--k" as string]: k }}>
      <img src={imageUrl(`story/${panel.img}.png`)} width={width} height={(width * 2) / 3} alt="" draggable={false} />
      {panel.lines.map((l, j) => {
        if (!l.who) return null;
        const [x, y] = l.at ?? [12 + 84 * (free++ % 2), 30];
        return (
          <div key={j} className={`story-say${l.flip ? " flip" : ""}`} data-flip={l.flip ? "1" : "0"} style={{ left: x * k, top: y * k, maxWidth: l.w ? l.w * k : width * 0.62 }}>
            {t(l.text)}
          </div>
        );
      })}
      {panel.lines.some((l) => !l.who) && (
        <div className="story-captions">
          {panel.lines.filter((l) => !l.who).map((l, j) => (l.oneLine ? <OneLine key={j} text={t(l.text)} /> : <div key={j} className="story-narration">{t(l.text)}</div>))}
        </div>
      )}
    </section>
  );
}

// 스토리 in the menu: every episode open so far, to read again.
export function StoryList({ state, onRead }: { state: GameState; onRead: (ep: Episode) => void }) {
  return (
    <>
      {EPISODES.filter(episodeReady).map((ep) => {
        const open = episodeOpen(ep, state);
        return (
          <div key={ep.id} className={`row${open ? "" : " far"}`}>
            <div className="grow">
              <b>{t(ep.title)}</b>
              <div className="sub">{open ? (state.story.includes(ep.id) ? t("읽음") : t("새 이야기")) : ep.allCostumes ? t("코스튬을 모두 모으면 열려요") : t("{floor}층에서 열려요", { floor: ep.floor })}</div>
            </div>
            <button disabled={!open} onClick={() => onRead(ep)}>{t("보기")}</button>
          </div>
        );
      })}
    </>
  );
}

// The next episode to open by itself, when its pictures are in.
export function storyToShow(state: GameState): Episode | undefined {
  return EPISODES.find((e) => episodeOpen(e, state) && !state.story.includes(e.id) && episodeReady(e));
}

function OneLine({ text }: { text: string }) {
  const ref = useFitText<HTMLDivElement>(text);
  return <div ref={ref} className="story-narration one-line">{text}</div>;
}
