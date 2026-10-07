import { formatBig, formatCount } from "../../shared/format";
import type { GameState } from "../../shared/state";
import { t } from "../i18n";
import { Icon } from "./Icon";

// Where a currency's "+" leads in the shop: 골드 to what 보석 buy, 보석 to the VX products,
// 상품권 to the rewarded ads (the coupon ad).
export type ShopTab = "gems" | "ads" | "vx";
export type GetMore = (tab: ShopTab) => void;

// The "+" at the end of a currency's counter: it opens that currency's part of the shop.
export function PlusButton({ onClick }: { onClick: () => void }) {
  return <button className="plus-btn" aria-label={t("충전")} onClick={onClick} />;
}

// Along the bottom of the battle screen, over the scene: 골드, 응시권, 보석, 상품권 (all but 응시권
// with a "+" to the shop).
export function CurrencyBar({ state, getMore }: { state: GameState; getMore: GetMore }) {
  return (
    <div className="currency">
      <span><Icon name="gold" /> {formatBig(state.gold)}<PlusButton onClick={() => getMore("gems")} /></span>
      <span><Icon name="ticket" /> {formatCount(state.tickets)}</span>
      <span><Icon name="gem" /> {state.gems}<PlusButton onClick={() => getMore("vx")} /></span>
      <span><Icon name="coupon" /> {state.coupons}<PlusButton onClick={() => getMore("ads")} /></span>
    </div>
  );
}
