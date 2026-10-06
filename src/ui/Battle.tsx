import { departmentOf, isBossFloor, targetsOn } from "../../shared/data/floors";
import { PRESTIGE_MIN_FLOOR } from "../../shared/data/prestige";
import { formatCount } from "../../shared/format";
import { skillsUnlocked } from "../../shared/data/skills";
import type { GameState } from "../../shared/state";
import { heroPower, jobChangeReward } from "../../shared/stats";
import type { GameStore } from "../game/store";
import { BattleCanvas } from "./BattleCanvas";
import { Icon } from "./Icon";
import { MissionCard, missionsWaiting, type MissionPlace } from "./MissionCard";

export type SheetId = "prestige" | "suits" | "apartment" | "relics" | "office" | "missions" | "ranking" | "settings";

// The battle scene (BattleCanvas) with the screen's controls over it: title and floor bar on top,
// missions, ranking and settings top left, the side icons on the right, the job-change button
// bottom left and the step mission bottom right.
const SIDE: { id: SheetId; icon: string; label: string }[] = [
  { id: "suits", icon: "side_suits", label: "정장" },
  { id: "apartment", icon: "side_apartment", label: "아파트" },
  { id: "relics", icon: "side_relics", label: "기념품" },
  { id: "office", icon: "side_office", label: "사무용품" },
];

export function Battle({ state, store, onOpen, onGo }: {
  state: GameState; store: GameStore; onOpen: (id: SheetId) => void; onGo: (p: MissionPlace) => void;
}) {
  const { floor, target, carrySec, farming, maxFloor } = state.run;
  const power = heroPower(state);
  const boss = isBossFloor(floor) && !farming;
  const bossLeft = Math.max(0, Math.ceil(power.bossLimitSec - carrySec));
  const skills = skillsUnlocked(state.bestFloor);
  const ready = maxFloor >= PRESTIGE_MIN_FLOOR;
  const reward = jobChangeReward(state);

  return (
    <section className="battle">
      <BattleCanvas state={state} />
      <header className="battle-head">
        <div>마왕그룹 {departmentOf(floor)}</div>
        <div className="floor-no">{floor}층{farming ? " · 파밍 중" : ""}</div>
        <div className="floor-bar">
          <i style={{ width: `${(Math.min(target, targetsOn(floor)) / targetsOn(floor)) * 100}%` }} />
        </div>
        {boss && <div className="boss-timer">⏱ 보스 {bossLeft}초</div>}
      </header>
      <div className="top-icons">
        <button onClick={() => onOpen("missions")} aria-label="미션">
          📋{missionsWaiting(state) && <i className="dot" />}
        </button>
        <button onClick={() => onOpen("ranking")} aria-label="랭킹">🏆</button>
        <button onClick={() => onOpen("settings")} aria-label="설정">⚙</button>
      </div>
      <div className="side-icons">
        {SIDE.map((s) => (
          <button key={s.id} onClick={() => onOpen(s.id)}>
            <Icon name={s.icon} />
            {s.label}
          </button>
        ))}
      </div>
      <button className="prestige-btn" onClick={() => onOpen("prestige")}>
        이직
        <small>{ready ? `📝 +${formatCount(reward.tickets)}` : `${PRESTIGE_MIN_FLOOR}층부터`}</small>
      </button>
      <MissionCard state={state} store={store} onGo={onGo} />
      {skills.length > 0 && (
        <div className="skills">
          {skills.map((s) => (
            <span key={s.id}>{s.name}</span>
          ))}
        </div>
      )}
    </section>
  );
}
