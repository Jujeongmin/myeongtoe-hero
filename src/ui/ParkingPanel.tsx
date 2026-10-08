import { useState } from "react";
import { DAILY_QUESTS, dailyQuestReward } from "../../shared/data/dailyQuests";
import { PARK_AWAKEN, PARK_PASS_MAX, PARK_RECHARGE_SEC, PARK_WARP_MAX, runParking, type ParkingRun } from "../../shared/data/parking";
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

// 던전 tab: the 지하주차장. Entering starts a 30-second run on the battle screen (the tower waits);
// the result shows when it ends (see Battle).
export function ParkingPanel({ state, store }: { state: GameState; store: GameStore }) {
  const { passes, passCarrySec, best } = state.parking;
  const today = dailyOf(state);
  const saturday = isSaturday(state.lastTick);
  const running = state.parking.runUntil > state.lastTick || !state.parking.claimed;
  const enter = () => store.do({ k: "enterParking" });

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
        <button data-tut="park-enter" className={running || passes <= 0 ? "" : "hot"} disabled={running || passes <= 0} onClick={enter}>
          {running ? t("탐사 중") : <>{t("입장")}<br />{t("주차권 1장")}</>}
        </button>
      </div>
      {/* 각성: passes offered here (all held at once) toward PARK_AWAKEN; then runs warp through
          the one-hit meters. */}
      <div className="row">
        <div className="grow">
          <b>{t("주차장 각성")}</b> {state.parking.used >= PARK_AWAKEN ? t("완료") : `${state.parking.used}/${PARK_AWAKEN}`}
          <div className="sub">{t("주차권을 바쳐 각성하면 한 방 구간을 {m}m까지 건너뛰어요", { m: PARK_WARP_MAX })}</div>
          {state.parking.used < PARK_AWAKEN && <div className="bar"><i style={{ width: `${(state.parking.used / PARK_AWAKEN) * 100}%` }} /></div>}
        </div>
        {state.parking.used < PARK_AWAKEN && (
          <button disabled={passes <= 0 || running} onClick={() => store.do({ k: "feedParking" })}>
            {t("바치기")}<br />{t("주차권 {n}장", { n: Math.min(passes, PARK_AWAKEN - state.parking.used) })}
          </button>
        )}
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
    </>
  );
}
