import { formatBig } from "../../shared/format";
import type { GameState } from "../../shared/state";

export function TopBar({ state }: { state: GameState }) {
  return (
    <header className="topbar">
      <span>💰 {formatBig(state.gold)}</span>
      <span>최고 {state.bestFloor}층</span>
    </header>
  );
}
