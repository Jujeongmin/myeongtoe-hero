import type { GameState } from "../../shared/state";
import { hasCostume } from "../../shared/data/costumes";
import {
  ANIMS, FRAME, LAYERS, LAYERS_ARM_FRONT, LAYERS_GEAR_BEHIND, SHINE, gearSprite, image, parkStrip, partStrip, type Anim,
} from "./sprites";

// Park as the game draws him: the body, the costume layers worn (the ones still owned or rented),
// the item of his gear tier in his hand, and the bald-head glint when no helmet is on. Shared by the
// battle screen and the costume preview.
export function visibleWear(state: GameState): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [part, id] of Object.entries(state.wear)) if (hasCostume(state, id)) out[part] = id;
  return out;
}

export function drawPark(
  ctx: CanvasRenderingContext2D, worn: Record<string, string>, gearTier: number, anim: Anim, fi: number, x: number, y: number, now: number,
): void {
  const frame = ANIMS[anim].frames[fi];
  const order = frame.gearBehindBody ? LAYERS_GEAR_BEHIND : frame.gearAboveHelmet ? LAYERS_ARM_FRONT : LAYERS;
  for (const layer of order) {
    if (layer === "body") {
      const body = image(parkStrip(anim));
      if (body) ctx.drawImage(body, fi * FRAME, 0, FRAME, FRAME, x, y, FRAME, FRAME);
      if (!worn.helmet) drawShine(ctx, anim, fi, frame.head, x, y, now);
    } else if (layer === "gear") {
      drawGear(ctx, gearTier, frame.hand, frame.handAngle, x, y);
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
