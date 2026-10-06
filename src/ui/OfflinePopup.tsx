import { Big } from "../../shared/big";
import { formatBig } from "../../shared/format";
import type { GameStore } from "../game/store";

function duration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

// Welcome back: what settle already paid for the time away. (The ad ×2 button comes in step 6.)
export function OfflinePopup({ store }: { store: GameStore }) {
  const r = store.offline;
  if (!r) return null;
  return (
    <div className="modal-back">
      <div className="modal">
        <h3>퇴근했다 돌아왔어요</h3>
        <p className="sub">자리를 비운 {duration(r.seconds)} 동안</p>
        <p>💰 {formatBig(Big.from(r.gold))}</p>
        {r.floorTo !== r.floorFrom && <p>{r.floorFrom}층 → {r.floorTo}층</p>}
        {r.tickets > 0 && <p>📝 응시권 {r.tickets}</p>}
        {r.gems > 0 && <p>💎 보석 {r.gems}</p>}
        <button onClick={() => store.dismissOffline()}>받기</button>
      </div>
    </div>
  );
}
