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
        <button className={running || passes <= 0 ? "" : "hot"} disabled={running || passes <= 0} onClick={enter}>
          {running ? t("탐사 중") : <>{t("입장")}<br />{t("주차권 1장")}</>}
        </button>
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
