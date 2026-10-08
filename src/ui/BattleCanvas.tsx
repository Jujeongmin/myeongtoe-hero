import { useEffect, useRef } from "react";
import { MONSTERS_PER_FLOOR, departmentOf, isBoss, targetHp } from "../../shared/data/floors";
import { BOSS_LINES, PARK_QUIPS, bossKind, pickLine } from "../../shared/data/quips";
import { formatBig } from "../../shared/format";
import { targetSec } from "../../shared/settle";
import type { GameState } from "../../shared/state";
import { heroCrit, heroPower } from "../../shared/stats";
import { PARK_CHEST_EVERY, PARK_RUN_SEC, PARK_STEP_SEC, parkHp, parkMeterSec } from "../../shared/data/parking";
import { ANIMS, ATTACK_IMPACT_FRAME, BASELINE_Y, HP_BAR, backgroundFile, image, monsterFor, preloadBattleArt, type Anim, type MonsterSprite } from "../game/sprites";
import { drawPark, visibleWear } from "../game/drawPark";
import { t } from "../i18n";

// The battle scene in the screen's real (device) pixels, every picture drawn at a whole number of
// them per art pixel so it stays crisp. The department background is scaled up until it covers
// the whole scene (bottom-aligned, floor where its picture has it); Park and the monsters are
// drawn at Park's 44 px body about 15% of the screen's width.
//
// It only shows what settle decided. The time into the current kill (run.carrySec, moved on
// smoothly between the store's updates) says whether Park is walking to the next monster or
// fighting it. A fight is split into as many hits as Park's attack speed allows; each hit lands on
// the swing's impact frame, knocks the monster's health down one step and shows its damage, and
// the last one kills it.
// Park and the monsters at a set size, not a share of the screen width: about 2 CSS px per art
// pixel, rounded to whole device pixels (Park stands about 80 px tall on any phone).
const ART_CSS_PX = 2;
// The office behind them at a set size too: one background pixel is about 6 CSS px (bigger if the
// scene is taller than the picture).
const BG_CSS_PX = 6;
// Bosses are drawn about this much bigger than the other monsters (rounded to whole device pixels).
const BOSS_SIZE = 1.3;
let artScale = 1;
let bossScale = 1;

const BG_H = 96;
const BG_FLOOR = 82;
const WALK_PX_PER_SEC = 48;
// A swing is never drawn faster than this, however fast Park hits.
const MIN_SWING_SEC = 0.24;
// Where in the swing the item meets the monster (the middle of the impact frame).
const IMPACT_AT = (ATTACK_IMPACT_FRAME + 0.5) / ANIMS.attack.frames.length;
const HURT_MS = 180;

interface Snapshot {
  state: GameState;
  at: number;
}

// What the loop remembers between frames: which kill it is on, hits already shown, the monster
// dying from the last kill.
interface Sim {
  kill: string;
  hits: number;
  crits: boolean[]; // which of this kill's hits are crits, rolled when the kill starts
  hurtUntil: number;
  dying: { monster: MonsterSprite; x: number; since: number } | null;
  current: MonsterSprite | null;
  currentX: number;
  // The floor and whether the monster being fought is its boss (to know when a boss falls), and
  // when Park next says something on his own.
  floor: number;
  boss: boolean;
  quipAt: number;
  // Hit bursts still playing, and a short screen shake after a critical hit.
  fx: { crit: boolean; x: number; y: number; since: number }[];
  shakeUntil: number;
  // A parking chest opening where the 20th, 40th… meter's monster fell.
  chest: { x: number; since: number } | null;
}

const QUIP_MIN_MS = 25_000;
const QUIP_MORE_MS = 25_000;
const BUBBLE_MS = 3_000;

export function BattleCanvas({ state }: { state: GameState }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const talk = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLDivElement>(null);
  const depth = useRef<HTMLDivElement>(null);
  const snap = useRef<Snapshot>({ state, at: performance.now() });
  snap.current = { state, at: performance.now() };

  useEffect(() => preloadBattleArt(), []);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let scroll = 0;
    let last = performance.now();
    const sim: Sim = {
      kill: "", hits: 0, crits: [], hurtUntil: 0, dying: null, current: null, currentX: 0, floor: 0, boss: false,
      quipAt: performance.now() + QUIP_MIN_MS * Math.random(), fx: [], shakeUntil: 0, chest: null,
    };
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const parent = el.parentElement;
      const cw = Math.max(1, parent?.clientWidth ?? 320);
      const ch = Math.max(1, parent?.clientHeight ?? 200);
      const dpr = window.devicePixelRatio || 1;
      // Device pixels per art pixel for Park and the monsters. The canvas is at device resolution
      // and everything is drawn in art pixels through that scale, so a boss can be drawn a whole
      // number of device pixels bigger per art pixel and still be crisp.
      const scale = Math.max(1, Math.round(ART_CSS_PX * dpr));
      artScale = scale;
      bossScale = Math.max(scale + 1, Math.round(scale * BOSS_SIZE)) / scale;
      const dw = Math.round(cw * dpr);
      const dh = Math.round(ch * dpr);
      if (el.width !== dw || el.height !== dh) {
        el.width = dw;
        el.height = dh;
      }
      const w = dw / scale;
      const h = dh / scale;
      const bgScale = Math.max(Math.round((BG_CSS_PX * dpr) / scale), Math.ceil(h / BG_H), 1);
      scroll = draw(ctx, w, h, bgScale, snap.current, now, dt, scroll, sim, (text, x, y, crit) => {
        popDamage(layer.current, text, (x * cw) / w, (y * ch) / h, crit);
      }, (text, x, y) => {
        // Park's quips and boss lines, and the monster's name, shown in the player's language.
        say(talk.current, t(text), (x * cw) / w, (y * ch) / h);
      }, (text, x, y) => {
        nameTag(tag.current, t(text), (x * cw) / w, (y * ch) / h);
      }, (meter) => {
        const el = depth.current;
        if (!el) return;
        el.hidden = meter === null;
        const text = meter === null ? "" : `B${meter}m`;
        if (el.textContent === text) return;
        el.textContent = text;
        // Every meter the counter bumps; every 10 m it bumps bigger.
        el.classList.remove("bump", "bump-big");
        void el.offsetWidth;
        if (meter) el.classList.add(meter % 10 === 0 ? "bump-big" : "bump");
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="scene">
      <canvas ref={canvas} width={160} height={96} />
      <div ref={layer} className="damage-layer" />
      <div ref={talk} className="bubble" hidden />
      <div ref={tag} className="monster-name" hidden />
      <div ref={depth} className="parking-depth" hidden />
    </div>
  );
}

// The monster's name over its health bar (empty text hides it).
function nameTag(el: HTMLDivElement | null, text: string, x: number, y: number): void {
  if (!el) return;
  if (el.textContent !== text) el.textContent = text;
  el.hidden = text === "";
  el.style.left = `${Math.round(x)}px`;
  el.style.top = `${Math.round(y)}px`;
}

// Park's speech bubble over his head: one at a time, gone after a few seconds.
let bubbleTimer = 0;
// The battle screen's controls a bubble must not cover.
// The bubble keeps clear of the controls; the monster's name it may cover (it is drawn above it).
const BUBBLE_AVOID = ".battle-head, .top-left, .side-menu, .boss-btn, .atk-now, .prestige-btn, .mission-card, .currency, .parking-depth";

function say(el: HTMLDivElement | null, text: string, x: number, y: number): void {
  if (!el) return;
  el.textContent = text;
  el.style.left = `${Math.round(x)}px`;
  el.style.top = `${Math.round(y)}px`;
  el.hidden = false;
  fitBubble(el);
  window.clearTimeout(bubbleTimer);
  bubbleTimer = window.setTimeout(() => (el.hidden = true), BUBBLE_MS);
}

// Size a bubble to the characters (Park is about 60 px tall): font 10px down to 8px, wrapping at
// 140/110/90 px, the first size that covers none of the other UI and stays inside the battle
// area; if nothing fits, the smallest try stays.
function fitBubble(el: HTMLDivElement): void {
  const scene = el.closest(".battle");
  if (!scene) return;
  const area = scene.getBoundingClientRect();
  const others = [...scene.querySelectorAll<HTMLElement>(BUBBLE_AVOID)]
    .filter((o) => !o.hidden && o.offsetParent !== null)
    .map((o) => o.getBoundingClientRect());
  const clear = (r: DOMRect) =>
    r.left >= area.left && r.right <= area.right && r.top >= area.top &&
    !others.some((o) => Math.min(r.right, o.right) - Math.max(r.left, o.left) > 1 && Math.min(r.bottom, o.bottom) - Math.max(r.top, o.top) > 1);
  // Still in the way at the smallest size: slide it left a step at a time (the tail stays over Park).
  const left = parseFloat(el.style.left) || 0;
  for (const dx of [0, -16, -32, -48]) {
    el.style.left = `${left + dx}px`;
    for (const px of [10, 9, 8]) {
      for (const width of [140, 110, 90]) {
        el.style.fontSize = `${px}px`;
        el.style.lineHeight = `${px + 2}px`;
        el.style.maxWidth = `${width}px`;
        if (clear(el.getBoundingClientRect())) return;
      }
    }
  }
  el.style.left = `${left}px`;
}

// A damage number that rises and fades over the monster (pixel font text, not a picture).
function popDamage(layer: HTMLDivElement | null, text: string, x: number, y: number, crit: boolean): void {
  if (!layer || layer.childElementCount > 12) return;
  const span = document.createElement("span");
  span.className = crit ? "damage crit" : "damage";
  span.textContent = text;
  span.style.left = `${Math.round(x)}px`;
  span.style.top = `${Math.round(y)}px`;
  span.addEventListener("animationend", () => span.remove());
  layer.appendChild(span);
}

function draw(
  ctx: CanvasRenderingContext2D, w: number, h: number, bgScale: number, { state, at }: Snapshot, now: number, dt: number, scroll: number,
  sim: Sim, pop: (text: string, x: number, y: number, crit: boolean) => void, talk: (text: string, x: number, y: number) => void,
  tag: (text: string, x: number, y: number) => void, showDepth: (meter: number | null) => void,
): number {
  ctx.imageSmoothingEnabled = false;
  const { floor, target, carrySec, farming } = state.run;
  const power = heroPower(state);
  const serverNow = state.lastTick + (now - at);
  // 지하주차장 run in progress: the same fight, one monster a meter, deeper each kill.
  // A finished run waiting for its reward holds its last moment on screen.
  const parkingShown = state.parking.runUntil > serverNow || (!state.parking.claimed && state.parking.last !== null);
  const parking = parkingShown ? parkingView(state, power, Math.min(serverNow, state.parking.runUntil - 1)) : null;
  // The monster being fought: farming repeats the floor's normal ones.
  const current = farming ? 0 : Math.min(target, MONSTERS_PER_FLOOR - 1);
  const walkSec = parking ? PARK_STEP_SEC : power.walkSec;
  const fight = parking ? parking.fight : targetSec(floor, current, power);
  const perKill = fight + walkSec;
  const elapsed = carrySec + (now - at) / 1000;
  const fighting = Number.isFinite(perKill) && perKill > 0;
  const kills = parking ? 0 : fighting ? Math.floor(elapsed / perKill) : 0;
  const t = parking ? parking.t : fighting ? elapsed - kills * perKill : 0;
  const walking = t < walkSec || !Number.isFinite(fight);
  const nextScroll = walking ? scroll + (WALK_PX_PER_SEC * dt) / walkSec : scroll;
  const floorY = h - (BG_H - BG_FLOOR) * bgScale;
  const department = parking ? PARKING_DEPARTMENT : departmentOf(floor);
  const placeNow = current + (fighting ? Math.floor(elapsed / perKill) : 0);
  const boss = !parking && !farming && isBoss(placeNow % MONSTERS_PER_FLOOR);
  const monsterW = sim.current?.size ?? 48;
  const parkX = Math.round(w * 0.38) - 34;
  const contactX = parkX + 44;
  if (import.meta.env.DEV) (window as unknown as { __fight?: object }).__fight = { parkX, contactX, monsterW, floorY, w, h };

  // Which monster this is; a new one means the last one was killed.
  const place = parking ? parking.meter : target + kills;
  const kill = parking ? `p:${parking.start}:${parking.meter}` : `${floor}:${farming}:${place}`;
  // How deep the run is: the meters already cleared.
  showDepth(parking ? parking.meter - 1 : null);
  const head: [number, number] = [parkX + 32, floorY - BASELINE_Y + 4];
  if (kill !== sim.kill) {
    if (sim.current && sim.kill !== "") sim.dying = { monster: sim.current, x: sim.currentX, since: now };
    // Every 20 m down the garage a chest pops open.
    if (parking && sim.kill.startsWith("p:") && (parking.meter - 1) % PARK_CHEST_EVERY === 0 && parking.meter > 1) {
      sim.chest = { x: sim.currentX + 16, since: now };
    }
    // The boss fell: the floor went up past it.
    if (sim.kill !== "" && sim.boss && floor > sim.floor) {
      talk(pickLine(BOSS_LINES[bossKind(sim.floor)], Math.random()), ...head);
      sim.quipAt = now + QUIP_MIN_MS;
    }
    sim.floor = floor;
    sim.boss = boss;
    sim.kill = kill;
    sim.hits = 0;
    sim.crits = [];
    const found = monsterFor(department, floor, place, boss) ?? null;
    sim.current = found && boss ? enlarge(found, bossScale) : found;
  }

  // Development: window.__quip = "…" makes Park say it now (to check bubble layout).
  const dev = import.meta.env.DEV ? (window as unknown as { __quip?: string }) : null;
  if (dev?.__quip) {
    talk(dev.__quip, ...head);
    dev.__quip = undefined;
  }
  if (now >= sim.quipAt) {
    talk(pickLine(PARK_QUIPS, Math.random()), ...head);
    sim.quipAt = now + QUIP_MIN_MS + QUIP_MORE_MS * Math.random();
  }

  ctx.setTransform(artScale, 0, 0, artScale, 0, 0);
  ctx.clearRect(0, 0, w, h);
  // A critical hit shakes the scene by a pixel or two for a moment.
  if (now < sim.shakeUntil) ctx.translate(Math.round(Math.random() * 4 - 2), Math.round(Math.random() * 2 - 1));
  const bg = image(backgroundFile(department));
  if (bg) {
    const bw = bg.width * bgScale;
    const bh = bg.height * bgScale;
    const top = h - bh;
    const off = Math.floor(nextScroll) % bw;
    for (let x = -off; x < w; x += bw) {
      ctx.drawImage(bg, 0, 0, bg.width, bg.height, x, top, bw, bh);
    }
  }

  // Deeper in the garage it gets darker (up to 45% by 300 m).
  if (parking && parking.meter > 1) {
    ctx.fillStyle = `rgba(4, 6, 16, ${Math.min(0.45, (parking.meter - 1) / 660)})`;
    ctx.fillRect(0, 0, w, h);
  }

  // Hits: n of them over the fight, each landing at the impact point of its own swing.
  const n = Number.isFinite(fight) ? Math.max(1, Math.round(fight / Math.max(MIN_SWING_SEC, power.hitSec))) : 1;
  const interval = Number.isFinite(fight) && n > 0 ? fight / n : 1;
  const into = walking ? 0 : t - walkSec;
  const landed = walking ? 0 : Math.min(n, Math.floor(into / interval + (1 - IMPACT_AT)));
  const monster = sim.current;
  const monsterX = walking
    ? Math.round(w + 8 + (contactX - (w + 8)) * Math.min(1, t / Math.max(0.001, walkSec * 0.9)))
    : contactX;
  sim.currentX = monsterX;

  if (landed > sim.hits && monster) {
    const hp = parking ? parkHp(parking.meter).mulN(power.hpMult) : targetHp(floor, current).mulN(power.hpMult);
    // The kill's HP split over its hits, a crit hit taking (1 + bonus) shares of a normal one, so a
    // crit's number is that much bigger and the hits still add up to the monster's HP.
    const { chance, bonus } = heroCrit(state);
    if (sim.crits.length !== n) sim.crits = Array.from({ length: n }, (_, i) => sim.crits[i] ?? Math.random() < chance);
    const shares = sim.crits.reduce((sum, c) => sum + (c ? 1 + bonus : 1), 0);
    const top = floorY - monster.baseline + monster.hpBar[1] - monster.hover;
    for (let k = sim.hits; k < landed; k++) {
      const crit = sim.crits[k];
      pop(formatBig(hp.mulN((crit ? 1 + bonus : 1) / shares)), monsterX + monster.size / 2 + (k % 3) * 3 - 3, top, crit);
      // The burst where the swing lands: the monster's front edge, halfway down its body (from the
      // top of its pixels, just under the HP bar anchor, to its feet).
      const spriteTop = floorY - monster.baseline - monster.hover;
      const bodyTop = spriteTop + monster.hpBar[1] + 4;
      const y = bodyTop + (floorY - monster.hover - bodyTop) * 0.5;
      sim.fx.push({ crit, x: monsterX + monster.size * 0.32 + (k % 2) * 3, y, since: now });
      if (crit) sim.shakeUntil = now + SHAKE_MS;
    }
    sim.hits = landed;
    sim.hurtUntil = now + HURT_MS;
  }

  // The monster from the last kill, going up in smoke where it fell.
  if (sim.dying) {
    const d = sim.dying.monster.anims.death;
    const f = Math.floor((now - sim.dying.since) / d.ms);
    if (f >= d.frames) sim.dying = null;
    else drawMonster(ctx, sim.dying.monster, "death", f, sim.dying.x, floorY);
  }

  let anim: Anim;
  let fi: number;
  if (walking) {
    anim = "walk";
    fi = Math.floor((t * 1000) / ANIMS.walk.ms) % ANIMS.walk.frames.length;
  } else {
    anim = "attack";
    const phase = (into % interval) / interval;
    fi = Math.min(ANIMS.attack.frames.length - 1, Math.floor(phase * ANIMS.attack.frames.length));
  }
  drawPark(ctx, visibleWear(state), state.gear.tier, anim, fi, parkX, floorY - BASELINE_Y, now);

  if (monster) {
    const hurt = now < sim.hurtUntil;
    const a = hurt ? monster.anims.hurt : monster.anims.idle;
    const f = hurt
      ? Math.min(a.frames - 1, Math.floor((HURT_MS - (sim.hurtUntil - now)) / a.ms))
      : Math.floor(now / a.ms) % a.frames;
    drawMonster(ctx, monster, hurt ? "hurt" : "idle", f, monsterX, floorY);
    drawHpBar(ctx, monster, monsterX, floorY, 1 - landed / n);
    tag(monster.name, monsterX + monster.hpBar[0], floorY - monster.baseline - monster.hover + monster.hpBar[1] - HP_BAR.h - 1);
    drawHitFx(ctx, sim, now);
  } else tag("", 0, 0);
  if (sim.chest) {
    const img = image("parking/chest.png");
    const f = Math.floor((now - sim.chest.since) / CHEST_MS);
    if (f >= 6) sim.chest = null;
    else if (img) ctx.drawImage(img, Math.min(3, f) * 32, 0, 32, 32, Math.round(sim.chest.x), floorY - 32, 32, 32);
  }
  return nextScroll;
}

// ---- 지하주차장 ----

const PARKING_DEPARTMENT = "지하주차장";
const CHEST_MS = 160;

// Where a parking run is now: which meter's monster (1-based), how long it takes to beat, and the
// time into it, replaying the run's own schedule (runParking: each meter is its fight plus a step).
function parkingView(state: GameState, power: ReturnType<typeof heroPower>, serverNow: number) {
  const start = state.parking.runFrom;
  // Run seconds go by faster under 배속 (30 run seconds over the run's real time).
  const pace = (PARK_RUN_SEC * 1000) / Math.max(1, state.parking.runUntil - state.parking.runFrom);
  let left = Math.max(0, ((serverNow - start) / 1000) * pace);
  const depth = state.parking.last?.depth ?? 0;
  // An awakened run starts past the meters it warped through.
  for (let meter = (state.parking.last?.warped ?? 0) + 1; ; meter++) {
    const sec = parkMeterSec(power, meter);
    const fight = sec - PARK_STEP_SEC;
    // The last monster (the one the time runs out on) stays until the run ends.
    if (left < sec || meter > depth) return { start, meter, fight, t: left };
    left -= sec;
  }
}

// Hit bursts (art/fx/hit_spark.png, crit_spark.png: one row of frames each), drawn over the monster.
const HIT_FX = {
  hit: { file: "fx/hit_spark.png", size: 32, frames: 5, ms: 45 },
  crit: { file: "fx/crit_spark.png", size: 48, frames: 6, ms: 50 },
};
const SHAKE_MS = 140;

function drawHitFx(ctx: CanvasRenderingContext2D, sim: Sim, now: number): void {
  sim.fx = sim.fx.filter((f) => {
    const spec = f.crit ? HIT_FX.crit : HIT_FX.hit;
    const i = Math.floor((now - f.since) / spec.ms);
    if (i >= spec.frames) return false;
    const img = image(spec.file);
    if (img) ctx.drawImage(img, i * spec.size, 0, spec.size, spec.size, Math.round(f.x - spec.size / 2), Math.round(f.y - spec.size / 2), spec.size, spec.size);
    return true;
  });
}

// The monster's health bar (art/ui hp_bar, 3-slice) over its head: one step down per hit.
function drawHpBar(ctx: CanvasRenderingContext2D, m: MonsterSprite, x: number, floorY: number, value: number): void {
  const empty = image(HP_BAR.empty);
  const fill = image(HP_BAR.fill);
  const frame = image(HP_BAR.frame);
  if (!empty || !fill || !frame) return;
  const w = Math.max(40, Math.round(m.size * 0.8));
  const left = Math.round(x + m.hpBar[0] - w / 2);
  const top = floorY - m.baseline - m.hover + m.hpBar[1] - HP_BAR.h - 1;
  const slice = (img: HTMLImageElement, width: number) => {
    const e = HP_BAR.edge;
    if (width <= 0) return;
    const mid = img.width - 2 * e;
    ctx.drawImage(img, 0, 0, Math.min(e, width), img.height, left, top, Math.min(e, width), img.height);
    if (width > e) ctx.drawImage(img, e, 0, mid, img.height, left + e, top, Math.min(w - 2 * e, width - e), img.height);
    if (width > w - e) ctx.drawImage(img, img.width - e, 0, e, img.height, left + w - e, top, width - (w - e), img.height);
  };
  slice(empty, w);
  slice(fill, Math.round(w * Math.max(0, Math.min(1, value))));
  slice(frame, w);
}

// A monster drawn `k` times bigger: its measurements grow with it, its frames stay `frame` wide.
type Drawn = MonsterSprite & { frame?: number };
function enlarge(m: MonsterSprite, k: number): Drawn {
  return { ...m, frame: m.size, size: m.size * k, baseline: m.baseline * k, hover: m.hover * k, hpBar: [m.hpBar[0] * k, m.hpBar[1] * k] };
}

function drawMonster(ctx: CanvasRenderingContext2D, m: Drawn, anim: "idle" | "hurt" | "death", f: number, x: number, floorY: number): void {
  const img = image(m.anims[anim].file);
  if (!img) return;
  const frame = m.frame ?? m.size;
  ctx.drawImage(img, f * frame, 0, frame, frame, x, floorY - m.baseline - m.hover, m.size, m.size);
}
