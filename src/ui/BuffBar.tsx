import { useState } from "react";
import { adReadyAt, findAd } from "../../shared/data/ads";
import { BUFFS, BUFF_KINDS, buffActive, type BuffKind } from "../../shared/data/buffs";
import type { GameState } from "../../shared/state";
import type { GameStore } from "../game/store";
import { showAd } from "../net/ads";
import { Icon } from "./Icon";

const ICON: Record<BuffKind, string> = { atk: "buff_atk", gold: "buff_gold", move: "buff_move" };

function clock(ms: number): string {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

// The three buffs (야근 모드, 성과급, 칼퇴 걸음) top left of the battle screen: lit with the time left
// while on. Tapping one watches the buff ad (one of the three at random, 3 minutes) when it is
// ready, otherwise opens the shop, where gems buy 30 minutes of a chosen one.
export function BuffBar({ state, store, onShop }: { state: GameState; store: GameStore; onShop: () => void }) {
  const [busy, setBusy] = useState(false);
  const ready = state.lastTick >= adReadyAt(state, findAd("ad_buff")!);
  const press = async () => {
    if (!ready) {
      onShop();
      return;
    }
    setBusy(true);
    const outcome = state.vx.premium ? "rewarded" : await showAd("ad_buff");
    setBusy(false);
    if (outcome === "rewarded") store.do({ k: "watchAd", id: "ad_buff" });
  };
  return (
    <div className="buff-bar">
      {BUFF_KINDS.map((kind) => {
        const on = buffActive(state, kind);
        return (
          <button key={kind} className={`buff${on ? " on" : ""}`} disabled={busy} aria-label={BUFFS[kind].name} onClick={() => void press()}>
            <Icon name={ICON[kind]} />
            {on && <small>{clock(state.buffs[kind] - state.lastTick)}</small>}
          </button>
        );
      })}
    </div>
  );
}
