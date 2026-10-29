import { t } from "../i18n";
import { MONSTERS_PER_FLOOR, departmentOf, isBoss } from "../../shared/data/floors";
import { PARK_RUN_SEC } from "../../shared/data/parking";
import { imageUrl, monsterFor } from "../game/sprites";
import type { Big } from "../../shared/big";
import { SpriteThumb } from "./SpriteThumb";
import { PixelBar } from "./PixelBar";
import { PRESTIGE_MIN_FLOOR } from "../../shared/data/prestige";
import { useEffect, useRef, useState } from "react";
import { formatBig, formatCount } from "../../shared/format";
import type { GameState } from "../../shared/state";
import { heroAtk, heroPower, jobChangeReward } from "../../shared/stats";
import { goldPerSec } from "../../shared/settle";
import { feverActive } from "../../shared/data/fever";
import { sfx } from "../game/audio";
import type { GameStore } from "../game/store";
import { BattleCanvas } from "./BattleCanvas";
import { Icon } from "./Icon";
import { MissionCard, missionsWaiting, type MissionPlace } from "./MissionCard";
import { BuffBar } from "./BuffBar";
import { SpeedButton } from "./SpeedButton";
import { Amount } from "./Amount";
import { CurrencyBar, type GetMore } from "./CurrencyBar";

export type SheetId = "profile" | "prestige" | "suits" | "apartment" | "relics" | "office" | "missions" | "ranking" | "settings" | "story";

// The battle scene (BattleCanvas) with the screen's controls over it: the three buffs and 2× speed
// small in a row top left, title and floor top centre, a MENU button top right that opens
// everything else, the job-change button bottom left and the step mission bottom right. The
// monster's health bar is drawn over the monster by the canvas.
const SIDE: { id: SheetId; icon: string; label: string }[] = [
  { id: "profile", icon: "side_profile", label: "명함" },
  { id: "missions", icon: "missions", label: "미션" },
  { id: "ranking", icon: "rank", label: "랭킹" },
  { id: "settings", icon: "settings", label: "설정" },
  { id: "suits", icon: "side_suits", label: "코스튬" },
  { id: "apartment", icon: "side_apartment", label: "아파트" },
  { id: "relics", icon: "side_relics", label: "기념품" },
  { id: "office", icon: "side_office", label: "사무용품" },
  { id: "story", icon: "story", label: "스토리" },
];

export function Battle({ state, store, dots, onOpen, onGo, getMore }: {
  state: GameState; store: GameStore; dots: Record<string, boolean>; onOpen: (id: SheetId) => void; onGo: (p: MissionPlace) => void; getMore: GetMore;
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
      <FloorUp floor={floor} quiet={parked || feverActive(state, state.lastTick)} />
      <BossFailed floor={floor} farming={farming} />
      <AtkReadout atk={atk} tier={state.gear.tier} perSec={goldPerSec(state).total} />
      <div className="top-left">
        <BuffBar state={state} store={store} />
        <SpeedButton state={state} store={store} />
      </div>
      <div className="side-menu">
        <button className={`menu-btn${menuOpen ? " on" : ""}`} aria-label={t("메뉴")} onClick={() => setMenuOpen(!menuOpen)}>
          {(missionsWaiting(state) || Object.values(dots).some(Boolean)) && <i className="dot" />}
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
                <b className="side-label">{t(s.label)}</b>
                {((s.id === "missions" && missionsWaiting(state)) || dots[s.id]) && <i className="dot" />}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* 이직: the offer-letter icon popping out of the button. Before floor 70 a bar fills toward it;
          once open the button glows and bobs, with the 응시권 a job change would bring and the menu's red dot. */}
      <button className={`prestige-btn${ready ? " ready" : ""}`} onClick={() => onOpen("prestige")}>
        <Icon name="prestige" />
        <span className="prestige-text">
          <span className="prestige-line">
            <b>{t("연봉협상")}</b>
            {ready ? <small><Amount icon="ticket" value={`+${formatCount(reward.tickets)}`} /></small> : <small className="prestige-floor">{t("{n}/{floor}층", { n: maxFloor, floor: PRESTIGE_MIN_FLOOR })}</small>}
          </span>
          {!ready && <PixelBar kind="progress" value={maxFloor / PRESTIGE_MIN_FLOOR} />}
        </span>
        {ready && <i className="dot" />}
      </button>
      {parked && <button className="park-skip" onClick={() => store.do({ k: "skipParking" })}>{t("스킵")} ▶▶</button>}
      {farming && !parked && (
        <button className="boss-btn" onClick={() => store.do({ k: "challengeBoss" })}>
          <span className="boss-face">{bossSprite && <SpriteThumb path={bossSprite.anims.idle.file} frame={bossSprite.size} res={20} size={20} head />}</span>
          <span>{t("보스 도전!")}</span>
        </button>
      )}
      {runResult && (
        // A tap outside the panel takes the reward too.
        <div className="modal-back" onClick={(e) => e.target === e.currentTarget && store.do({ k: "claimParking" })}>
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
      <CurrencyBar state={state} getMore={getMore} />
    </section>
  );
}

// A new floor reached: "N층 도달!" pops up under the floor title for a moment, with a chime. Not
// during the fever (floors fly by) or in the garage, and not when the floor goes down (연봉협상).
function FloorUp({ floor, quiet }: { floor: number; quiet: boolean }) {
  const last = useRef(floor);
  const [shown, setShown] = useState<{ floor: number; at: number } | null>(null);
  useEffect(() => {
    if (floor > last.current && !quiet) {
      setShown({ floor, at: Date.now() });
      sfx("levelup");
    }
    last.current = floor;
  }, [floor, quiet]);
  if (!shown) return null;
  return (
    <div key={shown.at} className="floor-up" onAnimationEnd={() => setShown(null)}>
      {t("{floor}층 도달!", { floor: shown.floor })}
    </div>
  );
}

// The boss's time ran out (the run went from fighting it to farming the same floor): "도전 실패!"
// in red over the scene with a dark red flash, and how to go on.
function BossFailed({ floor, farming }: { floor: number; farming: boolean }) {
  const last = useRef({ floor, farming });
  const [shown, setShown] = useState<number | null>(null);
  useEffect(() => {
    if (farming && !last.current.farming && floor === last.current.floor) setShown(Date.now());
    last.current = { floor, farming };
  }, [floor, farming]);
  if (shown === null) return null;
  return (
    <div key={shown} className="boss-failed" onAnimationEnd={(e) => e.target === e.currentTarget && setShown(null)}>
      <b>{t("도전 실패!")}</b>
      <small>{t("시간 초과 · 강해져서 다시 도전하세요")}</small>
    </div>
  );
}

// 공격력 in a counter with Park's weapon. When it goes up, the counter bumps and the gain floats up
// out of it ("+N"), so an upgrade is felt on the battle screen too.
// 공격력, and under it the gold a second right now (side jobs and kills, as settle pays them).
function AtkReadout({ atk, tier, perSec }: { atk: Big; tier: number; perSec: Big }) {
  const last = useRef(atk);
  const [gain, setGain] = useState<{ text: string; at: number } | null>(null);
  useEffect(() => {
    if (atk.cmp(last.current) > 0) setGain({ text: `+${formatBig(atk.sub(last.current))}`, at: Date.now() });
    last.current = atk;
  }, [atk]);
  const src = imageUrl(`parts/gear/g${String(tier).padStart(2, "0")}.png`);
  return (
    <div className="atk-now">
      <div key={`box${gain?.at ?? 0}`} className={`atk-box${gain ? " up" : ""}`}>
        {src && <img className="atk-weapon" src={src} alt="" draggable={false} />}
        <span className="atk-label">{t("공격력")}</span>
        <b>{formatBig(atk)}</b>
      </div>
      {gain && <span key={`gain${gain.at}`} className="atk-gain">{gain.text}</span>}
      <div className="atk-box gps-box">
        <Icon name="gold" size={16} />
        <span className="atk-label">{t("골드 수입")}</span>
        <b>{formatBig(perSec)} / s</b>
      </div>
    </div>
  );
}
