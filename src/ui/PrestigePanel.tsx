import { useState } from "react";
import { PRESTIGE_MIN_FLOOR, PRESTIGE_MODES, type PrestigeMode } from "../../shared/data/prestige";
import { formatCount } from "../../shared/format";
import type { GameState } from "../../shared/state";
import { jobChangeReward } from "../../shared/stats";
import type { GameStore } from "../game/store";
import { Amount } from "./Amount";

// Two taps: the first arms the button, the second does it (no window.confirm: the Verse8 iframe may
// not allow dialogs).
export function PrestigePanel({ state, store }: { state: GameState; store: GameStore }) {
  const [armed, setArmed] = useState<PrestigeMode | null>(null);
  const floor = state.run.maxFloor;
  const ready = floor >= PRESTIGE_MIN_FLOOR;
  const reward = jobChangeReward(state);

  const press = (kind: PrestigeMode) => {
    if (armed !== kind) {
      setArmed(kind);
      return;
    }
    setArmed(null);
    store.do({ k: "prestige", mode: kind });
  };

  return (
    <>
      <div className="row">
        <div className="grow">
          <b>이직</b> (지금까지 {state.prestiges}번)
          <div className="sub">층, 골드, 업무 장비(구매확정한 것은 남아요), 부업이 초기화돼요. 자격증, 동료, 기념품, 정장, 아파트, 사무용품, 응시권, 보석, 상품권, 스킬은 남아요.</div>
        </div>
      </div>
      <div className="row">
        <div className="grow">
          이번 회차 최고 {floor}층
          <div className="sub">
            {ready ? <>받을 보상: <Amount icon="ticket" value={formatCount(reward.tickets)} /> <Amount icon="gem" value={reward.gems} /></> : `${PRESTIGE_MIN_FLOOR}층에 도달하면 이직할 수 있어요`}
          </div>
        </div>
      </div>
      <div className="row">
        <button className="wide" disabled={!ready} onClick={() => press("plain")}>
          {armed === "plain" ? "정말 이직할까요? 한 번 더 누르세요" : "이직하기"}
        </button>
      </div>
      {(["boosted", "super"] as const).map((mode) => {
        const { gems, ticketMult } = PRESTIGE_MODES[mode];
        const name = mode === "boosted" ? "강화이직" : "초강화이직";
        return (
          <div key={mode} className="row">
            <button className="wide gold" disabled={!ready || state.gems < gems} onClick={() => press(mode)}>
              {armed === mode
                ? `보석 ${gems}개로 ${name}할까요? 한 번 더 누르세요`
                : <>{name} (<Amount icon="gem" value={gems} />, 응시권 {ticketMult}배 <Amount icon="ticket" value={formatCount(reward.tickets * ticketMult)} />)</>}
            </button>
          </div>
        );
      })}
    </>
  );
}
