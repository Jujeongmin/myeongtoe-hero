import { departmentOf, isBossFloor, targetsOn } from "../../shared/data/floors";
import { PRESTIGE_MIN_FLOOR } from "../../shared/data/prestige";
import { useState } from "react";
import { formatCount } from "../../shared/format";
import type { GameState } from "../../shared/state";
import { heroPower, jobChangeReward } from "../../shared/stats";
import type { GameStore } from "../game/store";
import { BattleCanvas } from "./BattleCanvas";
import { Icon } from "./Icon";
import { MissionCard, missionsWaiting, type MissionPlace } from "./MissionCard";
import { PixelBar } from "./PixelBar";
import { BuffBar } from "./BuffBar";
import { SpeedButton } from "./SpeedButton";
import { Amount } from "./Amount";
import { CurrencyBar } from "./CurrencyBar";

export type SheetId = "prestige" | "suits" | "apartment" | "relics" | "office" | "missions" | "ranking" | "settings";

// The battle scene (BattleCanvas) with the screen's controls over it: title and floor bar on top,
// missions, ranking and settings top left, a 메뉴 button top right that opens the side icons, the
// job-change button bottom left and the step mission bottom right.
const SIDE: { id: SheetId; icon: string; label: string }[] = [
  { id: "suits", icon: "side_suits", label: "정장" },
  { id: "apartment", icon: "side_apartment", label: "아파트" },
  { id: "relics", icon: "side_relics", label: "기념품" },
  { id: "office", icon: "side_office", label: "사무용품" },
];

export function Battle({ state, store, onOpen, onGo }: {
  state: GameState; store: GameStore; onOpen: (id: SheetId) => void; onGo: (p: MissionPlace) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { floor, target, carrySec, farming, maxFloor } = state.run;
  const power = heroPower(state);
  const boss = isBossFloor(floor) && !farming;
  const bossLeft = Math.max(0, Math.ceil(power.bossLimitSec - carrySec));
  const ready = maxFloor >= PRESTIGE_MIN_FLOOR;
  const reward = jobChangeReward(state);

  return (
    <section className="battle">
      <BattleCanvas state={state} />
      <header className="battle-head">
        <div>마왕그룹 {departmentOf(floor)}</div>
        <div className="floor-no">{floor}층{farming ? " · 파밍 중" : ""}</div>
        <PixelBar kind="progress" value={Math.min(target, targetsOn(floor)) / targetsOn(floor)} />
        {boss && <div className="boss-timer"><Icon name="timer" size={16} /> 보스 {bossLeft}초</div>}
      </header>
      <div className="top-icons">
        <button onClick={() => onOpen("missions")} aria-label="미션">
          <Icon name="missions" />
          {missionsWaiting(state) && <i className="dot" />}
        </button>
        <button onClick={() => onOpen("ranking")} aria-label="랭킹"><Icon name="rank" /></button>
        <button onClick={() => onOpen("settings")} aria-label="설정"><Icon name="settings" /></button>
      </div>
      <SpeedButton state={state} store={store} />
      <div className="side-menu">
        <button className={`menu-btn${menuOpen ? " on" : ""}`} aria-label="메뉴" onClick={() => setMenuOpen(!menuOpen)} />
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
      <BuffBar state={state} store={store} onShop={() => onGo({ tab: "shop" })} />
    </section>
  );
}
