import { OFFER_ADS, PASS_DAILY_GEMS, PASS_DAYS, PREMIUM_DAILY_GEMS, PREMIUM_OFFLINE_SEC, ROOKIE_DAYS, type Offer, type Product } from "../../shared/data/shop";
import { formatCount } from "../../shared/format";
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

// What a product holds, as pictures: each currency with its amount, or 프리미엄's and 월급 통장's
// perks, each with its icon.
function contents(p: Product): { icon: string; label: string; value: string }[] {
  const out: { icon: string; label: string; value: string }[] = [];
  if (p.gems) out.push({ icon: "gem", label: t("보석"), value: formatCount(p.gems) });
  if (p.tickets) out.push({ icon: "ticket", label: t("응시권"), value: formatCount(p.tickets) });
  if (p.coupons) out.push({ icon: "coupon", label: t("상품권"), value: formatCount(p.coupons) });
  if (p.id === "premium") {
    out.push({ icon: "ad", label: t("광고 없이"), value: t("바로 보상") });
    out.push({ icon: "buff_atk", label: t("버프 3종"), value: t("항상 켜짐") });
    out.push({ icon: "timer", label: t("오프라인"), value: t("+{h}시간", { h: PREMIUM_OFFLINE_SEC / 3600 }) });
    out.push({ icon: "gem", label: t("매일 보석"), value: formatCount(PREMIUM_DAILY_GEMS) });
  }
  if (p.id === "pass_salary") {
    out.push({ icon: "gem", label: t("매일 보석"), value: formatCount(PASS_DAILY_GEMS) });
    out.push({ icon: "timer", label: t("기간"), value: t("{n}일", { n: PASS_DAYS }) });
  }
  return out;
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
        <div className="offer-items">
          {contents(p).map((c) => (
            <div key={c.icon + c.label} className="offer-item">
              <Icon name={c.icon} size={32} />
              <div className="sub">{c.label}</div>
              <b>{c.value}</b>
            </div>
          ))}
        </div>
        <button className="gold" onClick={() => { onClose(); buyProduct(p.id); }}>
          <Icon name="vx" size={16} /> {(productPrice(p.id) ?? p.vx).toLocaleString("en-US")}
        </button>
        <button onClick={onClose}>{t("다음에")}</button>
      </div>
    </div>
  );
}
