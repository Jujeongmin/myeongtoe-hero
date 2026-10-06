import { formatBig } from "../../shared/format";
import type { GameState } from "../../shared/state";

// Under the battle screen, as in the original (골드, 열쇠, 보석 → 골드, 응시권, 보석, 상품권).
export function CurrencyBar({ state }: { state: GameState }) {
  return (
    <div className="currency">
      <span>💰 {formatBig(state.gold)}</span>
      <span>📝 {state.tickets}</span>
      <span>💎 {state.gems}</span>
      <span>🎟 {state.coupons}</span>
    </div>
  );
}
