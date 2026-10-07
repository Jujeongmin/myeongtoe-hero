import { findProduct } from "../../shared/data/shop";
import type { GameState } from "../../shared/state";
import { t } from "../i18n";
import { buyProduct, productPrice } from "../net/shop";
import { Icon } from "./Icon";

// The one question before a rewarded ad: what it gives, then 광고 보기 on the left and, for anyone
// without 프리미엄, the no-ads 프리미엄 offer on the right.
export function AdConfirm({ state, title, text, onWatch, onClose }: {
  state: GameState; title: string; text: string; onWatch: () => void; onClose: () => void;
}) {
  const premium = findProduct("premium")!;
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal ad-confirm" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{text}</p>
        <p>{t("광고를 보고 켤까요?")}</p>
        <div className="ad-confirm-buttons">
          <button className="gold" onClick={onWatch}><Icon name="ad" size={16} /> {t("광고 보기")}</button>
          {!state.vx.premium && (
            <button className="hot" onClick={() => { onClose(); buyProduct("premium"); }}>
              {t("프리미엄")}<br /><Icon name="vx" size={16} /> {(productPrice("premium") ?? premium.vx).toLocaleString("en-US")}
            </button>
          )}
        </div>
        <button onClick={onClose}>{t("닫기")}</button>
      </div>
    </div>
  );
}
