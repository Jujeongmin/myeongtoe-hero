import { useEffect, useRef } from "react";
import { departmentOf, isBossFloor } from "../../shared/data/floors";
import { targetSec } from "../../shared/settle";
import type { GameState } from "../../shared/state";
import { heroPower } from "../../shared/stats";
import {
  ANIMS, BASELINE_Y, FRAME, LAYERS, SHINE, backgroundFile, gearSprite, image, parkStrip, partStrip, type Anim,
} from "../game/sprites";

// The battle scene at its native pixel size: 150 px tall (the 96 px background at the bottom, its top
// row stretched up as sky/ceiling), as wide as the screen's shape allows, scaled up crisp by CSS. It only shows what settle decided: the time into the current kill (run.carrySec,
// moved on smoothly between the store's updates) says whether Park is walking to the next monster
// or hitting it, and how hurt the monster is.
const H = 150;
const BG_H = 96;
const BG_Y = H - BG_H;
const FLOOR_Y = BG_Y + 82;
const WALK_PX_PER_SEC = 48;

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
      const w = parent ? Math.max(64, Math.round((H * parent.clientWidth) / Math.max(1, parent.clientHeight))) : 160;
      if (el.width !== w || el.height !== H) {
        el.width = w;
        el.height = H;
      }
      scroll = draw(ctx, w, snap.current, now, dt, scroll);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={canvas} width={160} height={H} />;
}

function draw(ctx: CanvasRenderingContext2D, w: number, { state, at }: Snapshot, now: number, dt: number, scroll: number): number {
  ctx.imageSmoothingEnabled = false;
  const { floor, carrySec, farming } = state.run;
  const power = heroPower(state);
  const fight = targetSec(floor, power);
  const perKill = fight + power.walkSec;
  const t = Number.isFinite(perKill) && perKill > 0 ? (carrySec + (now - at) / 1000) % perKill : 0;
  const walking = t < power.walkSec || !Number.isFinite(fight);
  const anim: Anim = walking ? "walk" : "attack";
  const nextScroll = walking ? scroll + WALK_PX_PER_SEC * dt * (1 / power.walkSec) : scroll;

  // Background, tiled and scrolling while Park walks.
  const bg = image(backgroundFile(departmentOf(floor)));
  if (bg) {
    const off = Math.floor(nextScroll) % bg.width;
    for (let x = -off; x < w; x += bg.width) {
      ctx.drawImage(bg, 0, 0, bg.width, 1, x, 0, bg.width, BG_Y);
      ctx.drawImage(bg, x, BG_Y);
    }
  } else {
    ctx.fillStyle = "#3d5a80";
    ctx.fillRect(0, 0, w, H);
  }

  // Park left of centre (clear of the job-change button), the monster walking in from the right.
  const parkX = Math.round(w * 0.42) - 34;
  const parkY = FLOOR_Y - BASELINE_Y;
  const a = ANIMS[anim];
  const elapsed = walking ? t : t - power.walkSec;
  const fi = Math.floor((elapsed * 1000) / a.ms) % a.frames.length;
  drawPark(ctx, state, anim, fi, parkX, parkY, now);

  const boss = isBossFloor(floor) && !farming;
  const contact = parkX + 46;
  const startX = w + 4;
  const mx = walking ? Math.round(startX + (contact - startX) * (t / Math.max(0.001, power.walkSec))) : contact;
  const hpLeft = walking ? 1 : Math.max(0, 1 - (t - power.walkSec) / Math.max(0.001, fight));
  drawMonster(ctx, mx, boss, hpLeft, fi, anim);
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

// Stand-in monster until its sprites exist: a block with eyes, red and bigger for a boss.
function drawMonster(ctx: CanvasRenderingContext2D, x: number, boss: boolean, hpLeft: number, fi: number, anim: Anim): void {
  const w = boss ? 26 : 16;
  const h = boss ? 30 : 18;
  const hit = anim === "attack" && fi >= 2 && fi <= 4 ? 1 : 0;
  const left = x + hit;
  const top = FLOOR_Y - h;
  ctx.fillStyle = "#000";
  ctx.fillRect(left - 1, top - 1, w + 2, h + 2);
  ctx.fillStyle = boss ? "#c1121f" : "#7b2cbf";
  ctx.fillRect(left, top, w, h);
  ctx.fillStyle = "#fff";
  ctx.fillRect(left + 3, top + 5, 3, 3);
  ctx.fillRect(left + 9, top + 5, 3, 3);
  ctx.fillStyle = "#000";
  ctx.fillRect(left + 3, top + 6, 2, 2);
  ctx.fillRect(left + 9, top + 6, 2, 2);
  // Health bar above it.
  ctx.fillStyle = "#000";
  ctx.fillRect(left - 1, top - 6, w + 2, 4);
  ctx.fillStyle = "#400";
  ctx.fillRect(left, top - 5, w, 2);
  ctx.fillStyle = "#e63946";
  ctx.fillRect(left, top - 5, Math.round(w * hpLeft), 2);
}
