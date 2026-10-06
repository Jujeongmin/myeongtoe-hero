import { SPECIAL_MISSIONS, STEP_MISSIONS, rewardText } from "../../shared/data/missions";
import type { GameState } from "../../shared/state";
import { kstDay } from "../../shared/time";
import type { GameStore } from "../game/store";

// Something waiting to be claimed besides the step mission: attendance today or a finished 특수 임무.
export function missionsWaiting(state: GameState): boolean {
  const attend = state.attendance.lastDay !== kstDay(state.lastTick);
  return attend || SPECIAL_MISSIONS.some((m) => m.done(state) && !state.missions.special.includes(m.id));
}

// Bottom right of the battle screen: the current step mission, claimable in place; tapping the
// card opens all missions.
export function MissionCard({ state, store, onOpen }: { state: GameState; store: GameStore; onOpen: () => void }) {
  const step = state.missions.step;
  const m = STEP_MISSIONS[step];
  return (
    <div className="mission-card" onClick={onOpen}>
      {missionsWaiting(state) && <i className="dot" />}
      {m ? (
        <>
          <div className="sub">{step + 1}단계 미션</div>
          <div>{m.text}</div>
          {m.done(state) ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                store.do({ k: "claimStep" });
              }}
            >
              받기 {rewardText(m.reward)}
            </button>
          ) : (
            <div className="sub">{rewardText(m.reward)}</div>
          )}
        </>
      ) : (
        <div>미션 · 출석</div>
      )}
    </div>
  );
}
