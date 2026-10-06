import { useState } from "react";
import { certBonuses } from "../../shared/data/certs";
import { BOOSTED_PRESTIGE_GEMS, PRESTIGE_MIN_FLOOR, prestigeReward } from "../../shared/data/prestige";
import type { GameState } from "../../shared/state";
import type { GameStore } from "../game/store";

// Two taps: the first arms the button, the second does it (no window.confirm: the Verse8 iframe may
// not allow dialogs).
export function PrestigePanel({ state, store }: { state: GameState; store: GameStore }) {
  const [armed, setArmed] = useState<"plain" | "boosted" | null>(null);
  const floor = state.run.maxFloor;
  const ready = floor >= PRESTIGE_MIN_FLOOR;
  const reward = prestigeReward(floor, certBonuses(state.certs).prestige);

  const press = (kind: "plain" | "boosted") => {
    if (armed !== kind) {
      setArmed(kind);
      return;
    }
    setArmed(null);
    store.do({ k: "prestige", boosted: kind === "boosted" });
  };

  return (
    <>
      <div className="row">
        <div className="grow">
          <b>이직</b> (지금까지 {state.prestiges}번)
          <div className="sub">층, 골드, 업무 장비, 부업이 초기화돼요. 자격증, 동료, 기념품, 정장, 아파트, 사무용품, 응시권, 보석, 상품권, 스킬은 남아요.</div>
        </div>
      </div>
      <div className="row">
        <div className="grow">
          이번 회차 최고 {floor}층
          <div className="sub">
            {ready ? `받을 보상: 📝 ${reward.tickets} · 💎 ${reward.gems}` : `${PRESTIGE_MIN_FLOOR}층에 도달하면 이직할 수 있어요`}
          </div>
        </div>
      </div>
      <div className="row">
        <button className="wide" disabled={!ready} onClick={() => press("plain")}>
          {armed === "plain" ? "정말 이직할까요? 한 번 더 누르세요" : "이직하기"}
        </button>
      </div>
      <div className="row">
        <button className="wide gold" disabled={!ready || state.gems < BOOSTED_PRESTIGE_GEMS} onClick={() => press("boosted")}>
          {armed === "boosted" ? "보석을 써서 강화이직할까요? 한 번 더 누르세요" : `강화이직 (💎 ${BOOSTED_PRESTIGE_GEMS}, 보상 2배)`}
        </button>
      </div>
    </>
  );
}
