import { useEffect, useRef } from "react";
import { WALK_SEC, isBossFloor, targetsOn } from "../../shared/data/floors";
import { targetSec } from "../../shared/settle";
import type { GameState } from "../../shared/state";
import { heroPower } from "../../shared/stats";

// Gray-box stand-in for the step 7 sprite renderer: low-res canvas, scaled up crisp.
const W = 160;
const H = 96;

export function Battle({ state }: { state: GameState }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const { floor, target, carrySec, farming } = state.run;

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const perKill = targetSec(floor, heroPower(state)) + WALK_SEC;
    const left = Number.isFinite(perKill) ? Math.max(0, 1 - carrySec / perKill) : 1;
    ctx.fillStyle = "#3d5a80";
    ctx.fillRect(0, 0, W, H * 0.65);
    ctx.fillStyle = "#6b4f2a";
    ctx.fillRect(0, H * 0.65, W, H * 0.35);
    ctx.fillStyle = "#e9c46a";
    ctx.fillRect(40, 44, 14, 18);
    ctx.fillStyle = isBossFloor(floor) && !farming ? "#d62828" : "#9d4edd";
    ctx.fillRect(104, 46, 16, 16);
    ctx.fillStyle = "#400";
    ctx.fillRect(40, 8, 80, 5);
    ctx.fillStyle = "#e63946";
    ctx.fillRect(40, 8, 80 * left, 5);
  });

  return (
    <section className="battle">
      <canvas ref={ref} width={W} height={H} />
      <div className="floor">
        {floor}층{farming ? " · 파밍 중" : ""} · {target + 1}/{targetsOn(floor)}
      </div>
    </section>
  );
}
