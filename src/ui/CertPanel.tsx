import { CERTS, CERT_KIND_TEXT, certDrawCost, certLevelCost, certTierOpen, type CertDef } from "../../shared/data/certs";
import type { GameState } from "../../shared/state";
import type { GameStore } from "../game/store";

function effectText(def: CertDef, level: number): string {
  const total = def.perLevel * level;
  if (def.kind === "offline") return `${CERT_KIND_TEXT[def.kind]} +${Math.round(total / 60)}분`;
  return `${CERT_KIND_TEXT[def.kind]} +${Math.round(total * 1000) / 10}%`;
}

export function CertPanel({ state, store }: { state: GameState; store: GameStore }) {
  const owned = Object.keys(state.certs).length;
  const open = certTierOpen(owned);
  const left = CERTS.filter((c) => c.tier <= open && !(c.id in state.certs)).length;
  const drawCost = certDrawCost(owned);
  return (
    <>
      <div className="row">
        <div className="grow">
          <b>자격증 시험</b> 보유 {owned}/{CERTS.length}
          <div className="sub">{open}차 시험까지 응시 가능 · 남은 자격증 {left}종</div>
        </div>
        <button disabled={left === 0 || state.tickets < drawCost} onClick={() => store.do({ k: "buyCert" })}>
          응시<br />📝 {drawCost}
        </button>
      </div>
      {CERTS.filter((c) => c.id in state.certs).map((def) => {
        const level = state.certs[def.id];
        const cost = certLevelCost(def, level);
        return (
          <div key={def.id} className="row">
            <div className="grow">
              <b>{def.name}</b> <span className={`tier t${def.tier}`}>{def.tier}차</span> Lv{level}
              <div className="sub">{effectText(def, level)}</div>
            </div>
            <button disabled={state.tickets < cost} onClick={() => store.do({ k: "levelCert", id: def.id })}>
              레벨업<br />📝 {cost}
            </button>
          </div>
        );
      })}
    </>
  );
}
