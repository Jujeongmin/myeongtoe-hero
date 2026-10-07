import { formatBig, formatCount } from "../../shared/format";
import type { GameState } from "../../shared/state";
import { t } from "../i18n";
import { Icon } from "./Icon";

// The "+" at the end of a paid currency's counter: it opens the shop.
export function PlusButton({ onShop }: { onShop: () => void }) {
  return <button className="plus-btn" aria-label={t("충전")} onClick={onShop} />;
}

// Along the bottom of the battle screen, over the scene: 골드, 응시권, 보석, 상품권 (the last two
// with a "+" to the shop).
export function CurrencyBar({ state, onShop }: { state: GameState; onShop: () => void }) {
  return (
    <div className="currency">
      <span><Icon name="gold" /> {formatBig(state.gold)}</span>
      <span><Icon name="ticket" /> {formatCount(state.tickets)}</span>
      <span><Icon name="gem" /> {state.gems}<PlusButton onShop={onShop} /></span>
      <span><Icon name="coupon" /> {state.coupons}<PlusButton onShop={onShop} /></span>
    </div>
  );
}
