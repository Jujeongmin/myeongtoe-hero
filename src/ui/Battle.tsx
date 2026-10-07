import { t } from "../i18n";
import { MONSTERS_PER_FLOOR, departmentOf, isBoss } from "../../shared/data/floors";
import { PARK_RUN_SEC } from "../../shared/data/parking";
import { monsterFor } from "../game/sprites";
import { SpriteThumb } from "./SpriteThumb";
import { PixelBar } from "./PixelBar";
import { PRESTIGE_MIN_FLOOR } from "../../shared/data/prestige";
import { useEffect, useRef, useState } from "react";
import { formatBig, formatCount } from "../../shared/format";
import type { GameState } from "../../shared/state";
import { heroAtk, heroPower, jobChangeReward } from "../../shared/stats";
import type { GameStore } from "../game/store";
import { BattleCanvas } from "./BattleCanvas";
import { Icon } from "./Icon";
import { MissionCard, missionsWaiting, type MissionPlace } from "./MissionCard";
import { BuffBar } from "./BuffBar";
import { SpeedButton } from "./SpeedButton";
import { Amount } from "./Amount";
import { CurrencyBar } from "./CurrencyBar";

export type SheetId = "profile" | "prestige" | "suits" | "apartment" | "relics" | "office" | "missions" | "ranking" | "settings" | "story";

// The battle scene (BattleCanvas) with the screen's controls over it: the three buffs and 2× speed
// small in a row top left, title and floor top centre, a MENU button top right that opens
// everything else, the job-change button bottom left and the step mission bottom right. The
// monster's health bar is drawn over the monster by the canvas.
const SIDE: { id: SheetId; icon: string; label: string }[] = [
  { id: "profile", icon: "side_profile", label: "프로필" },
  { id: "missions", icon: "missions", label: "미션" },
  { id: "ranking", icon: "rank", label: "랭킹" },
  { id: "settings", icon: "settings", label: "설정" },
  { id: "suits", icon: "side_suits", label: "코스튬" },
  { id: "apartment", icon: "side_apartment", label: "아파트" },
  { id: "relics", icon: "side_relics", label: "기념품" },
  { id: "office", icon: "side_office", label: "사무용품" },
  { id: "story", icon: "story", label: "스토리" },
];

export function Battle({ state, store, onOpen, onGo }: {
  state: GameState; store: GameStore; onOpen: (id: SheetId) => void; onGo: (p: MissionPlace) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { floor, target, carrySec, farming, maxFloor } = state.run;
  const power = heroPower(state);
  const atk = heroAtk(state);
  const boss = isBoss(target) && !farming;
  const bossLeft = Math.max(0, Math.ceil(power.bossLimitSec - carrySec));
  const ready = maxFloor >= PRESTIGE_MIN_FLOOR;
  const reward = jobChangeReward(state);
  // The floor's boss, for the 보스 도전 button.
  const bossSprite = farming ? monsterFor(departmentOf(floor), floor, MONSTERS_PER_FLOOR - 1, true) : undefined;
  // A 지하주차장 run in progress: the tower waits, the scene shows the garage.
  const parkLeft = state.parking.runUntil - state.lastTick;
  const parked = parkLeft > 0;
  // A finished run waits for its reward to be taken; then the tower goes on.
  const runResult = !parked && !state.parking.claimed ? state.parking.last : null;
  // The depth is bold in the sentence: the translation's text either side of {depth}.
  const wentDown = t("30초 동안 {depth}까지 내려갔어요").split("{depth}");

  return (
    <section className="battle">
      <BattleCanvas state={state} />
      <header className="battle-head">
        {parked ? (
          <>
            <span>{t("지하주차장")}</span>
            <span className="boss-timer"><Icon name="timer" size={16} /><PixelBar kind="progress" value={parkLeft / (PARK_RUN_SEC * 1000)} /></span>
          </>
        ) : (
          <span>{t("{dept} {floor}층", { dept: t(departmentOf(floor)), floor })}</span>
        )}
        {!parked && farming && <span className="floor-no">{t("파밍 중")}</span>}
        {!parked && !farming && !boss && <span className="floor-no">{t("보스까지 {n}마리", { n: MONSTERS_PER_FLOOR - 1 - Math.min(target, MONSTERS_PER_FLOOR - 1) })}</span>}
        {!parked && boss && <span className="boss-timer"><Icon name="timer" size={16} /><PixelBar kind="progress" value={bossLeft / power.bossLimitSec} /></span>}
      </header>
      <div className="atk-now">{t("공격력 {atk}", { atk: formatBig(atk) })}</div>
      <div className="top-left">
        <BuffBar state={state} store={store} />
        <SpeedButton state={state} store={store} />
      </div>
      <div className="side-menu">
        <button className={`menu-btn${menuOpen ? " on" : ""}`} aria-label={t("메뉴")} onClick={() => setMenuOpen(!menuOpen)}>
          {missionsWaiting(state) && <i className="dot" />}
        </button>
        {menuOpen && (
          <div className="side-icons">
            {SIDE.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setMenuOpen(false);
                  onOpen(s.id);
                }}
              >
                <Icon name={s.icon} />
                {t(s.label)}
                {s.id === "missions" && missionsWaiting(state) && <i className="dot" />}
              </button>
            ))}
          </div>
        )}
      </div>
      <button className={`prestige-btn${ready ? " ready" : ""}`} onClick={() => onOpen("prestige")}>
        {t("이직")}
        <small>{ready ? <Amount icon="ticket" value={`+${formatCount(reward.tickets)}`} /> : t("{floor}층부터", { floor: PRESTIGE_MIN_FLOOR })}</small>
      </button>
      {farming && !parked && (
        <button className="boss-btn" onClick={() => store.do({ k: "challengeBoss" })}>
          <span className="boss-face">{bossSprite && <SpriteThumb path={bossSprite.anims.idle.file} frame={bossSprite.size} res={20} size={20} head />}</span>
          <span>{t("보스 도전!")}</span>
        </button>
      )}
      {runResult && (
        <div className="modal-back">
          <div className="modal">
            <h3>{t("주차장 탐사 끝")}</h3>
            <p>{wentDown[0]}<b>B{runResult.depth}m</b>{wentDown[1]}</p>
            <p className="sub">{t("상자 {n}개", { n: runResult.chests })}</p>
            {runResult.tickets > 0 ? <p>{t("응시권")} <Amount icon="ticket" value={formatCount(runResult.tickets)} /></p> : <p className="sub">{t("20m마다 상자가 있어요")}</p>}
            <button className="gold" onClick={() => store.do({ k: "claimParking" })}>{t("보상 받기")}</button>
          </div>
        </div>
      )}
      <MissionCard state={state} store={store} onGo={onGo} />
      <CurrencyBar state={state} onShop={() => onGo({ tab: "shop" })} />
    </section>
  );
}
