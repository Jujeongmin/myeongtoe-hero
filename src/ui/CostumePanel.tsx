import { useEffect, useRef, useState } from "react";
import {
  AURAS, LEGENDS, LEGEND_MAX_LEVEL, LEGEND_SET, SUIT_ITEMS, SUIT_PARTS, auraEffectText, auraOpen, costumeEffectText,
  hasCostume, legendEffectText, legendOpen, rentPrice, type SuitItem, type SuitPart,
} from "../../shared/data/costumes";
import type { GameState } from "../../shared/state";
import type { Text } from "../../shared/text";
import { t } from "../i18n";
import { ANIMS, BASELINE_Y, FRAME, partStrip } from "../game/sprites";
import { drawPark, visibleWear } from "../game/drawPark";
import type { GameStore } from "../game/store";
import { Amount } from "./Amount";
import { Icon } from "./Icon";
import { SpriteThumb } from "./SpriteThumb";

type Tab = SuitPart | "aura" | "legend";
const TABS: { id: Tab; label: string }[] = [
  ...SUIT_PARTS.map((p) => ({ id: p.key as Tab, label: p.name })),
  { id: "aura", label: "불꽃" },
  { id: "legend", label: "전설" },
];

function hours(ms: number): string {
  const h = Math.max(0, ms) / 3_600_000;
  return h >= 1 ? t("{h}시간", { h: Math.floor(h) }) : t("{m}분", { m: Math.max(1, Math.ceil(h * 60)) });
}

const fx = (x: Text) => t(x.key, x.vars);

// 코스튬: Park in what he wears (or is trying on) on top, then a tab per slot and for 불꽃 and 전설.
// Tapping a costume tries it on in the preview; buying it makes its effect work at once, worn or not.
export function CostumePanel({ state, store }: { state: GameState; store: GameStore }) {
  const [tab, setTab] = useState<Tab>("helmet");
  const [trying, setTrying] = useState<string | null>(null);
  const wear = { ...visibleWear(state) };
  const tryItem = trying ? SUIT_ITEMS.find((i) => i.id === trying) : undefined;
  if (tryItem) wear[tryItem.part] = tryItem.id;
  const owned = SUIT_ITEMS.filter((i) => state.suits.includes(i.id)).length;

  return (
    <>
      <div className="costume-top">
        <Preview wear={wear} gearTier={state.gear.tier} />
        <div className="costume-summary">
          <b>{t("보유 코스튬 {owned}/{total}", { owned, total: SUIT_ITEMS.length })}</b>
          <div className="sub">{t("사면 입지 않아도 효과가 바로 적용돼요. 입으면 겉모습만 바뀌어요.")}</div>
          <div className="sub">{t("코스튬을 누르면 미리 입어볼 수 있어요.")}</div>
          {tryItem && <div className="sub">{t("입어보는 중: {name}", { name: t(tryItem.name) })}</div>}
        </div>
      </div>
      <div className="tabs costume-tabs">
        {TABS.map((x) => (
          <button key={x.id} className={x.id === tab ? "on" : ""} onClick={() => setTab(x.id)}>{t(x.label)}</button>
        ))}
      </div>
      {tab === "aura" ? (
        <Auras state={state} store={store} />
      ) : tab === "legend" ? (
        <Legends state={state} store={store} />
      ) : (
        SUIT_ITEMS.filter((i) => i.part === tab).map((item) => (
          <CostumeRow key={item.id} item={item} state={state} store={store} trying={trying === item.id}
            onTry={() => setTrying(trying === item.id ? null : item.id)} />
        ))
      )}
    </>
  );
}

function CostumeRow({ item, state, store, trying, onTry }: {
  item: SuitItem; state: GameState; store: GameStore; trying: boolean; onTry: () => void;
}) {
  const own = state.suits.includes(item.id);
  const rentLeft = (state.costume.rent[item.id] ?? 0) - state.lastTick;
  const usable = hasCostume(state, item.id);
  const worn = state.wear[item.part] === item.id;
  const refund = state.costume.rented.includes(item.id) ? rentPrice(item) : 0;
  return (
    <div className={`row costume-row${trying ? " current" : ""}`} onClick={onTry}>
      <span className="icon-box"><SpriteThumb path={partStrip(item.id, "idle")} frame={FRAME} className="part-thumb" /></span>
      <div className="grow">
        <b>{t(item.name)}</b>
        <div className="sub">{fx(costumeEffectText(item.effect))}</div>
        {(own || rentLeft > 0) && <div className="sub">{own ? t("보유") : t("대여 {time} 남음", { time: hours(rentLeft) })}</div>}
      </div>
      <div className="buttons" onClick={(e) => e.stopPropagation()}>
        {usable ? (
          <button className={worn ? "" : "hot"} onClick={() => store.do(worn ? { k: "takeOffSuit", part: item.part } : { k: "wearSuit", id: item.id })}>
            {worn ? t("벗기") : t("입기")}
          </button>
        ) : (
          <button disabled={state.coupons < rentPrice(item)} onClick={() => store.do({ k: "rentSuit", id: item.id })}>
            {t("대여")}<br /><Amount icon="coupon" value={rentPrice(item)} />
          </button>
        )}
        {!own && (
          <button className="hot" disabled={state.coupons < item.price - refund} onClick={() => store.do({ k: "buySuit", id: item.id })}>
            {t("구매")}<br /><Amount icon="coupon" value={item.price - refund} />
          </button>
        )}
      </div>
    </div>
  );
}

function Auras({ state, store }: { state: GameState; store: GameStore }) {
  return (
    <>
      <div className="group-title">{t("세트의 투구·갑옷·망토·장갑·신발을 모두 가지면 불꽃을 살 수 있어요")}</div>
      {AURAS.map((aura) => {
        const own = state.costume.auras.includes(aura.set);
        const open = auraOpen(state.suits, aura.set);
        const on = state.costume.aura === aura.set;
        return (
          <div key={aura.set} className={`row costume-row${!own && !open ? " far" : ""}`}>
            <span className="icon-box"><Icon name={`aura_${aura.set}`} /></span>
            <div className="grow">
              <b>{t(aura.name)}</b>
              <div className="sub">{fx(auraEffectText(aura.effect))}</div>
              {!open && !own && <div className="sub">{t("세트 5부위 필요")}</div>}
            </div>
            {own ? (
              <button className={on ? "" : "hot"} onClick={() => store.do({ k: "wearAura", set: on ? 0 : aura.set })}>{on ? t("끄기") : t("켜기")}</button>
            ) : (
              <button className="hot" disabled={!open || state.gems < aura.gems} onClick={() => store.do({ k: "buyAura", set: aura.set })}>
                {t("구매")}<br /><Amount icon="gem" value={aura.gems} />
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}

function Legends({ state, store }: { state: GameState; store: GameStore }) {
  const count = LEGENDS.filter((l) => (state.costume.legend[l.part] ?? 0) > 0).length;
  return (
    <>
      <div className="group-title">{t("한 부위의 코스튬 6종을 모두 가지면 그 부위의 전설 코스튬이 열려요")}</div>
      {LEGENDS.map((legend) => {
        const lv = state.costume.legend[legend.part] ?? 0;
        const open = legendOpen(state.suits, legend.part);
        const maxed = lv >= LEGEND_MAX_LEVEL;
        return (
          <div key={legend.part} className={`row costume-row${lv === 0 && !open ? " far" : ""}`}>
            <span className="icon-box"><Icon name={`legend_${legend.part}`} /></span>
            <div className="grow">
              <b>{t(legend.name)}</b> Lv{lv}/{LEGEND_MAX_LEVEL}
              <div className="sub">{lv > 0 ? fx(legendEffectText(legend, lv)) : `Lv1: ${fx(legendEffectText(legend, 1))}`}</div>
              {!maxed && lv > 0 && <div className="sub">{t("다음: {effect}", { effect: fx(legendEffectText(legend, lv + 1)) })}</div>}
              {!open && <div className="sub">{t("{part} 6종 모두 필요", { part: t(SUIT_PARTS.find((p) => p.key === legend.part)!.name) })}</div>}
            </div>
            <button className="hot" disabled={maxed || !open || state.coupons < legend.coupons} onClick={() => store.do({ k: "levelLegend", part: legend.part })}>
              {maxed ? "MAX" : <>{lv === 0 ? t("구매") : t("강화")}<br /><Amount icon="coupon" value={legend.coupons} /></>}
            </button>
          </div>
        );
      })}
      <div className="group-title">{t("전설 세트 효과 (보유 {n}개)", { n: count })}</div>
      {LEGEND_SET.map((x) => (
        <div key={x.count} className={`row${count >= x.count ? " current" : " far"}`}>
          <div className="grow">{t("{n}개 보유: {text}", { n: x.count, text: t(x.text) })}</div>
        </div>
      ))}
    </>
  );
}

// Park at 3× in an idle loop, wearing `wear`.
function Preview({ wear, gearTier }: { wear: Record<string, string>; gearTier: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const props = useRef({ wear, gearTier });
  props.current = { wear, gearTier };
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const loop = (now: number) => {
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, 72, 72);
      const fi = Math.floor(now / ANIMS.idle.ms) % ANIMS.idle.frames.length;
      drawPark(ctx, props.current.wear, props.current.gearTier, "idle", fi, 4, 66 - BASELINE_Y, now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} className="costume-preview" width={72} height={72} />;
}
