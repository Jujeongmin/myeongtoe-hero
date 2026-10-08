// First, before anything reaches for storage: @agent8/gameserver touches localStorage while its
// module is being evaluated. See storageFallback.ts.
import { initAudio } from "./game/audio";
import "./storageFallback";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Preload } from "./ui/Preload";
import { GameServerProvider } from "@agent8/gameserver";
import { LocalApp, OnlineApp } from "./App";
import "@fontsource/fusion-pixel-12px-proportional-sc";
import "@fontsource/fusion-pixel-12px-proportional-tc";
import "@fontsource/fusion-pixel-12px-proportional-jp";
import "./fonts.css";
import "./index.css";
import { applyUiSkin } from "./game/sprites";
import { initAds } from "./net/ads";
import { wantsOnline } from "./net/connection";
import { ErrorBoundary } from "./ui/ErrorBoundary";

initAds();
applyUiSkin();
initAudio();

// No dragging or selecting text and pictures anywhere but the text fields (index.css does the same
// for browsers that honour it).
const editable = (target: EventTarget | null) => target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
document.addEventListener("dragstart", (e) => e.preventDefault());
document.addEventListener("selectstart", (e) => {
  if (!editable(e.target)) e.preventDefault();
});

const online = wantsOnline(import.meta.env.VITE_AGENT8_VERSE, window.location.search, import.meta.env.DEV);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <Preload>
        {online ? (
          <GameServerProvider>
            <OnlineApp />
          </GameServerProvider>
        ) : (
          <LocalApp />
        )}
      </Preload>
    </ErrorBoundary>
  </StrictMode>,
);
