import { MONSTERS_PER_FLOOR, departmentOf, isBoss } from "../../shared/data/floors";
import { targetSec } from "../../shared/settle";
import { PRESTIGE_MIN_FLOOR } from "../../shared/data/prestige";
import { useState } from "react";
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

export type SheetId = "prestige" | "suits" | "apartment" | "relics" | "office" | "missions" | "ranking" | "settings" | "story";

// The battle scene (BattleCanvas) with the screen's controls over it: the three buffs and 2× speed
// small in a row top left, title and floor top centre, a MENU button top right that opens
// everything else, the job-change button bottom left and the step mission bottom right. The
// monster's health bar is drawn over the monster by the canvas.
const SIDE: { id: SheetId; icon: string; label: string }[] = [
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

  return (
    <section className="battle">
      <BattleCanvas state={state} />
      <header className="battle-head">
        <div>마왕그룹 {departmentOf(floor)}</div>
        <div className="floor-no">{floor}층{farming ? " · 파밍 중" : ""}</div>
        {farming && (
          <div className="boss-need">
            보스 도전에 공격력 {formatBig(atk.mulN(Math.max(1.01, targetSec(floor, MONSTERS_PER_FLOOR - 1, power) / power.bossLimitSec)))} 필요
            <br />지금 {formatBig(atk)}
          </div>
        )}
        {boss && <div className="boss-timer"><Icon name="timer" size={16} /> 보스 {bossLeft}초</div>}
      </header>
      <div className="top-left">
        <BuffBar state={state} store={store} onShop={() => onGo({ tab: "shop" })} />
        <SpeedButton state={state} store={store} />
      </div>
      <div className="side-menu">
        <button className={`menu-btn${menuOpen ? " on" : ""}`} aria-label="메뉴" onClick={() => setMenuOpen(!menuOpen)}>
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
                {s.label}
                {s.id === "missions" && missionsWaiting(state) && <i className="dot" />}
              </button>
            ))}
          </div>
        )}
      </div>
      <button className="prestige-btn" onClick={() => onOpen("prestige")}>
        이직
        <small>{ready ? <Amount icon="ticket" value={`+${formatCount(reward.tickets)}`} /> : `${PRESTIGE_MIN_FLOOR}층부터`}</small>
      </button>
      <MissionCard state={state} store={store} onGo={onGo} />
      <CurrencyBar state={state} />
    </section>
  );
}
