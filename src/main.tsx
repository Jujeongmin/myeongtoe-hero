// First, before anything reaches for storage: @agent8/gameserver touches localStorage while its
// module is being evaluated. See storageFallback.ts.
import "./storageFallback";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GameServerProvider } from "@agent8/gameserver";
import { LocalApp, OnlineApp } from "./App";
import "./fonts.css";
import "./index.css";
import { initAds } from "./net/ads";
import { wantsOnline } from "./net/connection";
import { ErrorBoundary } from "./ui/ErrorBoundary";

initAds();

const online = wantsOnline(import.meta.env.VITE_AGENT8_VERSE, window.location.search, import.meta.env.DEV);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      {online ? (
        <GameServerProvider>
          <OnlineApp />
        </GameServerProvider>
      ) : (
        <LocalApp />
      )}
    </ErrorBoundary>
  </StrictMode>,
);
