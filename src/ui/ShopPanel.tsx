import { useEffect, useState } from "react";
import { AD_GOLD_KILLS, AD_PLACEMENTS, adReadyAt } from "../../shared/data/ads";
import { formatBig } from "../../shared/format";
import { killGoldNow } from "../../shared/stats";
import { GEM_ITEMS } from "../../shared/data/gemShop";
import { PRODUCTS, dailyVxClaimed, dailyVxGems, productOffered } from "../../shared/data/shop";
import type { GameState } from "../../shared/state";
import { VIP_STEPS, VIP_TEXT, vipLevel } from "../../shared/vip";
import type { GameStore } from "../game/store";
import { t } from "../i18n";
import { showAd } from "../net/ads";
import { buyProduct, productPrice } from "../net/shop";
import { imageUrl } from "../game/sprites";
import { Amount } from "./Amount";
import { Icon } from "./Icon";

type Tab = "gems" | "ads" | "vx";
const TABS: { id: Tab; label: string }[] = [
  { id: "gems", label: "골드 교환" },
  { id: "ads", label: "광고 보상" },
  { id: "vx", label: "VX 상품" },
];

const GEM_ICONS: Record<string, string> = {
  buff_atk: "buff_atk", buff_gold: "buff_gold", buff_move: "buff_move",
  gold_100: "gold_charge", gold_1000: "gold_charge_big", gear_boost: "gear_boost",
};

const AD_ICONS: Record<string, string> = {
  ad_speed: "speed", ad_gems: "gem", ad_gold: "gold_charge", ad_buff: "buff_atk",
  ad_coupons: "coupon", ad_parking: "pass", ad_offline: "ad",
};


function clock(ms: number): string {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(sec / 60);
  return m >= 60 ? t("{h}시간 {m}분", { h: Math.floor(m / 60), m: m % 60 }) : `${m}:${String(sec % 60).padStart(2, "0")}`;
}

// 상점 tab: what gems buy, the rewarded ads with their cooldowns, and the VX products with VIP.
export function ShopPanel({ state, store, initial = "gems" }: { state: GameState; store: GameStore; initial?: Tab }) {
  const [tab, setTab] = useState<Tab>(initial);
  return (
    <>
      <div className="tabs">
        {TABS.map((x) => (
          <button key={x.id} className={x.id === tab ? "on" : ""} onClick={() => setTab(x.id)}>{t(x.label)}</button>
        ))}
      </div>
      {tab === "gems" && <GemShop state={state} store={store} />}
      {tab === "ads" && <AdRewards state={state} store={store} />}
      {tab === "vx" && <VxShop state={state} store={store} />}
    </>
  );
}

function GemShop({ state, store }: { state: GameState; store: GameStore }) {
  return (
    <>
      {GEM_ITEMS.map((item) => (
        <div key={item.id} className="row">
          <span className="icon-box"><Icon name={GEM_ICONS[item.id] ?? "gem"} /></span>
          <div className="grow">
            <b>{t(item.name)}</b>
            <div className="sub">{t(item.text)}</div>
            {item.kind === "gold" && <div className="sub"><Amount icon="gold" value={`+${formatBig(killGoldNow(state).mulN(item.kills))}`} /></div>}
          </div>
          <button disabled={state.gems < item.gems} onClick={() => store.do({ k: "buyGemItem", id: item.id })}>
            {t("구매")}<br /><Amount icon="gem" value={item.gems} />
          </button>
        </div>
      ))}
    </>
  );
}

function AdRewards({ state, store }: { state: GameState; store: GameStore }) {
  const [busy, setBusy] = useState("");
  const premium = state.vx.premium;
  const watch = async (id: string) => {
    setBusy(id);
    const outcome = premium ? "rewarded" : await showAd(id);
    setBusy("");
    if (outcome === "rewarded") store.do({ k: "watchAd", id });
  };
  return (
    <>
      {premium && <div className="group-title">{t("프리미엄: 광고 없이 바로 받아요")}</div>}
      {/* Buff and 2배속 ads live top left, the welcome-back one in its popup. */}
      {AD_PLACEMENTS.filter((ad) => ad.id !== "ad_offline" && ad.id !== "ad_speed" && !ad.id.startsWith("ad_buff_")).map((ad) => {
        const wait = adReadyAt(state, ad) - state.lastTick;
        return (
          <div key={ad.id} className="row">
            <span className="icon-box"><Icon name={AD_ICONS[ad.id] ?? "ad"} /></span>
            <div className="grow">
              <b>{t(ad.name)}</b>
              <div className="sub">{t(ad.text)}</div>
              {ad.id === "ad_gold" && <div className="sub"><Amount icon="gold" value={`+${formatBig(killGoldNow(state).mulN(AD_GOLD_KILLS))}`} /></div>}
            </div>
            <button className={wait > 0 ? "" : "hot"} disabled={wait > 0 || busy !== ""} onClick={() => void watch(ad.id)}>
              {wait > 0 ? <>{t("대기")}<br />{clock(wait)}</> : premium ? t("받기") : <>{t("광고")}<br />{t("보기")}</>}
            </button>
          </div>
        );
      })}
    </>
  );
}

function VxShop({ state, store }: { state: GameState; store: GameStore }) {
  // A finished purchase arrives on the server; after the dialog closes the next sync brings it.
  useEffect(() => undefined, []);
  const level = vipLevel(state.vx.total);
  const next = VIP_STEPS[level];
  const daily = dailyVxGems(state);
  return (
    <>
      <div className="row">
        <span className="icon-box"><Icon name="vip" /></span>
        <div className="grow">
          <b>VIP {level}</b>
          <div className="sub">
            {next ? t("다음 단계까지 {vx} VX · {perk}", { vx: (next - state.vx.total).toLocaleString("en-US"), perk: t(VIP_TEXT[level]) }) : t("최고 단계예요")}
          </div>
        </div>
      </div>
      {daily > 0 && (
        <div className="row">
          <span className="icon-box"><Icon name="salary_pass" /></span>
          <div className="grow">
            <b>{t("매일 보석")}</b>
            <div className="sub">{t("프리미엄·월급 통장 혜택")}</div>
          </div>
          <button className="hot" disabled={dailyVxClaimed(state)} onClick={() => store.do({ k: "claimDailyVx" })}>
            {dailyVxClaimed(state) ? t("받음") : <>{t("받기")}<br /><Amount icon="gem" value={daily} /></>}
          </button>
        </div>
      )}
      <div className="vx-grid">
        {PRODUCTS.filter((p) => productOffered(state, p)).map((p) => (
          <div key={p.id} className="vx-card">
            <img className="vx-img" src={imageUrl(`vx/src/${p.id}_128.png`)} width={128} height={128} alt="" draggable={false} />
            <b>{t(p.name.key, p.name.vars)}</b>
            <div className="sub">{t(p.text.key, p.text.vars)}</div>
            <button className="btn hot" onClick={() => buyProduct(p.id)}>
              <Icon name="vx" size={16} /> {(productPrice(p.id) ?? p.vx).toLocaleString("en-US")}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
