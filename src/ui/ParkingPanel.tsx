import { useState } from "react";
import { DAILY_QUESTS, dailyQuestReward } from "../../shared/data/dailyQuests";
import { PARK_PASS_MAX, PARK_RECHARGE_SEC, runParking, type ParkingRun } from "../../shared/data/parking";
import { dailyOf } from "../../shared/daily";
import { formatCount } from "../../shared/format";
import type { GameState } from "../../shared/state";
import { heroPower } from "../../shared/stats";
import { isSaturday } from "../../shared/time";
import type { GameStore } from "../game/store";
import { t } from "../i18n";
import { Amount } from "./Amount";

function clock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// 던전 tab: the 지하주차장. Entering shows the result at once (the run is worked out from Park's
// power right now, the same way the server does it); the 30-second fight itself comes in step 7.
export function ParkingPanel({ state, store }: { state: GameState; store: GameStore }) {
  const [result, setResult] = useState<ParkingRun | null>(null);
  const { passes, passCarrySec, best } = state.parking;
  const today = dailyOf(state);
  const saturday = isSaturday(state.lastTick);
  // The depth is bold in the sentence: the translation's text either side of {depth}.
  const wentDown = t("30초 동안 {depth}까지 내려갔어요").split("{depth}");

  const enter = () => {
    const preview = runParking(heroPower(state));
    if (store.do({ k: "enterParking" })) setResult(preview);
  };

  return (
    <>
      <div className="row">
        <div className="grow">
          <b>{t("지하주차장")}</b> {t("주차권 {n}/{max}", { n: passes, max: PARK_PASS_MAX })}
          <div className="sub">
            {passes >= PARK_PASS_MAX ? t("주차권이 가득 찼어요") : t("다음 주차권까지 {time}", { time: clock(PARK_RECHARGE_SEC - passCarrySec) })}
            {" · "}{t("최고 B{m}m", { m: best })}
          </div>
        </div>
        <button disabled={passes <= 0} onClick={enter}>{t("입장")}<br />{t("주차권 1장")}</button>
      </div>
      <div className="group-title">
        {t("오늘의 주차장 퀘스트 · 입장 {n}회 · 최고 B{m}m", { n: today.entries, m: today.bestDepth })}{saturday ? t(" · 토요일 2배!") : ""}
      </div>
      {DAILY_QUESTS.map((q) => {
        const have = q.kind === "entries" ? today.entries : today.bestDepth;
        const claimed = today.claimed.includes(q.id);
        const done = have >= q.goal;
        return (
          <div key={q.id} className="row">
            <div className="grow">
              {q.kind === "entries" ? t("주차장 {n}회 입장", { n: q.goal }) : t("B{m}m 도달", { m: q.goal })}
              <div className="sub">{Math.min(have, q.goal)}/{q.goal}</div>
            </div>
            <button disabled={!done || claimed} onClick={() => store.do({ k: "claimDaily", id: q.id })}>
              {claimed ? t("받음") : <>{t("받기")}<br /><Amount icon="coupon" value={dailyQuestReward(q, state.lastTick)} /></>}
            </button>
          </div>
        );
      })}
      {result && (
        <div className="modal-back" onClick={() => setResult(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t("주차장 탐사 끝")}</h3>
            <p>{wentDown[0]}<b>B{result.depth}m</b>{wentDown[1]}</p>
            <p className="sub">{t("상자 {n}개", { n: result.chests })}</p>
            {result.tickets > 0 ? <p>{t("응시권")} <Amount icon="ticket" value={formatCount(result.tickets)} /></p> : <p className="sub">{t("20m마다 상자가 있어요")}</p>}
            <button onClick={() => setResult(null)}>{t("확인")}</button>
          </div>
        </div>
      )}
    </>
  );
}
