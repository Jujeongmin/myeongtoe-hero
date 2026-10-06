import { GEAR_MAX_LEVEL, GEAR_TIERS, gearAtk, gearConfirmCost } from "../../shared/data/gear";
import { formatBig } from "../../shared/format";
import { gearLevelCostFor, gearPriceFor } from "../../shared/prices";
import type { GameState } from "../../shared/state";
import type { GameStore } from "../game/store";
import { Amount } from "./Amount";
import { Icon } from "./Icon";

// 정장 first (the way in to the costume panel), then every tier listed: the ones behind owned, the current one to level
// up to 5, the next one to buy once the current is at 5, the rest waiting. 구매확정 on top: the
// next tier to confirm (in order), once it has reached Lv5.
export function GearPanel({ state, store, onSuits }: { state: GameState; store: GameStore; onSuits: () => void }) {
  const { tier: current, level, confirmed } = state.gear;
  const next = confirmed;
  const reached = next < GEAR_TIERS.length && (current > next || (current === next && level >= GEAR_MAX_LEVEL));
  const confirmCost = next < GEAR_TIERS.length ? gearConfirmCost(next) : null;
  return (
    <>
      <div className="row">
        <span className="icon-box"><Icon name="side_suits" /></span>
        <div className="grow">
          <b>정장</b>
          <div className="sub">투구부터 장신구까지 갈아입으러 가요</div>
        </div>
        <button className="hot" onClick={onSuits}>입장하기</button>
      </div>
      <div className="row">
        <div className="grow">
          <b>구매확정</b> {confirmed}/{GEAR_TIERS.length}
          <div className="sub">
            {confirmCost
              ? `${next + 1}. ${GEAR_TIERS[next].name} — Lv${GEAR_MAX_LEVEL}에서 확정하면 이직해도 남아요`
              : "모든 장비를 확정했어요"}
          </div>
        </div>
        {confirmCost && (
          <button
            disabled={!reached || state.gems < confirmCost.gems || state.gold.lt(confirmCost.gold)}
            onClick={() => store.do({ k: "confirmGear" })}
          >
            확정<br /><Amount icon="gem" value={confirmCost.gems} /> <Amount icon="gold" value={formatBig(confirmCost.gold)} />
          </button>
        )}
      </div>
      {GEAR_TIERS.map((g, tier) => {
        const shownLevel = tier < current ? GEAR_MAX_LEVEL : tier === current ? level : 0;
        const atk = gearAtk(tier, shownLevel);
        const sure = tier < confirmed ? " · 확정" : "";
        let button;
        if (tier < current) {
          button = <button disabled>보유</button>;
        } else if (tier === current) {
          const cost = gearLevelCostFor(state, tier, level);
          const maxed = level >= GEAR_MAX_LEVEL;
          button = (
            <button disabled={maxed || state.gold.lt(cost)} onClick={() => store.do({ k: "levelGear" })}>
              {maxed ? "최대" : <>+1<br />{formatBig(cost)}</>}
            </button>
          );
        } else {
          const price = gearPriceFor(state, tier);
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
              <div className="sub">LV.{shownLevel}/{GEAR_MAX_LEVEL} · ATK {formatBig(atk)}{sure}</div>
            </div>
            {button}
          </div>
        );
      })}
    </>
  );
}
