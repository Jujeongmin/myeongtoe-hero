import { useEffect, useState, type ReactNode } from "react";
import { PARK_QUIPS } from "../../shared/data/quips";
import { imageUrl, preloadAll } from "../game/sprites";
import { t } from "../i18n";
import { PixelBar } from "./PixelBar";

const TIP_MS = 2200;

// The loading screen: the title over the office, Park breathing in the middle, a bar and one of
// his lines at a time. Every picture and the fonts load before the game starts, so nothing hitches
// while playing; on a slow connection this takes a few seconds.
export function Preload({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [tip, setTip] = useState(() => Math.floor(Math.random() * PARK_QUIPS.length));
  useEffect(() => {
    let live = true;
    const fonts = document.fonts?.ready ?? Promise.resolve();
    // Development: ?holdload keeps this screen up (at the progress reached) to look at it.
    const hold = import.meta.env.DEV && window.location.search.includes("holdload");
    void Promise.all([preloadAll((p) => live && setProgress(hold ? Math.min(p, 0.63) : p)), fonts]).then(() => live && !hold && setReady(true));
    const id = setInterval(() => setTip((n) => (n + 1) % PARK_QUIPS.length), TIP_MS);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, []);
  if (ready) return <>{children}</>;
  const bg = imageUrl("backgrounds/bg_general_affairs.png");
  const park = imageUrl("park/idle_strip.png");
  return (
    <div className="loading" style={bg ? { backgroundImage: `url("${bg}")` } : undefined}>
      <div className="loading-shade" />
      <div className="loading-title">
        <span className="loading-kicker">{t("명퇴용사")}</span>
        <b className="loading-name">{t("박부장")}</b>
        <span className="loading-sub">{t("52세, 마왕그룹에 용사로 재취업하다")}</span>
      </div>
      {park && <div className="loading-park" style={{ backgroundImage: `url("${park}")` }} />}
      <div className="loading-foot">
        <div className="loading-tip">“{t(PARK_QUIPS[tip])}”</div>
        <div className="loading-bar"><PixelBar kind="progress" value={progress} /></div>
        <small>{t("출근 준비 중… {p}%", { p: Math.floor(progress * 100) })}</small>
      </div>
    </div>
  );
}
