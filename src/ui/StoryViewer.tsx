import { useEffect, useState } from "react";
import { EPISODES, type Episode } from "../../shared/data/story";
import type { GameState } from "../../shared/state";
import { imageUrl } from "../game/sprites";
import type { GameStore } from "../game/store";

const PANEL_W = 192;

// An episode can be shown once every panel's picture is in art/story.
export function episodeReady(ep: Episode): boolean {
  return ep.panels.length > 0 && ep.panels.every((p) => imageUrl(`story/${p.img}.png`));
}

// The panels' on-screen width: the biggest whole multiple of the 192 px art that fits, in device
// pixels, so the pixel art stays sharp.
function panelWidth(): number {
  const dpr = window.devicePixelRatio || 1;
  const room = Math.min(440, window.innerWidth - 32) * dpr;
  return Math.max(1, Math.floor(room / PANEL_W)) * PANEL_W / dpr;
}

// The webtoon, scrolled down panel by panel: each picture with its lines under it (narration in a
// dark box, speech in a bubble with the speaker's name). Closing marks it read.
export function StoryViewer({ episode, onClose }: { episode: Episode; onClose: () => void }) {
  const [width, setWidth] = useState(panelWidth);
  useEffect(() => {
    const resize = () => setWidth(panelWidth());
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);
  return (
    <div className="story">
      <header>
        <b>{episode.title}</b>
        <button onClick={onClose}>닫기</button>
      </header>
      <div className="story-body">
        {episode.panels.map((p, i) => (
          <section key={i} className="story-cut" style={{ width }}>
            <img src={imageUrl(`story/${p.img}.png`)} width={width} height={(width * 2) / 3} alt="" draggable={false} />
            {p.lines.map((l, j) => (l.who ? (
              <div key={j} className="story-say"><b>{l.who}</b>{l.text}</div>
            ) : (
              <div key={j} className="story-narration">{l.text}</div>
            )))}
          </section>
        ))}
        <button className="btn hot story-end" onClick={onClose}>다 읽었어요</button>
      </div>
    </div>
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
