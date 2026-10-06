import { useEffect, useRef } from "react";
import { departmentOf, isBossFloor, targetHp } from "../../shared/data/floors";
import { formatBig } from "../../shared/format";
import { mods } from "../../shared/mods";
import { targetSec } from "../../shared/settle";
import type { GameState } from "../../shared/state";
import { HERO_CRIT_CHANCE, heroPower } from "../../shared/stats";
import {
  ANIMS, BASELINE_Y, FRAME, LAYERS, SHINE, backgroundFile, gearSprite, image, monsterFor, parkStrip, partStrip,
  type Anim, type MonsterSprite,
} from "../game/sprites";

// The battle scene at its native pixel size, scaled up crisp by CSS. The scale is set so Park's body
// (44 px) stands about 17% of the screen's width tall, with the floor 73% of the way down; the
// 96 px department background sits on that floor, its top row stretched up as ceiling.
//
// It only shows what settle decided. The time into the current kill (run.carrySec, moved on
// smoothly between the store's updates) says whether Park is walking to the next monster or
// fighting it. A fight is split into as many hits as Park's attack speed allows; each hit lands on
// the swing's impact frame, knocks the monster's health down one step and shows its damage, and
// the last one kills it.
const BODY_PX = 44;
const BODY_SHARE = 0.17;
const FLOOR_SHARE = 0.73;
const BG_FLOOR = 82;
const WALK_PX_PER_SEC = 48;
// A swing is never drawn faster than this, however fast Park hits.
const MIN_SWING_SEC = 0.24;
// The swing frame where the item meets the monster (as a share of the swing).
const IMPACT_AT = 0.55;
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
  hurtUntil: number;
  dying: { monster: MonsterSprite; x: number; since: number } | null;
  current: MonsterSprite | null;
  currentX: number;
}

export function BattleCanvas({ state }: { state: GameState }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const layer = useRef<HTMLDivElement>(null);
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
    const sim: Sim = { kill: "", hits: 0, hurtUntil: 0, dying: null, current: null, currentX: 0 };
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
      scroll = draw(ctx, w, h, snap.current, now, dt, scroll, sim, (text, x, y, crit) => {
        popDamage(layer.current, text, (x * cw) / w, (y * ch) / h, crit);
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
    </div>
  );
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
  ctx: CanvasRenderingContext2D, w: number, h: number, { state, at }: Snapshot, now: number, dt: number, scroll: number,
  sim: Sim, pop: (text: string, x: number, y: number, crit: boolean) => void,
): number {
  ctx.imageSmoothingEnabled = false;
  const { floor, target, carrySec, farming } = state.run;
  const power = heroPower(state);
  const fight = targetSec(floor, power);
  const perKill = fight + power.walkSec;
  const elapsed = carrySec + (now - at) / 1000;
  const fighting = Number.isFinite(perKill) && perKill > 0;
  const kills = fighting ? Math.floor(elapsed / perKill) : 0;
  const t = fighting ? elapsed - kills * perKill : 0;
  const walking = t < power.walkSec || !Number.isFinite(fight);
  const nextScroll = walking ? scroll + (WALK_PX_PER_SEC * dt) / power.walkSec : scroll;
  const floorY = Math.round(h * FLOOR_SHARE);
  const department = departmentOf(floor);
  const boss = isBossFloor(floor) && !farming;
  const parkX = Math.round(w * 0.38) - 34;
  const contactX = parkX + 44;

  // Which monster this is; a new one means the last one was killed.
  const place = target + kills;
  const kill = `${floor}:${farming}:${place}`;
  if (kill !== sim.kill) {
    if (sim.current && sim.kill !== "") sim.dying = { monster: sim.current, x: sim.currentX, since: now };
    sim.kill = kill;
    sim.hits = 0;
    sim.current = monsterFor(department, floor, place, boss) ?? null;
  }

  ctx.clearRect(0, 0, w, h);
  const bg = image(backgroundFile(department));
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

  // Hits: n of them over the fight, each landing at the impact point of its own swing.
  const n = Number.isFinite(fight) ? Math.max(1, Math.round(fight / Math.max(MIN_SWING_SEC, power.hitSec))) : 1;
  const interval = Number.isFinite(fight) && n > 0 ? fight / n : 1;
  const into = walking ? 0 : t - power.walkSec;
  const landed = walking ? 0 : Math.min(n, Math.floor(into / interval + (1 - IMPACT_AT)));
  const monster = sim.current;
  const monsterX = walking
    ? Math.round(w + 8 + (contactX - (w + 8)) * Math.min(1, t / Math.max(0.001, power.walkSec * 0.9)))
    : contactX;
  sim.currentX = monsterX;

  if (landed > sim.hits && monster) {
    const hp = targetHp(floor).mulN(power.hpMult);
    const critChance = Math.min(1, HERO_CRIT_CHANCE + mods(state).critChanceAdd);
    const top = floorY - monster.baseline + monster.hpBar[1] - monster.hover;
    for (let k = sim.hits; k < landed; k++) {
      const crit = Math.random() < critChance;
      pop(formatBig(hp.mulN(1 / n)), monsterX + monster.size / 2 + (k % 3) * 3 - 3, top, crit);
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
  drawPark(ctx, state, anim, fi, parkX, floorY - BASELINE_Y, now);

  if (monster) {
    const hurt = now < sim.hurtUntil;
    const a = hurt ? monster.anims.hurt : monster.anims.idle;
    const f = hurt
      ? Math.min(a.frames - 1, Math.floor((HURT_MS - (sim.hurtUntil - now)) / a.ms))
      : Math.floor(now / a.ms) % a.frames;
    drawMonster(ctx, monster, hurt ? "hurt" : "idle", f, monsterX, floorY);
  }
  return nextScroll;
}

function drawMonster(ctx: CanvasRenderingContext2D, m: MonsterSprite, anim: "idle" | "hurt" | "death", f: number, x: number, floorY: number): void {
  const img = image(m.anims[anim].file);
  if (!img) return;
  ctx.drawImage(img, f * m.size, 0, m.size, m.size, x, floorY - m.baseline - m.hover, m.size, m.size);
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
