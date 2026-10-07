import { useEffect, useRef, useState } from "react";
import {
  AURAS, LEGENDS, LEGEND_MAX_LEVEL, LEGEND_SET, SUIT_ITEMS, SUIT_PARTS, auraEffectText, auraOpen, costumeEffectText,
  hasCostume, legendEffectText, legendOpen, rentPrice, type SuitItem, type SuitPart,
} from "../../shared/data/costumes";
import type { GameState } from "../../shared/state";
import { ANIMS, BASELINE_Y, FRAME, image, partStrip } from "../game/sprites";
import { drawPark, visibleWear } from "../game/drawPark";
import type { GameStore } from "../game/store";
import { Amount } from "./Amount";
import { Icon } from "./Icon";

type Tab = SuitPart | "aura" | "legend";
const TABS: { id: Tab; label: string }[] = [
  ...SUIT_PARTS.map((p) => ({ id: p.key as Tab, label: p.name })),
  { id: "aura", label: "불꽃" },
  { id: "legend", label: "전설" },
];

function hours(ms: number): string {
  const h = Math.max(0, ms) / 3_600_000;
  return h >= 1 ? `${Math.floor(h)}시간` : `${Math.max(1, Math.ceil(h * 60))}분`;
}

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
          <b>보유 코스튬 {owned}/{SUIT_ITEMS.length}</b>
          <div className="sub">사면 입지 않아도 효과가 바로 적용돼요. 입으면 겉모습만 바뀌어요.</div>
          <div className="sub">코스튬을 누르면 미리 입어볼 수 있어요.</div>
          {tryItem && <div className="sub">입어보는 중: {tryItem.name}</div>}
        </div>
      </div>
      <div className="tabs costume-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={t.id === tab ? "on" : ""} onClick={() => setTab(t.id)}>{t.label}</button>
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
      <span className="icon-box"><PartThumb id={item.id} /></span>
      <div className="grow">
        <b>{item.name}</b>
        <div className="sub">{costumeEffectText(item.effect)}</div>
        {(own || rentLeft > 0) && <div className="sub">{own ? "보유" : `대여 ${hours(rentLeft)} 남음`}</div>}
      </div>
      <div className="buttons" onClick={(e) => e.stopPropagation()}>
        {usable ? (
          <button className={worn ? "" : "hot"} onClick={() => store.do(worn ? { k: "takeOffSuit", part: item.part } : { k: "wearSuit", id: item.id })}>
            {worn ? "벗기" : "입기"}
          </button>
        ) : (
          <button disabled={state.coupons < rentPrice(item)} onClick={() => store.do({ k: "rentSuit", id: item.id })}>
            대여<br /><Amount icon="coupon" value={rentPrice(item)} />
          </button>
        )}
        {!own && (
          <button className="hot" disabled={state.coupons < item.price - refund} onClick={() => store.do({ k: "buySuit", id: item.id })}>
            구매<br /><Amount icon="coupon" value={item.price - refund} />
          </button>
        )}
      </div>
    </div>
  );
}

function Auras({ state, store }: { state: GameState; store: GameStore }) {
  return (
    <>
      <div className="group-title">세트의 투구·갑옷·망토·장갑·신발을 모두 가지면 불꽃을 살 수 있어요</div>
      {AURAS.map((aura) => {
        const own = state.costume.auras.includes(aura.set);
        const open = auraOpen(state.suits, aura.set);
        const on = state.costume.aura === aura.set;
        return (
          <div key={aura.set} className={`row costume-row${!own && !open ? " far" : ""}`}>
            <span className="icon-box"><Icon name="buff_atk" /></span>
            <div className="grow">
              <b>{aura.name}</b>
              <div className="sub">{auraEffectText(aura.effect)}</div>
              {!open && !own && <div className="sub">세트 5부위 필요</div>}
            </div>
            {own ? (
              <button className={on ? "" : "hot"} onClick={() => store.do({ k: "wearAura", set: on ? 0 : aura.set })}>{on ? "끄기" : "켜기"}</button>
            ) : (
              <button className="hot" disabled={!open || state.gems < aura.gems} onClick={() => store.do({ k: "buyAura", set: aura.set })}>
                구매<br /><Amount icon="gem" value={aura.gems} />
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
      <div className="group-title">한 부위의 코스튬 6종을 모두 가지면 그 부위의 전설 코스튬이 열려요</div>
      {LEGENDS.map((legend) => {
        const lv = state.costume.legend[legend.part] ?? 0;
        const open = legendOpen(state.suits, legend.part);
        const maxed = lv >= LEGEND_MAX_LEVEL;
        return (
          <div key={legend.part} className={`row costume-row${lv === 0 && !open ? " far" : ""}`}>
            <span className="icon-box"><Icon name="vip" /></span>
            <div className="grow">
              <b>{legend.name}</b> Lv{lv}/{LEGEND_MAX_LEVEL}
              <div className="sub">{lv > 0 ? legendEffectText(legend, lv) : `Lv1: ${legendEffectText(legend, 1)}`}</div>
              {!maxed && lv > 0 && <div className="sub">다음: {legendEffectText(legend, lv + 1)}</div>}
              {!open && <div className="sub">{SUIT_PARTS.find((p) => p.key === legend.part)!.name} 6종 모두 필요</div>}
            </div>
            <button className="hot" disabled={maxed || !open || state.coupons < legend.coupons} onClick={() => store.do({ k: "levelLegend", part: legend.part })}>
              {maxed ? "MAX" : <>{lv === 0 ? "구매" : "강화"}<br /><Amount icon="coupon" value={legend.coupons} /></>}
            </button>
          </div>
        );
      })}
      <div className="group-title">전설 세트 효과 (보유 {count}개)</div>
      {LEGEND_SET.map((x) => (
        <div key={x.count} className={`row${count >= x.count ? " current" : " far"}`}>
          <div className="grow">{x.count}개 보유: {x.text}</div>
        </div>
      ))}
    </>
  );
}

// The costume piece itself: its pixels in the first idle frame, cropped and scaled up whole.
function PartThumb({ id }: { id: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let timer = 0;
    const draw = () => {
      const img = image(partStrip(id, "idle"));
      const canvas = ref.current;
      if (!img || !canvas) {
        timer = window.setTimeout(draw, 100);
        return;
      }
      const cell = document.createElement("canvas");
      cell.width = cell.height = FRAME;
      const cctx = cell.getContext("2d")!;
      cctx.drawImage(img, 0, 0, FRAME, FRAME, 0, 0, FRAME, FRAME);
      const px = cctx.getImageData(0, 0, FRAME, FRAME).data;
      let x0 = FRAME, y0 = FRAME, x1 = -1, y1 = -1;
      for (let y = 0; y < FRAME; y++) for (let x = 0; x < FRAME; x++) {
        if (px[(y * FRAME + x) * 4 + 3] === 0) continue;
        x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
      }
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (x1 < 0) return;
      const w = x1 - x0 + 1, h = y1 - y0 + 1;
      const k = Math.max(1, Math.floor(Math.min(canvas.width / w, canvas.height / h)));
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(cell, x0, y0, w, h, Math.floor((canvas.width - w * k) / 2), Math.floor((canvas.height - h * k) / 2), w * k, h * k);
    };
    draw();
    return () => window.clearTimeout(timer);
  }, [id]);
  return <canvas ref={ref} className="part-thumb" width={40} height={40} />;
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
