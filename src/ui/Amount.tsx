import type { Reward } from "../../shared/data/missions";
import { Icon } from "./Icon";

export type Currency = "gold" | "ticket" | "gem" | "coupon";

// A price or a reward: the currency's pixel icon and the number. At 16px the icon's small drawing
// is used; from 24px on, the full one the battle screen's currency row shows.
export function Amount({ icon, value, size = 16 }: { icon: Currency; value: string | number; size?: number }) {
  return (
    <span className="amount">
      <Icon name={icon} size={size} />
      {value}
    </span>
  );
}

export function RewardView({ reward, size }: { reward: Reward; size?: number }) {
  return (
    <span className="amounts">
      {reward.gems ? <Amount icon="gem" value={reward.gems} size={size} /> : null}
      {reward.tickets ? <Amount icon="ticket" value={reward.tickets} size={size} /> : null}
      {reward.coupons ? <Amount icon="coupon" value={reward.coupons} size={size} /> : null}
    </span>
  );
}
