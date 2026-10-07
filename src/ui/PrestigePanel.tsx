import { useState } from "react";
import { PRESTIGE_MIN_FLOOR, PRESTIGE_MODES, type PrestigeMode } from "../../shared/data/prestige";
import { formatCount } from "../../shared/format";
import type { GameState } from "../../shared/state";
import { jobChangeReward } from "../../shared/stats";
import type { GameStore } from "../game/store";
import { t } from "../i18n";
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
          <b>{t("이직")}</b> {t("(지금까지 {n}번)", { n: state.prestiges })}
          <div className="sub">{t("층, 골드, 업무 장비(구매확정한 것은 남아요), 부업이 초기화돼요. 자격증, 동료, 기념품, 코스튬, 아파트, 사무용품, 응시권, 보석, 상품권은 남아요.")}</div>
        </div>
      </div>
      <div className="row">
        <div className="grow">
          {t("이번 회차 최고 {floor}층", { floor })}
          <div className="sub">
            {ready ? <>{t("받을 보상:")} <Amount icon="ticket" value={formatCount(reward.tickets)} /> <Amount icon="gem" value={reward.gems} /></> : t("{floor}층에 도달하면 이직할 수 있어요", { floor: PRESTIGE_MIN_FLOOR })}
          </div>
        </div>
      </div>
      <div className="row">
        <button className="wide" disabled={!ready} onClick={() => press("plain")}>
          {armed === "plain" ? t("정말 이직할까요? 한 번 더 누르세요") : t("이직하기")}
        </button>
      </div>
      {(["boosted", "super"] as const).map((mode) => {
        const { gems, ticketMult } = PRESTIGE_MODES[mode];
        const name = mode === "boosted" ? t("강화이직") : t("초강화이직");
        return (
          <div key={mode} className="row">
            <button className="wide gold" disabled={!ready || state.gems < gems} onClick={() => press(mode)}>
              {armed === mode
                ? t("보석 {gems}개로 {name}할까요? 한 번 더 누르세요", { gems, name })
                : <>{name} (<Amount icon="gem" value={gems} />, {t("응시권 {n}배", { n: ticketMult })} <Amount icon="ticket" value={formatCount(reward.tickets * ticketMult)} />)</>}
            </button>
          </div>
        );
      })}
    </>
  );
}
