import { useEffect, useRef } from "react";
import { departmentOf } from "../../shared/data/floors";
import { targetSec } from "../../shared/settle";
import type { GameState } from "../../shared/state";
import { heroPower } from "../../shared/stats";
import {
  ANIMS, BASELINE_Y, FRAME, LAYERS, SHINE, backgroundFile, gearSprite, image, parkStrip, partStrip, type Anim,
} from "../game/sprites";

// The battle scene at its native pixel size, scaled up crisp by CSS. The scale is set so Park's body
// (44 px) stands about 17% of the screen's width tall, with the floor 73% of the way down; the
// 96 px department background sits on that floor, its top row stretched up as ceiling.
// It only shows what settle decided: the time into the current kill (run.carrySec, moved on
// smoothly between the store's updates) says whether Park is walking to the next monster or
// swinging at it. One swing takes one hit's time (power.hitSec), and the first swing starts when
// he reaches the monster.
const BODY_PX = 44;
const BODY_SHARE = 0.17;
const FLOOR_SHARE = 0.73;
const BG_FLOOR = 82;
const WALK_PX_PER_SEC = 48;
// A swing is never drawn faster than this, however fast Park hits.
const MIN_SWING_SEC = 0.24;

interface Snapshot {
  state: GameState;
  at: number;
}

export function BattleCanvas({ state }: { state: GameState }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const snap = useRef<Snapshot>({ state, at: performance.now() });
  snap.current = { state, at: performance.now() };

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let scroll = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const parent = el.parentElement;
      const cw = Math.max(1, parent?.clientWidth ?? 320);
      const ch = Math.max(1, parent?.clientHeight ?? 200);
      const scale = Math.max(1, (cw * BODY_SHARE) / BODY_PX);
      const w = Math.round(cw / scale);
      const h = Math.round(ch / scale);
      if (el.width !== w || el.height !== h) {
        el.width = w;
        el.height = h;
      }
      scroll = draw(ctx, w, h, snap.current, now, dt, scroll);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvas} width={160} height={96} />;
}

function draw(
  ctx: CanvasRenderingContext2D, w: number, h: number, { state, at }: Snapshot, now: number, dt: number, scroll: number,
): number {
  ctx.imageSmoothingEnabled = false;
  const { floor, carrySec } = state.run;
  const power = heroPower(state);
  const fight = targetSec(floor, power);
  const perKill = fight + power.walkSec;
  const t = Number.isFinite(perKill) && perKill > 0 ? (carrySec + (now - at) / 1000) % perKill : 0;
  const walking = t < power.walkSec || !Number.isFinite(fight);
  const nextScroll = walking ? scroll + (WALK_PX_PER_SEC * dt) / power.walkSec : scroll;
  const floorY = Math.round(h * FLOOR_SHARE);

  ctx.clearRect(0, 0, w, h);
  const bg = image(backgroundFile(departmentOf(floor)));
  if (bg) {
    const top = floorY - BG_FLOOR;
    const off = Math.floor(nextScroll) % bg.width;
    for (let x = -off; x < w; x += bg.width) {
      if (top > 0) ctx.drawImage(bg, 0, 0, bg.width, 1, x, 0, bg.width, top);
      ctx.drawImage(bg, x, top);
      const below = top + bg.height;
      if (below < h) ctx.drawImage(bg, 0, bg.height - 1, bg.width, 1, x, below, bg.width, h - below);
    }
  }

  let anim: Anim;
  let fi: number;
  if (walking) {
    anim = "walk";
    fi = Math.floor((t * 1000) / ANIMS.walk.ms) % ANIMS.walk.frames.length;
  } else {
    anim = "attack";
    const swing = Math.max(MIN_SWING_SEC, power.hitSec);
    const into = ((t - power.walkSec) % swing) / swing;
    fi = Math.min(ANIMS.attack.frames.length - 1, Math.floor(into * ANIMS.attack.frames.length));
  }

  // Park a little left of centre; the monster (its sprites are on the way) will stand to his right.
  drawPark(ctx, state, anim, fi, Math.round(w * 0.42) - 34, floorY - BASELINE_Y, now);
  return nextScroll;
}

function drawPark(ctx: CanvasRenderingContext2D, state: GameState, anim: Anim, fi: number, x: number, y: number, now: number): void {
  const frame = ANIMS[anim].frames[fi];
  const worn = state.wear;
  for (const layer of LAYERS) {
    if (layer === "body") {
      const body = image(parkStrip(anim));
      if (body) ctx.drawImage(body, fi * FRAME, 0, FRAME, FRAME, x, y, FRAME, FRAME);
      if (!worn.helmet) drawShine(ctx, anim, fi, frame.head, x, y, now);
    } else if (layer === "gear") {
      drawGear(ctx, state.gear.tier, frame.hand, frame.handAngle, x, y);
    } else {
      const id = worn[layer];
      const strip = id ? image(partStrip(id, anim)) : null;
      if (strip) ctx.drawImage(strip, fi * FRAME, 0, FRAME, FRAME, x, y, FRAME, FRAME);
    }
  }
}

function drawShine(ctx: CanvasRenderingContext2D, anim: Anim, fi: number, head: [number, number], x: number, y: number, now: number): void {
  const img = image(SHINE.file);
  if (!img) return;
  const cell = Math.floor(((now % SHINE.everyMs) / 1000) * SHINE.fps);
  if (cell >= SHINE.count) return;
  const [ox, oy] = SHINE.offset[anim][fi] ?? [5, 2];
  ctx.drawImage(img, cell * SHINE.size, 0, SHINE.size, SHINE.size,
    x + head[0] + ox - SHINE.center[0], y + head[1] + oy - SHINE.center[1], SHINE.size, SHINE.size);
}

function drawGear(ctx: CanvasRenderingContext2D, tier: number, hand: [number, number], handAngle: number, x: number, y: number): void {
  const g = gearSprite(tier);
  const img = g && image(g.file);
  if (!g || !img) return;
  ctx.save();
  ctx.translate(x + hand[0], y + hand[1]);
  ctx.rotate(((handAngle - g.angle) * Math.PI) / 180);
  ctx.drawImage(img, -g.grip[0], -g.grip[1]);
  ctx.restore();
}
