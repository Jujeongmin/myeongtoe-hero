import { t } from "../i18n";
import {
  CERTS, CERT_KIND_TEXT, CERT_LINES, certLevelCost, certOpen, certPrerequisite, certValue, certsOwned, type CertDef,
} from "../../shared/data/certs";
import { formatCount } from "../../shared/format";
import type { GameState } from "../../shared/state";
import type { GameStore } from "../game/store";
import { Amount } from "./Amount";
import { Icon } from "./Icon";
import { HoldButton } from "./HoldButton";

function pct(v: number): string {
  return v >= 1000 ? formatCount(v) : String(Math.round(v * 100) / 100);
}

function effectText(def: CertDef, level: number): string {
  const v = certValue(def, level);
  const what = t(CERT_KIND_TEXT[def.kind]);
  if (def.kind === "aspd") return t("공격 간격 -{sec}초", { sec: (0.04 * level).toFixed(2) });
  if (def.kind === "discount") return `${what} -${v}%`;
  if (def.kind === "prestigeFloors") return t("{what} +{v}층", { what, v });
  return `${what} +${pct(v)}%`;
}

function CertRow({ def, state, store }: { def: CertDef; state: GameState; store: GameStore }) {
  const level = state.certs[def.id] ?? 0;
  const maxed = level >= def.maxLevel;
  const cost = maxed ? 0 : certLevelCost(def, level);
  const have = def.currency === "gems" ? state.gems : state.tickets;
  return (
    <div className="row">
      <div className="grow">
        <b>{t(def.name)}</b>
        {def.grade > 0 && <> <span className={`tier t${def.grade}`}>{t("{n}차", { n: def.grade })}</span></>} Lv{level}/{def.maxLevel}
        <div className="sub">{effectText(def, level)}</div>
      </div>
      {maxed ? (
        <button disabled>MAX</button>
      ) : (
        <div className="buttons">
          <HoldButton disabled={have < cost} onFire={() => store.do({ k: "levelCert", id: def.id, bulk: false })}>
            {level === 0 ? t("취득") : "+1"}<br /><Amount icon={def.currency === "gems" ? "gem" : "ticket"} value={formatCount(cost)} />
          </HoldButton>
          <button disabled={have < cost} onClick={() => store.do({ k: "levelCert", id: def.id, bulk: true })}>
            {t("최대")}<br />{t("한번에")}
          </button>
        </div>
      )}
    </div>
  );
}

// 본업 자격증 show each line's highest open grade (a grade opens when the one below is maxed);
// 필수 and 이직 자격증 are always listed.
export function CertPanel({ state, store }: { state: GameState; store: GameStore }) {
  return (
    <>
      <div className="group-title">{t("본업 자격증 · 보유 {owned}/{total}", { owned: certsOwned(state.certs), total: CERTS.length })}</div>
      {CERT_LINES.map(({ line }) => {
        const grades = CERTS.filter((c) => c.kind === line);
        const top = [...grades].reverse().find((c) => certOpen(c, state.certs))!;
        const after = grades.find((c) => c.grade === top.grade + 1);
        return (
          <div key={line}>
            <CertRow def={top} state={state} store={store} />
            {after && (
              <div className="row locked">
                <span className="locked-name"><Icon name="lock" size={16} /> {t(after.name)}</span>
                <span className="sub">{t("{name} MAX 시", { name: t(certPrerequisite(after)!.name) })}</span>
              </div>
            )}
          </div>
        );
      })}
      <div className="group-title">{t("필수 자격증")}</div>
      {CERTS.filter((c) => c.group === "basic").map((def) => <CertRow key={def.id} def={def} state={state} store={store} />)}
      <div className="group-title">{t("이직 자격증 (보석)")}</div>
      {CERTS.filter((c) => c.group === "career").map((def) => <CertRow key={def.id} def={def} state={state} store={store} />)}
    </>
  );
}
