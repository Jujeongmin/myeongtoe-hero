import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { EPISODES, type Episode, type StoryPanel } from "../../shared/data/story";
import type { GameState } from "../../shared/state";
import { imageUrl } from "../game/sprites";
import type { GameStore } from "../game/store";

// An episode can be shown once every panel's picture is in art/story.
export function episodeReady(ep: Episode): boolean {
  return ep.panels.length > 0 && ep.panels.every((p) => imageUrl(`story/${p.img}.png`));
}

const PANEL_W = 192;

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
  // Panel width: the screen width, unless three panels would be taller than the room left.
  const width = Math.floor(Math.min(size.w, 720, ((size.h - 84) / panels.length - 4) * 1.5));
  const last = page === pages.length - 1;
  return (
    <div className="story" onClick={() => (last ? onClose() : setPage(page + 1))}>
      <header onClick={(e) => e.stopPropagation()}>
        <b>{episode.title}</b>
        <button onClick={onClose}>건너뛰기</button>
      </header>
      <div className="story-body" key={page}>
        {panels.map((i) => <Panel key={i} panel={episode.panels[i]} width={width} />)}
      </div>
      <div className="story-next">{page + 1} / {pages.length} · {last ? "눌러서 닫기" : "눌러서 다음"}</div>
    </div>
  );
}

function Panel({ panel, width }: { panel: StoryPanel; width: number }) {
  const ref = useRef<HTMLElement>(null);
  const k = width / PANEL_W;
  // Keep every bubble inside the panel (a bubble near an edge slides in; its tail stays put).
  useLayoutEffect(() => {
    const box = ref.current;
    if (!box) return;
    for (const el of box.querySelectorAll<HTMLElement>(".story-say")) {
      el.style.marginLeft = "0px";
      el.style.marginTop = "0px";
      const r = el.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      const dx = r.left < b.left + 2 ? b.left + 2 - r.left : r.right > b.right - 2 ? b.right - 2 - r.right : 0;
      const dy = r.top < b.top + 2 ? b.top + 2 - r.top : 0;
      el.style.marginLeft = `${dx}px`;
      el.style.marginTop = `${dy}px`;
    }
  }, [panel, width]);
  let free = 0;
  return (
    <section ref={ref} className="story-cut" style={{ width, height: (width * 2) / 3 }}>
      <img src={imageUrl(`story/${panel.img}.png`)} width={width} height={(width * 2) / 3} alt="" draggable={false} />
      {panel.lines.map((l, j) => {
        if (!l.who) return null;
        const [x, y] = l.at ?? [12 + 84 * (free++ % 2), 30];
        return (
          <div key={j} className={`story-say${l.flip ? " flip" : ""}`} style={{ left: x * k, top: y * k, maxWidth: width * 0.62 }}>
            <b>{l.who}</b>{l.text}
          </div>
        );
      })}
      {panel.lines.some((l) => !l.who) && (
        <div className="story-captions">
          {panel.lines.filter((l) => !l.who).map((l, j) => <div key={j} className="story-narration">{l.text}</div>)}
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
        const open = state.bestFloor >= ep.floor;
        return (
          <div key={ep.id} className={`row${open ? "" : " far"}`}>
            <div className="grow">
              <b>{ep.title}</b>
              <div className="sub">{open ? (state.story.includes(ep.id) ? "읽음" : "새 이야기") : `${ep.floor}층에서 열려요`}</div>
            </div>
            <button disabled={!open} onClick={() => onRead(ep)}>보기</button>
          </div>
        );
      })}
    </>
  );
}

// The next episode to open by itself, when its pictures are in.
export function storyToShow(state: GameState): Episode | undefined {
  return EPISODES.find((e) => state.bestFloor >= e.floor && !state.story.includes(e.id) && episodeReady(e));
}
