import { GEAR_TIERS, gearAtk, gearLevelCost, gearPrice } from "../../shared/data/gear";
import { formatBig } from "../../shared/format";
import type { GameState } from "../../shared/state";
import { heroAtk } from "../../shared/stats";
import type { GameStore } from "../game/store";

export function GearPanel({ state, store }: { state: GameState; store: GameStore }) {
  const { tier, level } = state.gear;
  const levelCost = gearLevelCost(tier, level);
  const next = tier + 1 < GEAR_TIERS.length ? tier + 1 : null;
  return (
    <>
      <div className="row">
        <div className="grow">
          <b>{GEAR_TIERS[tier].name}</b> Lv{level}
          <div className="sub">공격력 {formatBig(heroAtk(state))}</div>
        </div>
        <button disabled={state.gold.lt(levelCost)} onClick={() => store.do({ k: "levelGear" })}>
          레벨업<br />{formatBig(levelCost)}
        </button>
      </div>
      {next !== null && (
        <div className="row">
          <div className="grow">
            다음 장비 <b>{GEAR_TIERS[next].name}</b>
            <div className="sub">공격력 {formatBig(gearAtk(next, 0))}</div>
          </div>
          <button disabled={state.gold.lt(gearPrice(next))} onClick={() => store.do({ k: "buyGear" })}>
            구매<br />{formatBig(gearPrice(next))}
          </button>
        </div>
      )}
    </>
  );
}
