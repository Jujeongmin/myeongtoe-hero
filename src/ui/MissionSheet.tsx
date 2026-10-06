import { useState } from "react";
import { ATTENDANCE_REWARDS, SPECIAL_MISSIONS, rewardText } from "../../shared/data/missions";
import type { GameState } from "../../shared/state";
import { kstDay } from "../../shared/time";
import type { GameStore } from "../game/store";

type Tab = "special" | "attendance";
const TABS: { id: Tab; label: string }[] = [
  { id: "special", label: "특수 임무" },
  { id: "attendance", label: "출석" },
];

export function MissionSheet({ state, store }: { state: GameState; store: GameStore }) {
  const [tab, setTab] = useState<Tab>("special");
  return (
    <>
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={t.id === tab ? "on" : ""} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>
      {tab === "special" && <Specials state={state} store={store} />}
      {tab === "attendance" && <Attendance state={state} store={store} />}
    </>
  );
}

function Specials({ state, store }: { state: GameState; store: GameStore }) {
  return (
    <>
      {SPECIAL_MISSIONS.map((m) => {
        const claimed = state.missions.special.includes(m.id);
        return (
          <div key={m.id} className="row">
            <div className="grow">
              {m.text}
              <div className="sub">{rewardText(m.reward)}</div>
            </div>
            <button disabled={claimed || !m.done(state)} onClick={() => store.do({ k: "claimSpecial", id: m.id })}>
              {claimed ? "받음" : "받기"}
            </button>
          </div>
        );
      })}
    </>
  );
}

function Attendance({ state, store }: { state: GameState; store: GameStore }) {
  const { count, lastDay } = state.attendance;
  const today = lastDay === kstDay(state.lastTick);
  // The day of the 7-day cycle the next claim pays (or today's claim paid).
  const now = (today ? count - 1 : count) % ATTENDANCE_REWARDS.length;
  return (
    <>
      <div className="row">
        <div className="grow">
          출석 {count}일째
          <div className="sub">7일마다 처음부터 다시 돌아요</div>
        </div>
        <button disabled={today} onClick={() => store.do({ k: "claimAttendance" })}>{today ? "받음" : "출석"}</button>
      </div>
      <div className="attendance">
        {ATTENDANCE_REWARDS.map((r, i) => (
          <div key={i} className={`day${i === now ? " now" : ""}${i < now || (today && i === now) ? " got" : ""}`}>
            <div className="sub">{i + 1}일</div>
            <div>{rewardText(r)}</div>
          </div>
        ))}
      </div>
    </>
  );
}
