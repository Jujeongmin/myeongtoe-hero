import { SIDE_JOBS, sideJobCycle, sideJobIncome } from "../../shared/data/sideJobs";
import { formatBig } from "../../shared/format";
import { sideJobCostFor } from "../../shared/prices";
import type { GameState } from "../../shared/state";
import type { GameStore } from "../game/store";
import { Icon } from "./Icon";

export function SideJobPanel({ state, store }: { state: GameState; store: GameStore }) {
  return (
    <>
      {SIDE_JOBS.map((job) => {
        if (state.run.maxFloor < job.unlockFloor) {
          return (
            <div key={job.id} className="row locked">
              <span className="locked-name"><Icon name="lock" size={16} /> {job.name}</span>
              <span className="sub">{job.unlockFloor}층 도달 시</span>
            </div>
          );
        }
        const own = state.sideJobs[job.id];
        const level = own?.level ?? 0;
        const cost = sideJobCostFor(state, job, level);
        const cycle = sideJobCycle(job, level);
        const progress = level > 0 && own ? own.progressSec / cycle : 0;
        return (
          <div key={job.id} className="row">
            <div className="grow">
              <b>{job.name}</b> Lv{level}
              <div className="sub">
                {formatBig(sideJobIncome(job, Math.max(1, level)))} / {cycle.toFixed(1)}초
              </div>
              <div className="bar">
                <i style={{ width: `${Math.min(1, progress) * 100}%` }} />
              </div>
            </div>
            <button disabled={state.gold.lt(cost)} onClick={() => store.do({ k: "levelSideJob", id: job.id })}>
              {level === 0 ? "시작" : "레벨업"}<br />{formatBig(cost)}
            </button>
          </div>
        );
      })}
    </>
  );
}
