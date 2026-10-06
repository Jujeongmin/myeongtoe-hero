import { useEffect, useRef } from "react";
import { departmentOf, isBossFloor, targetsOn } from "../../shared/data/floors";
import { PRESTIGE_MIN_FLOOR } from "../../shared/data/prestige";
import { formatCount } from "../../shared/format";
import { skillsUnlocked } from "../../shared/data/skills";
import { targetSec } from "../../shared/settle";
import type { GameState } from "../../shared/state";
import { heroPower, jobChangeReward } from "../../shared/stats";
import type { GameStore } from "../game/store";
import { MissionCard } from "./MissionCard";

export type SheetId = "prestige" | "suits" | "apartment" | "relics" | "office" | "missions" | "ranking" | "settings";

// Gray-box stand-in for the step 7 sprite renderer: low-res canvas, scaled up crisp. The layout
// puts title and floor bar on top, ranking and settings top left, the side icons on the right, the
// job-change button bottom left and the step mission bottom right.
const W = 160;
const H = 96;

const SIDE: { id: SheetId; icon: string; label: string }[] = [
  { id: "suits", icon: "👔", label: "정장" },
  { id: "apartment", icon: "🏠", label: "아파트" },
  { id: "relics", icon: "🏅", label: "기념품" },
  { id: "office", icon: "🖥", label: "사무용품" },
];

export function Battle({ state, store, onOpen }: { state: GameState; store: GameStore; onOpen: (id: SheetId) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { floor, target, carrySec, farming, maxFloor } = state.run;
  const power = heroPower(state);
  const boss = isBossFloor(floor) && !farming;
  const bossLeft = Math.max(0, Math.ceil(power.bossLimitSec - carrySec));
  const skills = skillsUnlocked(state.bestFloor);
  const ready = maxFloor >= PRESTIGE_MIN_FLOOR;
  const reward = jobChangeReward(state);

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const perKill = targetSec(floor, power) + power.walkSec;
    const left = Number.isFinite(perKill) ? Math.max(0, 1 - carrySec / perKill) : 1;
    ctx.fillStyle = "#3d5a80";
    ctx.fillRect(0, 0, W, H * 0.65);
    ctx.fillStyle = "#6b4f2a";
    ctx.fillRect(0, H * 0.65, W, H * 0.35);
    ctx.fillStyle = "#e9c46a";
    ctx.fillRect(40, 44, 14, 18);
    ctx.fillStyle = boss ? "#d62828" : "#9d4edd";
    ctx.fillRect(boss ? 100 : 104, boss ? 38 : 46, boss ? 24 : 16, boss ? 24 : 16);
    ctx.fillStyle = "#400";
    ctx.fillRect(96, 66, 32, 3);
    ctx.fillStyle = "#e63946";
    ctx.fillRect(96, 66, 32 * left, 3);
  });

  return (
    <section className="battle">
      <canvas ref={ref} width={W} height={H} />
      <header className="battle-head">
        <div>마왕그룹 {departmentOf(floor)}</div>
        <div className="floor-no">{floor}층{farming ? " · 파밍 중" : ""}</div>
        <div className="floor-bar">
          <i style={{ width: `${(Math.min(target, targetsOn(floor)) / targetsOn(floor)) * 100}%` }} />
        </div>
        {boss && <div className="boss-timer">⏱ 보스 {bossLeft}초</div>}
      </header>
      <div className="top-icons">
        <button onClick={() => onOpen("ranking")} aria-label="랭킹">🏆</button>
        <button onClick={() => onOpen("settings")} aria-label="설정">⚙</button>
      </div>
      <div className="side-icons">
        {SIDE.map((s) => (
          <button key={s.id} onClick={() => onOpen(s.id)}>
            <span>{s.icon}</span>
            {s.label}
          </button>
        ))}
      </div>
      <button className="prestige-btn" onClick={() => onOpen("prestige")}>
        이직
        <small>{ready ? `📝 +${formatCount(reward.tickets)}` : `${PRESTIGE_MIN_FLOOR}층부터`}</small>
      </button>
      <MissionCard state={state} store={store} onOpen={() => onOpen("missions")} />
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
