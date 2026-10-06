import { formatBig, formatCount } from "../../shared/format";
import type { GameState } from "../../shared/state";
import { Icon } from "./Icon";

// Along the bottom of the battle screen, over the scene: 골드, 응시권, 보석, 상품권.
export function CurrencyBar({ state }: { state: GameState }) {
  return (
    <div className="currency">
      <span><Icon name="gold" /> {formatBig(state.gold)}</span>
      <span><Icon name="ticket" /> {formatCount(state.tickets)}</span>
      <span><Icon name="gem" /> {state.gems}</span>
      <span><Icon name="coupon" /> {state.coupons}</span>
    </div>
  );
}
