import anchorsJson from "../../art/park/anchors.json";
import shineJson from "../../art/park/fx/head_shine.json";
import gearJson from "../../art/parts/gear/gear.json";
import partsJson from "../../art/parts/suits/parts.json";
import artVersions from "virtual:art-versions";

// Every picture the battle screen draws, by URL (hashed in builds, versioned by file time in the
// dev server; see vite-plugins/artVersions.ts), loaded once and kept.
const URLS = import.meta.glob(
  [
    "../../art/park/*_strip.png",
    "../../art/park/fx/head_shine.png",
    "../../art/parts/suits/strips/*.png",
    "../../art/parts/gear/g*.png",
    "../../art/parts/gear/scaled/*.png",
    "../../art/backgrounds/*.png",
    "../../art/icons/*.png",
  ],
  { eager: true, query: "?url", import: "default" },
) as Record<string, string>;

function url(path: string): string | undefined {
  const src = URLS[`../../art/${path}`];
  const v = artVersions[path];
  return src && v ? `${src}${src.includes("?") ? "&" : "?"}v=${v}` : src;
}

export type Anim = "idle" | "walk" | "attack";
export type Point = [number, number];

export interface Frame {
  head: Point;
  neck: Point;
  torso: Point;
  hand: Point;
  handAngle: number;
  feet: Point;
}

export const FRAME = 64;
export const BASELINE_Y = anchorsJson.baselineY;
export const ANIMS: Record<Anim, { frames: Frame[]; ms: number; loop: boolean }> = {
  idle: { frames: anchorsJson.animations.idle.frames as unknown as Frame[], ms: 250, loop: true },
  walk: { frames: anchorsJson.animations.walk.frames as unknown as Frame[], ms: 110, loop: true },
  attack: { frames: anchorsJson.animations.attack.frames as unknown as Frame[], ms: 90, loop: false },
};

// Costume layers bottom to top; "body" is Park himself, "gear" the item in his hand.
export const LAYERS = partsJson.layerOrder as readonly string[];

export interface GearSprite {
  file: string;
  grip: Point;
  angle: number;
}

// The item drawn for a gear tier (the pre-shrunk copy for bulky ones).
export function gearSprite(tier: number): GearSprite | undefined {
  const item = (gearJson.items as unknown as { id: number; file: string; grip: Point; angle: number; scaledFile?: string; scaledGrip?: Point }[])
    .find((i) => i.id === tier);
  if (!item) return undefined;
  return item.scaledFile && item.scaledGrip
    ? { file: `parts/gear/${item.scaledFile}`, grip: item.scaledGrip, angle: item.angle }
    : { file: `parts/gear/${item.file}`, grip: item.grip, angle: item.angle };
}

export const SHINE = {
  file: "park/fx/head_shine.png",
  size: shineJson.frameWidth,
  count: shineJson.frameCount,
  fps: shineJson.fps,
  everyMs: shineJson.repeatEveryMs,
  center: shineJson.center as unknown as Point,
  offset: shineJson.perFrameOffset as unknown as Record<Anim, Point[]>,
};

const BACKGROUNDS: Record<string, string> = {
  총무팀: "bg_general_affairs", 영업팀: "bg_sales", 법무팀: "bg_legal", 개발팀: "bg_dev",
  재무팀: "bg_finance", 임원실: "bg_executive", 지하주차장: "bg_parking",
};

export function backgroundFile(department: string): string {
  return `backgrounds/${BACKGROUNDS[department] ?? "bg_general_affairs"}.png`;
}

export function parkStrip(anim: Anim): string {
  return `park/${anim}_strip.png`;
}

export function partStrip(id: string, anim: Anim): string {
  return `parts/suits/strips/${id}_${anim}.png`;
}

export function iconUrl(name: string): string | undefined {
  return url(`icons/${name}.png`);
}

const images = new Map<string, HTMLImageElement>();

// The image for an art path, or null until it has loaded (the next frame draws it).
export function image(path: string): HTMLImageElement | null {
  let img = images.get(path);
  if (!img) {
    const src = url(path);
    if (!src) return null;
    img = new Image();
    img.src = src;
    images.set(path, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}
