import { useState } from "react";
import { DAILY_QUESTS, dailyQuestReward } from "../../shared/data/dailyQuests";
import { PARK_PASS_MAX, PARK_RECHARGE_SEC, runParking, type ParkingRun } from "../../shared/data/parking";
import { dailyOf } from "../../shared/daily";
import { formatCount } from "../../shared/format";
import type { GameState } from "../../shared/state";
import { heroPower } from "../../shared/stats";
import { isSaturday } from "../../shared/time";
import type { GameStore } from "../game/store";

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

  const enter = () => {
    const preview = runParking(heroPower(state));
    if (store.do({ k: "enterParking" })) setResult(preview);
  };

  return (
    <>
      <div className="row">
        <div className="grow">
          <b>지하주차장</b> 주차권 {passes}/{PARK_PASS_MAX}
          <div className="sub">
            {passes >= PARK_PASS_MAX ? "주차권이 가득 찼어요" : `다음 주차권까지 ${clock(PARK_RECHARGE_SEC - passCarrySec)}`}
            {" · "}최고 B{best}m
          </div>
        </div>
        <button disabled={passes <= 0} onClick={enter}>입장<br />🅿 1</button>
      </div>
      <div className="group-title">
        오늘의 주차장 퀘스트 · 입장 {today.entries}회 · 최고 B{today.bestDepth}m{saturday ? " · 토요일 2배!" : ""}
      </div>
      {DAILY_QUESTS.map((q) => {
        const have = q.kind === "entries" ? today.entries : today.bestDepth;
        const claimed = today.claimed.includes(q.id);
        const done = have >= q.goal;
        return (
          <div key={q.id} className="row">
            <div className="grow">
              {q.kind === "entries" ? `주차장 ${q.goal}회 입장` : `B${q.goal}m 도달`}
              <div className="sub">{Math.min(have, q.goal)}/{q.goal}</div>
            </div>
            <button disabled={!done || claimed} onClick={() => store.do({ k: "claimDaily", id: q.id })}>
              {claimed ? "받음" : <>받기<br />🎟 {dailyQuestReward(q, state.lastTick)}</>}
            </button>
          </div>
        );
      })}
      {result && (
        <div className="modal-back" onClick={() => setResult(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>주차장 탐사 끝</h3>
            <p>30초 동안 <b>B{result.depth}m</b>까지 내려갔어요</p>
            <p className="sub">상자 {result.chests}개</p>
            {result.tickets > 0 ? <p>📝 응시권 {formatCount(result.tickets)}</p> : <p className="sub">20m마다 상자가 있어요</p>}
            <button onClick={() => setResult(null)}>확인</button>
          </div>
        </div>
      )}
    </>
  );
}
