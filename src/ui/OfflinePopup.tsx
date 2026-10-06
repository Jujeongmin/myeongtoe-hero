import { Big } from "../../shared/big";
import { formatBig, formatCount } from "../../shared/format";
import { useState } from "react";
import type { GameStore } from "../game/store";
import { showAd } from "../net/ads";
import { Amount } from "./Amount";

function duration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

// Welcome back: what settle already paid for the time away, and an ad to have it once more
// (프리미엄: no ad, just the button).
export function OfflinePopup({ store }: { store: GameStore }) {
  const [busy, setBusy] = useState(false);
  const r = store.offline;
  if (!r) return null;
  const state = store.view();
  const canDouble = !!state?.offlineBonus && state.lastTick <= state.offlineBonus.until;
  const premium = !!state?.vx.premium;
  const double = async () => {
    setBusy(true);
    const outcome = premium ? "rewarded" : await showAd("ad_offline");
    setBusy(false);
    if (outcome === "rewarded" && store.do({ k: "watchAd", id: "ad_offline" })) store.dismissOffline();
  };
  return (
    <div className="modal-back">
      <div className="modal">
        <h3>퇴근했다 돌아왔어요</h3>
        <p className="sub">자리를 비운 {duration(r.seconds)} 동안</p>
        <p><Amount icon="gold" value={formatBig(Big.from(r.gold))} /></p>
        {r.floorTo !== r.floorFrom && <p>{r.floorFrom}층에서 {r.floorTo}층까지</p>}
        {r.tickets > 0 && <p>응시권 <Amount icon="ticket" value={formatCount(r.tickets)} /></p>}
        {r.gems > 0 && <p>보석 <Amount icon="gem" value={r.gems} /></p>}
        {canDouble && (
          <button className="gold" disabled={busy} onClick={() => void double()}>
            {premium ? "한 번 더 받기" : "광고 보고 한 번 더 받기"}
          </button>
        )}
        <button onClick={() => store.dismissOffline()}>받기</button>
      </div>
    </div>
  );
}
