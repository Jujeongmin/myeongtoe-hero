// Sound: short effects and a looping background track, each with its own volume (설정), kept on
// this device. Everything goes through one Web Audio context, which the browser only lets start
// after the first touch; until then nothing plays. It goes quiet while the page is hidden.
// The files are Mixkit sounds (art/audio/CREDITS.md).
const FILES = import.meta.glob("../../art/audio/*.mp3", { eager: true, query: "?url", import: "default" }) as Record<string, string>;

export type Sfx = "hit" | "crit" | "kill" | "levelup" | "buy" | "tap" | "boss" | "coin" | "reward";
export type Bgm = "battle" | "parking";

// Some sounds stand in for others (the user picked them that way): a coin landing sounds like a
// purchase, a mission reward like a button.
const SFX_FILE: Record<Sfx, string> = {
  hit: "sfx_hit", crit: "sfx_crit", kill: "sfx_kill", levelup: "sfx_levelup", buy: "sfx_buy", tap: "sfx_tap", boss: "sfx_boss",
  coin: "sfx_buy", reward: "sfx_tap",
};
// The fewest milliseconds between two plays of one sound, so a fast fight doesn't turn to noise.
const GAP_MS: Partial<Record<Sfx, number>> = { hit: 70, crit: 70, buy: 120, levelup: 60, tap: 60, coin: 250 };

const KEY = "myeongtoe-hero:volume";
export interface Volumes { sfx: number; bgm: number }
const DEFAULT: Volumes = { sfx: 0.7, bgm: 0.5 };

function load(): Volumes {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<Volumes> | null;
    const clamp = (x: unknown, d: number) => (typeof x === "number" && x >= 0 && x <= 1 ? x : d);
    return { sfx: clamp(v?.sfx, DEFAULT.sfx), bgm: clamp(v?.bgm, DEFAULT.bgm) };
  } catch {
    return { ...DEFAULT };
  }
}

let volumes = load();
let ctx: AudioContext | null = null;
let sfxGain: GainNode | null = null;
let bgmGain: GainNode | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();
const lastAt = new Map<Sfx, number>();
let lastAnyAt = -1e9;
let wantBgm: Bgm | null = null;
let playing: { name: Bgm; node: AudioBufferSourceNode } | null = null;

function buffer(name: string): Promise<AudioBuffer | null> {
  let b = buffers.get(name);
  if (!b) {
    const src = FILES[`../../art/audio/${name}.mp3`];
    b = !ctx || !src
      ? Promise.resolve(null)
      : fetch(src).then((r) => r.arrayBuffer()).then((data) => ctx!.decodeAudioData(data)).catch(() => null);
    if (ctx) buffers.set(name, b);
  }
  return b;
}

// The first touch anywhere starts the sound (a browser rule).
function start(): void {
  if (ctx) {
    void ctx.resume();
    return;
  }
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  sfxGain = ctx.createGain();
  bgmGain = ctx.createGain();
  sfxGain.gain.value = volumes.sfx;
  bgmGain.gain.value = volumes.bgm;
  sfxGain.connect(ctx.destination);
  bgmGain.connect(ctx.destination);
  for (const f of Object.values(SFX_FILE)) void buffer(f);
  if (wantBgm) void switchBgm(wantBgm);
}

export function initAudio(): void {
  const first = () => start();
  window.addEventListener("pointerdown", first, { capture: true });
  window.addEventListener("keydown", first, { capture: true });
  // Every button clicks like a stapler, unless what it did already made its own sound.
  document.addEventListener("click", (e) => {
    const b = (e.target as Element | null)?.closest?.("button");
    if (b && !b.disabled && performance.now() - lastAnyAt > 50) sfx("tap");
  });
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else void ctx.resume();
  });
}

// The sound an action makes when it goes through.
const ACTION_SFX: Record<string, Sfx> = {
  levelGear: "levelup", levelSideJob: "levelup", levelCert: "levelup", levelPet: "levelup", levelRelic: "levelup",
  levelLegend: "levelup", upgradeOffice: "levelup", expandApartment: "levelup",
  buyGear: "buy", buySuit: "buy", buyAura: "buy", buyGemItem: "buy", petBox: "buy", confirmGear: "buy",
  claimStep: "reward", claimDaily: "reward", claimSpecial: "reward", claimAttendance: "reward", claimParking: "reward", claimDailyVx: "reward",
};

export function actionSfx(kind: string): void {
  const s = ACTION_SFX[kind];
  if (s) sfx(s);
}

export function sfx(name: Sfx): void {
  if (!ctx || !sfxGain || volumes.sfx <= 0 || ctx.state !== "running") return;
  const now = performance.now();
  if (now - (lastAt.get(name) ?? -1e9) < (GAP_MS[name] ?? 0)) return;
  lastAt.set(name, now);
  lastAnyAt = now;
  const out = sfxGain;
  void buffer(SFX_FILE[name]).then((b) => {
    if (!b || !ctx) return;
    const node = ctx.createBufferSource();
    node.buffer = b;
    node.connect(out);
    node.start();
  });
}

async function switchBgm(name: Bgm): Promise<void> {
  if (!ctx || !bgmGain || playing?.name === name) return;
  const b = await buffer(`bgm_${name}`);
  if (!b || !ctx || wantBgm !== name || playing?.name === name) return;
  playing?.node.stop();
  const node = ctx.createBufferSource();
  node.buffer = b;
  node.loop = true;
  node.connect(bgmGain);
  node.start();
  playing = { name, node };
}

// Which track should be on (the garage has its own); it starts once sound is allowed.
export function bgm(name: Bgm): void {
  wantBgm = name;
  void switchBgm(name);
}

export function getVolumes(): Volumes {
  return volumes;
}

export function setVolumes(next: Volumes): void {
  volumes = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // the setting just isn't kept
  }
  if (sfxGain) sfxGain.gain.value = next.sfx;
  if (bgmGain) bgmGain.gain.value = next.bgm;
}
