import { useState } from "react";
import { ATTENDANCE_REWARDS, SPECIAL_MISSIONS } from "../../shared/data/missions";
import type { GameState } from "../../shared/state";
import { kstDay } from "../../shared/time";
import type { GameStore } from "../game/store";
import { t } from "../i18n";
import { RewardView } from "./Amount";

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
        {TABS.map((x) => (
          <button key={x.id} className={x.id === tab ? "on" : ""} onClick={() => setTab(x.id)}>{t(x.label)}</button>
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
              {t(m.text, m.vars)}
              <div className="sub"><RewardView reward={m.reward} /></div>
            </div>
            <button disabled={claimed || !m.done(state)} onClick={() => store.do({ k: "claimSpecial", id: m.id })}>
              {claimed ? t("받음") : t("받기")}
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
          {t("출석 {n}일째", { n: count })}
          <div className="sub">{t("7일마다 처음부터 다시 돌아요")}</div>
        </div>
        <button disabled={today} onClick={() => store.do({ k: "claimAttendance" })}>{today ? t("받음") : t("출석")}</button>
      </div>
      <div className="attendance">
        {ATTENDANCE_REWARDS.map((r, i) => (
          <div key={i} className={`day${i === now ? " now" : ""}${i < now || (today && i === now) ? " got" : ""}`}>
            <div className="sub">{t("{n}일", { n: i + 1 })}</div>
            <div><RewardView reward={r} /></div>
          </div>
        ))}
      </div>
    </>
  );
}
