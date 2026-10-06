import type { Reward } from "../../shared/data/missions";
import { Icon } from "./Icon";

export type Currency = "gold" | "ticket" | "gem" | "coupon";

// A price or a reward: the currency's pixel icon and the number.
export function Amount({ icon, value }: { icon: Currency; value: string | number }) {
  return (
    <span className="amount">
      <Icon name={icon} size={16} />
      {value}
    </span>
  );
}

export function RewardView({ reward }: { reward: Reward }) {
  return (
    <span className="amounts">
      {reward.gems ? <Amount icon="gem" value={reward.gems} /> : null}
      {reward.tickets ? <Amount icon="ticket" value={reward.tickets} /> : null}
      {reward.coupons ? <Amount icon="coupon" value={reward.coupons} /> : null}
    </span>
  );
}
