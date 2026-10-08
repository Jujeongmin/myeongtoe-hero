import anchorsJson from "../../art/park/anchors.json";
import shineJson from "../../art/park/fx/head_shine.json";
import gearJson from "../../art/parts/gear/gear.json";
import monstersJson from "../../art/monsters/monsters.json";
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
    "../../art/monsters/*.png",
    "../../art/ui/[!_]*.png",
    "../../art/vx/src/*.png",
    "../../art/story/*.png",
    "../../art/fx/*.png",
    "../../art/parking/*.png",
    "../../art/story/src/ref_headhunter_cat.png",
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
  // The swinging arm passes in front of the head: the item and gloves go over the helmet.
  gearAboveHelmet?: boolean;
  // The item is raised behind the head: it goes under the body (and the cape).
  gearBehindBody?: boolean;
}

export const FRAME = 64;
export const BASELINE_Y = anchorsJson.baselineY;
export const ANIMS: Record<Anim, { frames: Frame[]; ms: number; loop: boolean }> = {
  idle: { frames: anchorsJson.animations.idle.frames as unknown as Frame[], ms: 250, loop: true },
  walk: { frames: anchorsJson.animations.walk.frames as unknown as Frame[], ms: 110, loop: true },
  attack: { frames: anchorsJson.animations.attack.frames as unknown as Frame[], ms: anchorsJson.animations.attack.frameDurationMs ?? 70, loop: false },
};

// The attack frame where the item meets the monster.
export const ATTACK_IMPACT_FRAME: number = (anchorsJson.animations.attack as { impactFrame?: number }).impactFrame ?? 4;

// Costume layers bottom to top; "body" is Park himself, "gear" the item in his hand.
export const LAYERS = partsJson.layerOrder as readonly string[];
// The same with the item and gloves moved over the helmet (frames with gearAboveHelmet).
export const LAYERS_ARM_FRONT: readonly string[] = [...LAYERS.filter((l) => l !== "gear" && l !== "gloves"), "gear", "gloves"];
// The same with the item first of all (frames with gearBehindBody).
export const LAYERS_GEAR_BEHIND: readonly string[] = ["gear", ...LAYERS.filter((l) => l !== "gear")];

export interface GearSprite {
  file: string;
  grip: Point;
  angle: number;
}

// The item drawn for a gear tier, at its full size: oversized office items in Park's hand are part
// of the joke (the pre-shrunk copies in art/parts/gear/scaled are not used).
export function gearSprite(tier: number): GearSprite | undefined {
  const item = (gearJson.items as unknown as { id: number; file: string; grip: Point; angle: number }[])
    .find((i) => i.id === tier);
  return item && { file: `parts/gear/${item.file}`, grip: item.grip, angle: item.angle };
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

// The URL of any art file the screen may show as an <img> (gear icons and the like).
export function imageUrl(path: string): string | undefined {
  return url(path);
}

export function iconUrl(name: string): string | undefined {
  return url(`icons/${name}.png`);
}

// The UI frames (art/ui) as CSS variables (--ui-<file name>), so index.css can draw them with
// border-image at their versioned URLs.
export function applyUiSkin(root: HTMLElement = document.documentElement): void {
  for (const key of Object.keys(URLS)) {
    const m = /^\.\.\/\.\.\/art\/ui\/([a-z_]+)\.png$/.exec(key);
    if (!m || m[1].startsWith("_")) continue;
    const src = url(`ui/${m[1]}.png`);
    if (src) root.style.setProperty(`--ui-${m[1].replace(/_/g, "-")}`, `url("${src}")`);
  }
}

export const HP_BAR = {
  w: 24, h: 5, edge: 3,
  empty: "ui/hp_bar_empty.png", fill: "ui/hp_bar_fill.png", frame: "ui/hp_bar_frame.png",
};

const images = new Map<string, HTMLImageElement>();

// The image for an art path, or null until it has loaded (the next frame draws it).
export function image(path: string): HTMLImageElement | null {
  let img = images.get(path);
  if (!img) {
    const src = url(path);
    if (!src) return null;
    img = new Image();
    img.decoding = "async";
    img.src = src;
    images.set(path, img);
    // Decode off the main thread now, so the first frame that draws it doesn't stall on it.
    img.decode?.().catch(() => undefined);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

// Everything the battle screen can draw (Park and his costumes and weapons, monsters, backgrounds,
// hit effects, the parking garage), loaded and decoded a few at a time while the game is idle, so
// a new monster, boss or costume never appears mid-fight with a hitch while its image decodes.
const BATTLE_ART = /^(park\/|parts\/suits\/strips\/|parts\/gear\/|backgrounds\/|monsters\/|fx\/|parking\/)/;
let preloading = false;
export function preloadBattleArt(): void {
  if (preloading || typeof window === "undefined") return;
  preloading = true;
  const queue = Object.keys(URLS).map((k) => k.slice("../../art/".length)).filter((p) => BATTLE_ART.test(p));
  const idle = (fn: () => void) =>
    typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(fn, { timeout: 500 }) : setTimeout(fn, 50);
  const step = () => {
    for (const path of queue.splice(0, 8)) image(path);
    if (queue.length > 0) idle(step);
  };
  idle(step);
}

// ---- monsters ----

export type MonsterAnim = "idle" | "hurt" | "death";

export interface MonsterSprite {
  id: string;
  name: string;
  size: number;
  baseline: number;
  hover: number;
  hpBar: Point;
  anims: Record<MonsterAnim, { file: string; frames: number; ms: number }>;
}

interface MonsterJson {
  id: string;
  name: string;
  frameWidth: number;
  feetBaselineY: number;
  hoverPx: number;
  hpBarAnchor: Point;
  animations: Record<MonsterAnim, { file: string; frameCount: number; frameDurationMs: number }>;
}

const MONSTERS = monstersJson.monsters as unknown as Record<string, MonsterJson>;
const DEPARTMENTS = monstersJson.departments as unknown as {
  name: string; normal: string[]; spareNormal: string[]; teamLeader: string; executive: string;
}[];

// The office-parody bosses (see monsterFor) and the CEO who turns up every 50 floors.
export const CEO_BOSS = "lee_ceo";
export const PARODY_BOSSES: readonly string[] = ["card_audit_bujang", "third_year_jooim", "ppeongtwigi_gwajang", "mz_sawon", "love_daeri", "airpod_mz"];

function monsterSprite(id: string): MonsterSprite | undefined {
  const m = MONSTERS[id];
  if (!m) return undefined;
  const anim = (k: MonsterAnim) => ({
    file: `monsters/${m.animations[k].file}`, frames: m.animations[k].frameCount, ms: m.animations[k].frameDurationMs,
  });
  return {
    id: m.id, name: m.name, size: m.frameWidth, baseline: m.feetBaselineY, hover: m.hoverPx, hpBar: m.hpBarAnchor,
    anims: { idle: anim("idle"), hurt: anim("hurt"), death: anim("death") },
  };
}

// The monster standing at this floor's `target`-th place. Bosses (every floor's last monster): the
// department's executive on every 100th floor, 명품 두른 이대표 on the other 50th floors, an
// office parody on the other floors ending in 0 (in rotation), and the department's team leader on
// every other floor. Otherwise one of the department's normal monsters (picked by floor and place,
// so the same spot always shows the same monster).
export function monsterFor(department: string, floor: number, target: number, boss: boolean): MonsterSprite | undefined {
  const d = DEPARTMENTS.find((x) => x.name === department) ?? DEPARTMENTS[0];
  if (!d) return undefined;
  if (boss) {
    if (floor % 100 === 0) return monsterSprite(d.executive);
    if (floor % 50 === 0) return monsterSprite(CEO_BOSS);
    if (floor % 10 === 0) return monsterSprite(PARODY_BOSSES[(floor / 10) % PARODY_BOSSES.length]);
    return monsterSprite(d.teamLeader);
  }
  const pool = [...d.normal, ...d.spareNormal];
  return monsterSprite(pool[(floor * 7 + target * 3) % pool.length]);
}

// Every picture in the game, loaded and decoded up front (the loading screen waits for it), so
// nothing is fetched or decoded while playing. Reports progress as 0..1; a picture that fails to
// load counts as done.
export async function preloadAll(onProgress: (done: number) => void): Promise<void> {
  const paths = Object.keys(URLS).map((k) => k.slice("../../art/".length));
  let done = 0;
  const one = async (path: string) => {
    image(path);
    const img = images.get(path);
    if (img) {
      if (!img.complete) await new Promise((r) => { img.addEventListener("load", r, { once: true }); img.addEventListener("error", r, { once: true }); });
      await img.decode?.().catch(() => undefined);
    }
    done += 1;
    onProgress(done / paths.length);
  };
  // A few at a time keeps the progress bar moving smoothly.
  for (let i = 0; i < paths.length; i += 12) await Promise.all(paths.slice(i, i + 12).map(one));
}
