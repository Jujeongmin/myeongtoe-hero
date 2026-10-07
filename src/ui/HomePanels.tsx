import { OFFICE_PARTS, apartmentCost, apartmentDamage, officeUpgradeCost } from "../../shared/data/home";
import { RELICS, relicLevelCost } from "../../shared/data/relics";
import { relicLevel } from "../../shared/mods";
import { OFFICE_MAX_GRADE, type GameState } from "../../shared/state";
import type { GameStore } from "../game/store";
import { Amount } from "./Amount";
import { Icon } from "./Icon";

type Props = { state: GameState; store: GameStore };

export function ApartmentPanel({ state, store }: Props) {
  const cost = apartmentCost(state.apartment);
  return (
    <div className="row">
      <div className="grow">
        <b>박부장 아파트</b> {state.apartment}평
        <div className="sub">10평마다 데미지 2배 · 지금 ×{apartmentDamage(state.apartment)}</div>
      </div>
      <button disabled={state.gems < cost} onClick={() => store.do({ k: "expandApartment" })}>
        +1평<br /><Amount icon="gem" value={cost} />
      </button>
    </div>
  );
}

export function RelicPanel({ state, store }: Props) {
  return (
    <>
      {RELICS.map((r) => {
        if (state.bestFloor < r.unlockFloor) {
          return (
            <div key={r.id} className="row locked">
              <span className="locked-name"><Icon name="lock" size={16} /> {r.name}</span>
              <span className="sub">{r.unlockFloor}층 도달 시</span>
            </div>
          );
        }
        const level = relicLevel(state, r.id);
        const cost = relicLevelCost(level);
        return (
          <div key={r.id} className="row">
            <div className="grow">
              <b>{r.name}</b> Lv{level}
              <div className="sub">{r.text} / 레벨</div>
            </div>
            <button disabled={state.gems < cost} onClick={() => store.do({ k: "levelRelic", id: r.id })}>
              레벨업<br /><Amount icon="gem" value={cost} />
            </button>
          </div>
        );
      })}
    </>
  );
}

export function OfficePanel({ state, store }: Props) {
  return (
    <>
      {OFFICE_PARTS.map((p) => {
        const grade = state.office[p.key];
        const maxed = grade >= OFFICE_MAX_GRADE;
        const cost = officeUpgradeCost(grade);
        return (
          <div key={p.key} className="row">
            <div className="grow">
              <b>{p.name}</b> {grade}등급
              <div className="sub">{p.text} / 등급</div>
            </div>
            <button disabled={maxed || state.coupons < cost} onClick={() => store.do({ k: "upgradeOffice", part: p.key })}>
              {maxed ? "최대" : <>업그레이드<br /><Amount icon="coupon" value={cost} /></>}
            </button>
          </div>
        );
      })}
    </>
  );
}
