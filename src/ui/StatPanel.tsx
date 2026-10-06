import { STATS, statCost } from "../../shared/data/stats";
import { formatBig } from "../../shared/format";
import type { GameState } from "../../shared/state";
import type { GameStore } from "../game/store";

export function StatPanel({ state, store }: { state: GameState; store: GameStore }) {
  return (
    <>
      {STATS.map((def) => {
        const level = state.stats[def.id];
        const maxed = level >= def.max;
        const cost = statCost(def, level);
        return (
          <div key={def.id} className="row">
            <div className="grow">
              <b>{def.name}</b> Lv{level}
              <div className="sub">{def.effect} / 레벨</div>
            </div>
            <button disabled={maxed || state.gold.lt(cost)} onClick={() => store.do({ k: "levelStat", id: def.id })}>
              {maxed ? "최대" : <>레벨업<br />{formatBig(cost)}</>}
            </button>
          </div>
        );
      })}
    </>
  );
}
