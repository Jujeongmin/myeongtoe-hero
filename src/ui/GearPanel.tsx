import { t } from "../i18n";
import { useState } from "react";
import { GEAR_MAX_LEVEL, GEAR_TIERS, gearAtk, gearConfirmCost } from "../../shared/data/gear";
import { formatBig } from "../../shared/format";
import { gearLevelCostFor, gearPriceFor } from "../../shared/prices";
import type { GameState } from "../../shared/state";
import { gearSprite, imageUrl } from "../game/sprites";
import type { GameStore } from "../game/store";
import { Amount } from "./Amount";
import { Icon } from "./Icon";

// 코스튬 first (the way in to the costume panel), then every tier: the ones behind owned, the current
// one to level up to 5, the next one to buy once the current is at 5, the rest waiting. A tier at
// Lv5 that is next in line for 구매확정 shows 확정 on its button; pressing it opens a panel that
// explains it and confirms.
export function GearPanel({ state, store, onSuits }: { state: GameState; store: GameStore; onSuits: () => void }) {
  const [confirming, setConfirming] = useState<number | null>(null);
  const { tier: current, level, confirmed } = state.gear;
  const atLv5 = (tier: number) => tier < current || (tier === current && level >= GEAR_MAX_LEVEL);

  return (
    <>
      <div className="row">
        <span className="icon-box"><Icon name="side_suits" /></span>
        <div className="grow">
          <b>{t("코스튬")}</b>
          <div className="sub">{t("사기만 해도 효과가 적용돼요")}</div>
        </div>
        <button className="hot" onClick={onSuits}>{t("입장하기")}</button>
      </div>
      {GEAR_TIERS.map((g, tier) => {
        const shownLevel = tier < current ? GEAR_MAX_LEVEL : tier === current ? level : 0;
        const atk = gearAtk(tier, shownLevel);
        let button;
        if (tier < confirmed) {
          button = <button disabled><Icon name="check" size={16} /> {t("확정됨")}</button>;
        } else if (tier === confirmed && atLv5(tier)) {
          button = <button className="hot" onClick={() => setConfirming(tier)}>{t("확정")}</button>;
        } else if (tier < current) {
          button = <button disabled>{t("보유")}</button>;
        } else if (tier === current) {
          const cost = gearLevelCostFor(state, tier, level);
          const maxed = level >= GEAR_MAX_LEVEL;
          button = (
            <button disabled={maxed || state.gold.lt(cost)} onClick={() => store.do({ k: "levelGear" })}>
              {maxed ? t("최대") : <>+1<br /><Amount icon="gold" value={formatBig(cost)} /></>}
            </button>
          );
        } else {
          const price = gearPriceFor(state, tier);
          const canBuy = tier === current + 1 && level >= GEAR_MAX_LEVEL;
          button = (
            <button disabled={!canBuy || state.gold.lt(price)} onClick={() => store.do({ k: "buyGear" })}>
              {t("구매")}<br /><Amount icon="gold" value={formatBig(price)} />
            </button>
          );
        }
        const sprite = gearSprite(tier);
        const src = sprite && imageUrl(`parts/gear/g${String(tier).padStart(2, "0")}.png`);
        return (
          <div key={g.id} className={`row${tier === current ? " current" : tier > current + 1 ? " far" : ""}`}>
            <span className="icon-box">{src && <img className="icon-img gear-img" src={src} alt="" draggable={false} />}</span>
            <div className="grow">
              <b>{t(g.name)}</b>
              <div className="sub">LV.{tier <= current ? shownLevel + 1 : 0}/{GEAR_MAX_LEVEL + 1} · ATK {formatBig(atk)}</div>
            </div>
            {button}
          </div>
        );
      })}
      {confirming !== null && (
        <ConfirmPanel state={state} tier={confirming} onClose={() => setConfirming(null)} onConfirm={() => {
          if (store.do({ k: "confirmGear" })) setConfirming(null);
        }} />
      )}
    </>
  );
}

function ConfirmPanel({ state, tier, onClose, onConfirm }: {
  state: GameState; tier: number; onClose: () => void; onConfirm: () => void;
}) {
  const cost = gearConfirmCost(tier);
  const afford = state.gems >= cost.gems && state.gold.gte(cost.gold);
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{t("구매확정")}</h3>
        <p>{t("확정한 장비는 이직해도 사라지지 않아요")}</p>
        <p><Amount icon="gold" value={formatBig(cost.gold)} /> <Amount icon="gem" value={cost.gems} /></p>
        <button className="gold" disabled={!afford} onClick={onConfirm}>{afford ? t("확정하기") : t("재화가 부족해요")}</button>
        <button onClick={onClose}>{t("닫기")}</button>
      </div>
    </div>
  );
}
