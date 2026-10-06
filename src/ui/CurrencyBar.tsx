import { formatBig, formatCount } from "../../shared/format";
import type { GameState } from "../../shared/state";
import { Icon } from "./Icon";

// Along the bottom of the battle screen, over the scene: 골드, 응시권, 보석, 상품권.
export function CurrencyBar({ state }: { state: GameState }) {
  return (
    <div className="currency">
      <span><Icon name="gold" size={16} /> {formatBig(state.gold)}</span>
      <span><Icon name="ticket" size={16} /> {formatCount(state.tickets)}</span>
      <span><Icon name="gem" size={16} /> {state.gems}</span>
      <span><Icon name="coupon" size={16} /> {state.coupons}</span>
    </div>
  );
}
