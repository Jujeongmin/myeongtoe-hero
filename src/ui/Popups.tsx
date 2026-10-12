import { OFFER_ADS, ROOKIE_DAYS, type Offer } from "../../shared/data/shop";
import type { GameState } from "../../shared/state";
import { kstDay } from "../../shared/time";
import type { GameStore } from "../game/store";
import { imageUrl } from "../game/sprites";
import { t } from "../i18n";
import { buyProduct, productPrice } from "../net/shop";
import { Icon } from "./Icon";
import { Attendance } from "./MissionSheet";
import { useTapGuard } from "./useTapGuard";

// Popups the game opens by itself (App decides when): attendance on arriving, and a VX offer.
// Both start with a moment that lets no tap through (useTapGuard).

export function attendanceDue(state: GameState): boolean {
  return state.attendance.lastDay !== kstDay(state.lastTick);
}

export function AttendancePopup({ state, store, onClose }: { state: GameState; store: GameStore; onClose: () => void }) {
  const guard = useTapGuard();
  return (
    <div className={`modal-back${guard.armed ? "" : " arming"}`} onClickCapture={guard.onClickCapture}>
      <div className="modal attendance-popup">
        <h3>{t("출석 체크")}</h3>
        <Attendance state={state} store={store} />
        <button onClick={onClose}>{attendanceDue(state) ? t("나중에") : t("닫기")}</button>
      </div>
    </div>
  );
}

// Seen offer keys are kept on the device: an offer someone closed does not come back.
const SEEN_KEY = "myeongtoe-hero:offers-seen";

export function seenOffers(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function markOfferSeen(key: string): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seenOffers().filter((k) => k !== key), key].slice(-50)));
  } catch {
    // No storage: it may come back next time.
  }
}

function headline(offer: Offer): { title: string; sub: string } {
  switch (offer.why) {
    case "promo": return { title: t("{floor}층 승진 축하!", { floor: offer.product.floor ?? 0 }), sub: t("승진 기념 패키지는 한 번만 살 수 있어요") };
    case "rookie": return { title: t("신입 한정 패키지"), sub: t("입사 {days}일 안에 한 번만 살 수 있어요", { days: ROOKIE_DAYS }) };
    case "rookieLast": return { title: t("신입 패키지 곧 마감!"), sub: t("입사 {days}일이 지나면 사라져요", { days: ROOKIE_DAYS }) };
    case "premium": return { title: t("광고 없이 바로 받기"), sub: t("오늘 광고를 {n}번이나 봤어요. 프리미엄이면 광고 없이 바로 받아요", { n: OFFER_ADS }) };
  }
}

export function OfferPopup({ offer, onClose }: { offer: Offer; onClose: () => void }) {
  const guard = useTapGuard();
  const p = offer.product;
  const { title, sub } = headline(offer);
  return (
    <div className={`modal-back${guard.armed ? "" : " arming"}`} onClickCapture={guard.onClickCapture}>
      <div className="modal offer-popup">
        <h3>{title}</h3>
        <div className="sub">{sub}</div>
        <img className="vx-img" src={imageUrl(`vx/src/${p.id}_128.png`)} width={128} height={128} alt="" draggable={false} />
        <b>{t(p.name.key, p.name.vars)}</b>
        <div className="sub">{t(p.text.key, p.text.vars)}</div>
        <button className="gold" onClick={() => { onClose(); buyProduct(p.id); }}>
          <Icon name="vx" size={16} /> {(productPrice(p.id) ?? p.vx).toLocaleString("en-US")}
        </button>
        <button onClick={onClose}>{t("다음에")}</button>
      </div>
    </div>
  );
}
