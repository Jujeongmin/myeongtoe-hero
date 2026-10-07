import { useState } from "react";
import { PRESTIGE_MIN_FLOOR, PRESTIGE_MODES, type PrestigeMode } from "../../shared/data/prestige";
import { formatCount } from "../../shared/format";
import type { GameState } from "../../shared/state";
import { jobChangeReward } from "../../shared/stats";
import type { GameStore } from "../game/store";
import { t } from "../i18n";
import { imageUrl } from "../game/sprites";
import { Amount } from "./Amount";
import { useFitText } from "./useFitText";

// 이직: the headhunter's offer letter. The cat makes the pitch, the letter lists what resets and what
// stays, and the three offers sit on their own cards (plain, boosted, super). Two taps on an offer:
// the first arms it, the second signs (no window.confirm: the Verse8 iframe may not allow dialogs).
export function PrestigePanel({ state, store, onClose }: { state: GameState; store: GameStore; onClose: () => void }) {
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
    onClose();
  };

  const offers: { mode: PrestigeMode; name: string }[] = [
    { mode: "plain", name: t("이직") },
    { mode: "boosted", name: t("강화이직") },
    { mode: "super", name: t("초강화이직") },
  ];

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="prestige-sheet" onClick={(e) => e.stopPropagation()}>
        <header>
          <b>{t("이직")}</b> <span className="sub">{t("(지금까지 {n}번)", { n: state.prestiges })}</span>
          <button className="prestige-close" onClick={onClose} aria-label={t("닫기")}>{t("닫기")}</button>
        </header>
        <div className="prestige-pitch">
          <img src={imageUrl("story/src/ref_headhunter_cat.png")} width={64} height={64} alt="" draggable={false} />
          <div className="prestige-say">
            {/* One sentence a line: the pitch, then the catch. */}
            {t("박부장님, 연봉은 올려 드리죠. 대신 1층부터 다시 시작입니다.").split(/(?<=[.。!?！？])\s*/).filter(Boolean).map((line, i) => <div key={i}>{line}</div>)}
          </div>
        </div>
        <div className="prestige-terms">
          <div>{t("이번 회차 최고 {floor}층", { floor })}</div>
          <FitLine text={t("층, 골드, 업무 장비(구매확정한 것은 남아요), 부업이 초기화돼요.")} />
        </div>
        {offers.map(({ mode, name }) => {
          const { gems, ticketMult } = PRESTIGE_MODES[mode];
          const afford = state.gems >= gems;
          return (
            <div key={mode} className={`prestige-card ${mode}`}>
              <div className="grow">
                <b>{name}</b>{ticketMult > 1 && <span className="mult"> ×{ticketMult}</span>}
                <div className="sub">
                  {ready ? <><Amount icon="ticket" value={formatCount(reward.tickets * ticketMult)} /> <Amount icon="gem" value={reward.gems} /></> : t("{floor}층에 도달하면 이직할 수 있어요", { floor: PRESTIGE_MIN_FLOOR })}
                </div>
              </div>
              <button className={armed === mode ? "hot" : ""} disabled={!ready || !afford} onClick={() => press(mode)}>
                {armed === mode ? t("한 번 더") : gems > 0 ? <Amount icon="gem" value={gems} /> : t("이직하기")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FitLine({ text }: { text: string }) {
  const ref = useFitText<HTMLDivElement>(text);
  return <div ref={ref} className="sub one-line">{text}</div>;
}
