import { PETS, PET_BOX_COUPONS, awakenStage, petLevelCost } from "../../shared/data/pets";
import { petLevel } from "../../shared/mods";
import type { GameState } from "../../shared/state";
import type { GameStore } from "../game/store";

export function PetPanel({ state, store }: { state: GameState; store: GameStore }) {
  const stage = awakenStage(state.bestFloor);
  const joined = PETS.filter((p) => state.bestFloor >= p.unlockFloor).length;
  return (
    <>
      <div className="row">
        <div className="grow">
          <b>동료 상자</b> 함께하는 동료 {joined}/{PETS.length}
          <div className="sub">랜덤 동료 1명 레벨 +1 · 각성 {stage}단계</div>
        </div>
        <button disabled={joined === 0 || state.coupons < PET_BOX_COUPONS} onClick={() => store.do({ k: "petBox" })}>
          열기<br />🎟 {PET_BOX_COUPONS}
        </button>
      </div>
      {PETS.map((pet) => {
        if (state.bestFloor < pet.unlockFloor) {
          return (
            <div key={pet.id} className="row locked">
              <span>🔒 {pet.name}</span>
              <span className="sub">{pet.unlockFloor}층 도달 시 합류</span>
            </div>
          );
        }
        const level = petLevel(state, pet.id);
        const cost = petLevelCost(level);
        return (
          <div key={pet.id} className="row">
            <div className="grow">
              <b>{pet.name}</b> Lv{level}
              <div className="sub">{pet.text}</div>
            </div>
            <button disabled={state.gems < cost} onClick={() => store.do({ k: "levelPet", id: pet.id })}>
              레벨업<br />💎 {cost}
            </button>
          </div>
        );
      })}
    </>
  );
}
