import { useRef } from "react";
import { formatBig } from "../../shared/format";
import type { GameState } from "../../shared/state";

const DOUBLE_TAP_MS = 400;

// Against screen burn-in while the game is left running: black, only the floor and gold, small.
// Two taps close it. The game keeps going underneath.
export function ScreenLock({ state, onClose }: { state: GameState; onClose: () => void }) {
  const last = useRef(0);
  const tap = () => {
    const now = Date.now();
    if (now - last.current < DOUBLE_TAP_MS) onClose();
    last.current = now;
  };
  return (
    <div className="screen-lock" onClick={tap}>
      <div className="sub">{state.run.floor}층 · 골드 {formatBig(state.gold)}</div>
      <div className="sub">두 번 탭하면 돌아가요</div>
    </div>
  );
}

// Settings: for now the screen lock.
export function SettingsPanel({ onLock }: { onLock: () => void }) {
  return (
    <div className="row">
      <div className="grow">
        화면 잠금
        <div className="sub">켜 둔 채로 둘 때 화면을 어둡게 해요. 게임은 계속 진행돼요.</div>
      </div>
      <button onClick={onLock}>잠금</button>
    </div>
  );
}
