import { OFFICE_PARTS, SUIT_ITEMS, SUIT_PARTS, SUIT_SETS, apartmentCost, apartmentDamage, officeUpgradeCost, suitSetWorn } from "../../shared/data/home";
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

// Worn parts are what count (and what step 7 draws on Park).
export function SuitPanel({ state, store }: Props) {
  return (
    <>
      <div className="sub">
        착용 중: {SUIT_PARTS.map((p) => SUIT_ITEMS.find((i) => i.id === state.wear[p.key])?.name ?? `${p.name} 없음`).join(" · ")}
      </div>
      {SUIT_SETS.map((set) => (
        <div key={set.set} className="suit-set">
          <div className="sub">
            <b>{set.name} 세트</b> · 6부위 착용 시 {set.bonus} {suitSetWorn(state.wear, set.set) && "(적용 중)"}
          </div>
          <div className="suit-grid">
            {SUIT_ITEMS.filter((i) => i.set === set.set).map((item) => {
              const owned = state.suits.includes(item.id);
              const worn = state.wear[item.part] === item.id;
              const label = item.name.split(" ").pop();
              if (worn) {
                return (
                  <button key={item.id} className="worn" disabled>
                    {label}<br />착용 중
                  </button>
                );
              }
              if (owned) {
                return (
                  <button key={item.id} className="owned" onClick={() => store.do({ k: "wearSuit", id: item.id })}>
                    {label}<br />착용
                  </button>
                );
              }
              return (
                <button key={item.id} disabled={state.coupons < item.price} onClick={() => store.do({ k: "buySuit", id: item.id })}>
                  {label}<br /><Amount icon="coupon" value={item.price} />
                </button>
              );
            })}
          </div>
        </div>
      ))}
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
