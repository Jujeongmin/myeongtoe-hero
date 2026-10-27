import { t } from "../i18n";
import { PETS, PET_BOX_COUPONS, awakenStage, petBoxChance, petLevelCost } from "../../shared/data/pets";
import { petEffect, petLevel, petMaxLevel } from "../../shared/mods";
import type { GameState } from "../../shared/state";
import type { GameStore } from "../game/store";
import { Amount } from "./Amount";
import { Icon } from "./Icon";

// What a colleague does at a level, in its own words with the rules' number (shared/mods petEffect).
function effectLine(state: GameState, id: string, level: number): string {
  const { text, value } = petEffect(state, id, level);
  return t(text, { v: String(Math.round(value * 100) / 100) });
}

export function PetPanel({ state, store }: { state: GameState; store: GameStore }) {
  const stage = awakenStage(state.bestFloor);
  const joined = PETS.filter((p) => state.bestFloor >= p.unlockFloor).length;
  // The box levels one of the joined colleagues still below their max, each as likely.
  const boxable = PETS.filter((p) => state.bestFloor >= p.unlockFloor && petLevel(state, p.id) < petMaxLevel(state, p.id)).length;
  return (
    <>
      <div className="row">
        <div className="grow">
          <b>{t("동료 상자")}</b> {t("함께하는 동료 {n}/{total}", { n: joined, total: PETS.length })}
          <div className="sub">{t("랜덤 동료 1명 레벨 +1 · 각성 {n}단계", { n: stage })}</div>
          {boxable > 0 && <div className="sub">{t("확률: 함께하는 동료마다 {p}%", { p: petBoxChance(boxable) })}</div>}
        </div>
        <button className={boxable === 0 || state.coupons < PET_BOX_COUPONS ? "" : "hot"} disabled={boxable === 0 || state.coupons < PET_BOX_COUPONS} onClick={() => store.do({ k: "petBox" })}>
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
        const maxed = level >= petMaxLevel(state, pet.id);
        return (
          <div key={pet.id} className="row">
            <div className="grow">
              <b>{t(pet.name)}</b> Lv{level}
              <div className="sub">{effectLine(state, pet.id, level)}</div>
              {!maxed && <div className="sub pet-next">{t("다음 Lv")}: {effectLine(state, pet.id, level + 1)}</div>}
            </div>
            {maxed ? (
              <button disabled>MAX</button>
            ) : (
              <button className={state.gems < cost ? "" : "hot"} disabled={state.gems < cost} onClick={() => store.do({ k: "levelPet", id: pet.id })}>
                {t("레벨업")}<br /><Amount icon="gem" value={cost} />
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}
