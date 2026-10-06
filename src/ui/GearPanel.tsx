import { GEAR_MAX_LEVEL, GEAR_TIERS, gearAtk, gearLevelCost, gearPrice } from "../../shared/data/gear";
import { formatBig } from "../../shared/format";
import type { GameState } from "../../shared/state";
import type { GameStore } from "../game/store";

// Every tier listed: the ones behind owned, the current one to level
// up to 5, the next one to buy once the current is at 5, the rest waiting.
export function GearPanel({ state, store }: { state: GameState; store: GameStore }) {
  const { tier: current, level } = state.gear;
  return (
    <>
      {GEAR_TIERS.map((g, tier) => {
        const shownLevel = tier < current ? GEAR_MAX_LEVEL : tier === current ? level : 0;
        const atk = gearAtk(tier, shownLevel);
        let button;
        if (tier < current) {
          button = <button disabled>보유</button>;
        } else if (tier === current) {
          const cost = gearLevelCost(tier, level);
          const maxed = level >= GEAR_MAX_LEVEL;
          button = (
            <button disabled={maxed || state.gold.lt(cost)} onClick={() => store.do({ k: "levelGear" })}>
              {maxed ? "최대" : <>+1<br />{formatBig(cost)}</>}
            </button>
          );
        } else {
          const price = gearPrice(tier);
          const canBuy = tier === current + 1 && level >= GEAR_MAX_LEVEL;
          button = (
            <button disabled={!canBuy || state.gold.lt(price)} onClick={() => store.do({ k: "buyGear" })}>
              구매<br />{formatBig(price)}
            </button>
          );
        }
        return (
          <div key={g.id} className={`row${tier === current ? " current" : tier > current + 1 ? " far" : ""}`}>
            <div className="grow">
              <b>{tier + 1}. {g.name}</b>
              <div className="sub">LV.{shownLevel}/{GEAR_MAX_LEVEL} · ATK {formatBig(atk)}</div>
            </div>
            {button}
          </div>
        );
      })}
    </>
  );
}
