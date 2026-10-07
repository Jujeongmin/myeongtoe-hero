import { t } from "../i18n";
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
        <b>{t("박부장 아파트")}</b> {t("{n}평", { n: state.apartment })}
        <div className="sub">{t("10평마다 데미지 2배 · 지금 ×{mult}", { mult: apartmentDamage(state.apartment) })}</div>
      </div>
      <button disabled={state.gems < cost} onClick={() => store.do({ k: "expandApartment" })}>
        {t("+1평")}<br /><Amount icon="gem" value={cost} />
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
              <span className="locked-name"><Icon name="lock" size={16} /> {t(r.name)}</span>
              <span className="sub">{t("{floor}층 도달 시", { floor: r.unlockFloor })}</span>
            </div>
          );
        }
        const level = relicLevel(state, r.id);
        const cost = relicLevelCost(level);
        return (
          <div key={r.id} className="row">
            <span className="icon-box"><Icon name={r.id} /></span>
            <div className="grow">
              <b>{t(r.name)}</b> Lv{level}
              <div className="sub">{t("{text} / 레벨", { text: t(r.text) })}</div>
            </div>
            <button disabled={state.gems < cost} onClick={() => store.do({ k: "levelRelic", id: r.id })}>
              {t("레벨업")}<br /><Amount icon="gem" value={cost} />
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
            <span className="icon-box"><Icon name={`o_${p.key}`} /></span>
            <div className="grow">
              <b>{t(p.name)}</b> {t("{n}등급", { n: grade })}
              <div className="sub">{t("{text} / 등급", { text: t(p.text) })}</div>
            </div>
            <button disabled={maxed || state.coupons < cost} onClick={() => store.do({ k: "upgradeOffice", part: p.key })}>
              {maxed ? t("최대") : <>{t("업그레이드")}<br /><Amount icon="coupon" value={cost} /></>}
            </button>
          </div>
        );
      })}
    </>
  );
}
