import { formatBig, formatCount } from "../../shared/format";
import type { GameState } from "../../shared/state";

// Under the battle screen: 골드, 응시권, 보석, 상품권.
export function CurrencyBar({ state }: { state: GameState }) {
  return (
    <div className="currency">
      <span>💰 {formatBig(state.gold)}</span>
      <span>📝 {formatCount(state.tickets)}</span>
      <span>💎 {state.gems}</span>
      <span>🎟 {state.coupons}</span>
    </div>
  );
}
