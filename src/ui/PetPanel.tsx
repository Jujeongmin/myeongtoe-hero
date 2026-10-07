import { t } from "../i18n";
import { PETS, PET_BOX_COUPONS, awakenStage, petBoxChance, petLevelCost } from "../../shared/data/pets";
import { petLevel } from "../../shared/mods";
import type { GameState } from "../../shared/state";
import type { GameStore } from "../game/store";
import { Amount } from "./Amount";
import { Icon } from "./Icon";

export function PetPanel({ state, store }: { state: GameState; store: GameStore }) {
  const stage = awakenStage(state.bestFloor);
  const joined = PETS.filter((p) => state.bestFloor >= p.unlockFloor).length;
  return (
    <>
      <div className="row">
        <div className="grow">
          <b>{t("동료 상자")}</b> {t("함께하는 동료 {n}/{total}", { n: joined, total: PETS.length })}
          <div className="sub">{t("랜덤 동료 1명 레벨 +1 · 각성 {n}단계", { n: stage })}</div>
          {joined > 0 && <div className="sub">{t("확률: 함께하는 동료마다 {p}%", { p: petBoxChance(joined) })}</div>}
        </div>
        <button disabled={joined === 0 || state.coupons < PET_BOX_COUPONS} onClick={() => store.do({ k: "petBox" })}>
          {t("열기")}<br /><Amount icon="coupon" value={PET_BOX_COUPONS} />
        </button>
      </div>
      {PETS.map((pet) => {
        if (state.bestFloor < pet.unlockFloor) {
          return (
            <div key={pet.id} className="row locked">
              <span className="locked-name"><Icon name="lock" size={16} /> {t(pet.name)}</span>
              <span className="sub">{t("{floor}층 도달 시 합류", { floor: pet.unlockFloor })}</span>
            </div>
          );
        }
        const level = petLevel(state, pet.id);
        const cost = petLevelCost(level);
        return (
          <div key={pet.id} className="row">
            <div className="grow">
              <b>{t(pet.name)}</b> Lv{level}
              <div className="sub">{t(pet.text)}</div>
            </div>
            <button disabled={state.gems < cost} onClick={() => store.do({ k: "levelPet", id: pet.id })}>
              {t("레벨업")}<br /><Amount icon="gem" value={cost} />
            </button>
          </div>
        );
      })}
    </>
  );
}
