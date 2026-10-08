import { useEffect, useState, type ReactNode } from "react";
import { preloadAll } from "../game/sprites";
import { t } from "../i18n";
import { PixelBar } from "./PixelBar";

// The loading screen: every picture and the fonts are loaded before the game starts, so nothing
// hitches while playing. It may take a few seconds on a slow connection.
export function Preload({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let live = true;
    const fonts = document.fonts?.ready ?? Promise.resolve();
    void Promise.all([preloadAll((p) => live && setProgress(p)), fonts]).then(() => live && setReady(true));
    return () => {
      live = false;
    };
  }, []);
  if (ready) return <>{children}</>;
  return (
    <div className="screen loading">
      <b>{t("명퇴용사 박부장")}</b>
      <div className="loading-bar"><PixelBar kind="progress" value={progress} /></div>
      <small>{t("출근 준비 중… {p}%", { p: Math.floor(progress * 100) })}</small>
    </div>
  );
}
