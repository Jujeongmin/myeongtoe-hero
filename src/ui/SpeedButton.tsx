import { useState } from "react";
import { adReadyAt, findAd } from "../../shared/data/ads";
import { speedActive } from "../../shared/data/speed";
import type { GameState } from "../../shared/state";
import type { GameStore } from "../game/store";
import { t } from "../i18n";
import { showAd } from "../net/ads";
import { Icon } from "./Icon";

function clock(ms: number): string {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

// 배속: 프리미엄 buyers switch it on and off; everyone else watches an ad for 30 minutes of it
// (and again once the ad's cooldown has passed, to add 30 more).
export function SpeedButton({ state, store }: { state: GameState; store: GameStore }) {
  const [busy, setBusy] = useState(false);
  const on = speedActive(state);
  const premium = state.vx.premium;
  const left = state.speed.until - state.lastTick;
  const ready = state.lastTick >= adReadyAt(state, findAd("ad_speed")!);

  const press = async () => {
    if (premium) {
      store.do({ k: "toggleSpeed" });
      return;
    }
    if (!ready) {
      store.do({ k: "watchAd", id: "ad_speed" });
      return;
    }
    setBusy(true);
    const outcome = await showAd("ad_speed");
    setBusy(false);
    if (outcome === "rewarded") store.do({ k: "watchAd", id: "ad_speed" });
  };

  return (
    <button className={`speed-btn${on ? " on" : ""}`} disabled={busy} aria-label={t("2배속")} onClick={() => void press()}>
      <Icon name="speed" />
      {on && !(premium && state.speed.on) && <small>{clock(left)}</small>}
    </button>
  );
}
