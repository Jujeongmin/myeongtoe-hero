import { useState } from "react";
import { adReadyAt, findAd } from "../../shared/data/ads";
import { BUFFS, BUFF_KINDS, buffActive, type BuffKind } from "../../shared/data/buffs";
import type { GameState } from "../../shared/state";
import type { GameStore } from "../game/store";
import { t } from "../i18n";
import { showAd } from "../net/ads";
import { Icon } from "./Icon";

const ICON: Record<BuffKind, string> = { atk: "buff_atk", gold: "buff_gold", move: "buff_move" };

function clock(ms: number): string {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

// The three buffs (야근 모드, 성과급, 칼퇴 걸음) top left of the battle screen: lit with the time left
// while on. Tapping one asks once whether to watch that buff's ad, then turns that buff on; while
// its ad is cooling down a toast says how long. 프리미엄 buyers have all three on for good.
export function BuffBar({ state, store }: { state: GameState; store: GameStore }) {
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState<BuffKind | null>(null);
  const premium = state.vx.premium;
  const press = (kind: BuffKind) => {
    if (premium) {
      store.notify(t("프리미엄: 버프가 항상 켜져 있어요"));
      return;
    }
    const wait = adReadyAt(state, findAd(`ad_buff_${kind}`)!) - state.lastTick;
    if (wait > 0) {
      store.notify(t("{time} 뒤에 다시 켤 수 있어요", { time: clock(wait) }));
      return;
    }
    setAsking(kind);
  };
  const watch = async (kind: BuffKind) => {
    setAsking(null);
    setBusy(true);
    const outcome = await showAd(`ad_buff_${kind}`);
    setBusy(false);
    if (outcome === "rewarded") store.do({ k: "watchAd", id: `ad_buff_${kind}` });
  };
  return (
    <div className="buff-bar">
      {BUFF_KINDS.map((kind) => {
        const on = buffActive(state, kind);
        return (
          <button key={kind} className={`buff${on ? " on" : ""}`} disabled={busy} aria-label={t(BUFFS[kind].name)} onClick={() => press(kind)}>
            <Icon name={ICON[kind]} />
            {on && !premium && <small>{clock(state.buffs[kind] - state.lastTick)}</small>}
          </button>
        );
      })}
      {asking && (
        <div className="modal-back" onClick={() => setAsking(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t(BUFFS[asking].name)}</h3>
            <p>{t(findAd(`ad_buff_${asking}`)!.text)}</p>
            <p>{t("광고를 보고 켤까요?")}</p>
            <button className="gold" onClick={() => void watch(asking)}>{t("광고 보기")}</button>
            <button onClick={() => setAsking(null)}>{t("닫기")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
