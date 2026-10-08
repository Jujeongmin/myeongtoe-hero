import { useEffect, useRef, useState } from "react";
import type { Big } from "../../shared/big";
import { formatBig, formatCount } from "../../shared/format";
import { coinsInFlight, onCoinLanded } from "../game/coins";
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
  const gold = useLandedGold(state.gold);
  return (
    <div className="currency">
      <span><Icon name="gold" /> {formatBig(gold)}<PlusButton onClick={() => getMore("gems")} /></span>
      <span><Icon name="ticket" /> {formatCount(state.tickets)}</span>
      <span><Icon name="gem" /> {state.gems}<PlusButton onClick={() => getMore("vx")} /></span>
      <span><Icon name="coupon" /> {state.coupons}<PlusButton onClick={() => getMore("ads")} /></span>
    </div>
  );
}

// The gold shown: a rise waits for the coins in the air to land (each landing shows the latest
// total), so the number goes up as the coins arrive; spending, and gold with no coins (side jobs),
// shows at once.
function useLandedGold(gold: Big): Big {
  const [shown, setShown] = useState(gold);
  const latest = useRef(gold);
  latest.current = gold;
  useEffect(() => onCoinLanded(() => setShown(latest.current)), []);
  useEffect(() => {
    if (gold.cmp(shown) <= 0 || coinsInFlight() === 0) setShown(gold);
  }, [gold, shown]);
  return shown;
}
