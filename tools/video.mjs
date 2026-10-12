// Gameplay video for the store: drives a headless Chrome over the DevTools protocol against the dev
// server (npm run dev, then: node tools/video.mjs), plays a scripted tour of the real UI and records
// it with Page.startScreencast, then encodes an H.264 mp4 with ffmpeg.
// A square 480x480 view at 1.5x = 720x720 (1:1, 720p-class), at most 9 MB (it picks the bitrate).
// Output: store/video/gameplay.mp4. No sound: a headless page has no audio to record.
// Needs Chrome and an ffmpeg with libx264 (set FFMPEG; the Python imageio-ffmpeg one works).
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const FFMPEG = process.env.FFMPEG ?? spawnSync("python", ["-c", "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"], { encoding: "utf8" }).stdout.trim();
const URL = process.env.VIDEO_URL ?? "http://localhost:5180/?local";
const PORT = 9334;
const SIZE = 480;
const SCALE = 1.5;
const FPS = 30;
const MAX_MB = 9;
const OUT = "store/video";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A save a few hours in, built with the game's own rules (so its shape is always the current one).
const PLANT = `
  const m = await import("/shared/state.ts");
  const { kstDay } = await import("/shared/time.ts");
  const now = Date.now();
  const s = m.newState(now);
  const parts = ["helmet", "armor", "cape", "gloves", "boots", "accessory"];
  s.nickname = "박부장";
  s.story = ["prologue2", "ep0", "hunter", "ep1"];
  s.missions = { step: 23, special: [] };
  s.attendance = { lastDay: kstDay(now), count: 3 };
  s.run = { floor: 128, target: 1, carrySec: 0, farming: false, maxFloor: 128, gearBoost: 0 };
  s.bestFloor = 128;
  // Strong enough that a monster falls in about a second and the boss in about six (shared/settle targetSec).
  s.gear = { tier: 13, level: 2, confirmed: 3 };
  s.gold = (await import("/shared/big.ts")).Big.of(1, 15);
  s.tickets = 400; s.gems = 900; s.coupons = 300; s.prestiges = 2; s.apartment = 4;
  s.certs = { atk1: 80, b_crit: 10, gold1: 14 };
  s.suits = [1, 2].flatMap((n) => parts.map((p) => "s" + n + "_" + p));
  s.wear = Object.fromEntries(parts.map((p) => [p, "s2_" + p]));
  s.sideJobs = { j00: { level: 40, progressSec: 0, running: true }, j01: { level: 30, progressSec: 0, running: true }, j02: { level: 18, progressSec: 0, running: true }, j03: { level: 9, progressSec: 0, running: true } };
  s.startedAt = now - 5 * 86_400_000;
  localStorage.clear();
  localStorage.setItem("myeongtoe-hero:locale", "ko");
  localStorage.setItem("myeongtoe-hero:save", JSON.stringify(m.toSave(s)));
  localStorage.setItem("myeongtoe-hero:sidejob-count", "10");
  localStorage.setItem("myeongtoe-hero:intros-seen", JSON.stringify(["apartment", "office", "relics"]));
  localStorage.setItem("myeongtoe-hero:offers-seen", JSON.stringify(["pack_rookie", "pack_rookie_last", "pack_promo_100"]));
`;

const S = `const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const nav = (tab) => document.querySelector('[data-tut="nav-' + tab + '"]').click();
  const hold = async (el, ms) => { el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 })); await sleep(ms); el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0 })); };`;

async function main() {
  const profile = join(tmpdir(), `video-${Date.now()}`);
  const frames = join(tmpdir(), `video-frames-${Date.now()}`);
  mkdirSync(frames, { recursive: true });
  mkdirSync(OUT, { recursive: true });
  const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required", "about:blank"], { stdio: "ignore" });
  try {
    let target;
    for (let i = 0; i < 50 && !target; i++) {
      await sleep(200);
      target = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json()).then((l) => l.find((t) => t.type === "page")).catch(() => undefined);
    }
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((r) => ws.addEventListener("open", r, { once: true }));
    let id = 0;
    const waiting = new Map();
    const stamps = [];
    let sessionFrames = 0;
    ws.addEventListener("message", (e) => {
      const m = JSON.parse(e.data);
      if (m.id && waiting.has(m.id)) waiting.get(m.id)(m);
      if (m.method === "Page.screencastFrame") {
        const n = String(++sessionFrames).padStart(6, "0");
        writeFileSync(join(frames, `f${n}.jpg`), Buffer.from(m.params.data, "base64"));
        stamps.push(m.params.metadata.timestamp);
        send("Page.screencastFrameAck", { sessionId: m.params.sessionId });
      }
    });
    const send = (method, params = {}) => new Promise((resolve) => {
      const n = ++id;
      waiting.set(n, resolve);
      ws.send(JSON.stringify({ id: n, method, params }));
    });
    const run = async (expr) => {
      const r = await send("Runtime.evaluate", { expression: `(async () => { ${expr} })()`, awaitPromise: true, returnByValue: true });
      if (r.result?.exceptionDetails) console.log("page error:", r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text);
      return r.result?.result?.value;
    };

    await send("Emulation.setDeviceMetricsOverride", { width: SIZE, height: SIZE, deviceScaleFactor: SCALE, mobile: false });
    await send("Page.navigate", { url: URL });
    await sleep(3000);
    await run(PLANT);
    await send("Page.navigate", { url: URL });
    // The loading screen, then the game on the gear tab.
    await run(`${S} for (let i = 0; i < 120 && !document.querySelector(".phone"); i++) await sleep(250); await sleep(800);`);

    console.log("recording…");
    await send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: SIZE * SCALE, maxHeight: SIZE * SCALE, everyNthFrame: 1 });
    const t0 = Date.now();
    const at = (label) => console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s ${label}`);

    // 1. The fight, up to the boss: its timer, its fall, the next floor.
    at("battle and boss");
    await run(`${S} await sleep(2500);
      for (let i = 0; i < 60 && !document.querySelector(".boss-timer"); i++) await sleep(150);
      for (let i = 0; i < 160 && document.querySelector(".boss-timer"); i++) await sleep(150);
      await sleep(1800);`);
    // 2. Side jobs, 10 levels a press.
    at("side jobs");
    await run(`${S} nav("sideJobs"); await sleep(900);
      for (const b of [...document.querySelectorAll(".list .row .hot")].slice(0, 3)) { await hold(b, 120); await sleep(450); }
      await sleep(700);`);
    // 3. Gear.
    at("gear");
    await run(`${S} nav("gear"); await sleep(800); const up = document.querySelector('[data-tut="gear-up"]'); up.scrollIntoView({ block: "center" }); await sleep(700); await hold(up, 900); await sleep(1600);`);
    // 5. Costumes.
    at("costume");
    await run(`${S} document.querySelector(".menu-btn").click(); await sleep(500);
      [...document.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith("코스튬")).click(); await sleep(1800);
      [...document.querySelectorAll(".sheet .tabs button")][3]?.click(); await sleep(1500);
      [...document.querySelectorAll(".sheet header button")].pop().click(); await sleep(500);`);
    // 6. A webtoon episode, page by page.
    at("webtoon");
    await run(`${S} document.querySelector(".menu-btn").click(); await sleep(500);
      [...document.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith("스토리")).click(); await sleep(900);
      [...document.querySelectorAll(".sheet .row button:not(:disabled)")][1].click(); await sleep(2600);
      document.querySelector(".story").click(); await sleep(2400);
      document.querySelector(".story header button").click(); await sleep(500);
      [...document.querySelectorAll(".sheet header button")].pop().click(); await sleep(500);`);
    // 7. 연봉협상: the cutscene, then 피버타임.
    at("연봉협상");
    await run(`${S} document.querySelector(".prestige-btn").click(); await sleep(1500);
      const sign = document.querySelector(".prestige-card.plain button"); sign.click(); await sleep(400); sign.click();
      await sleep(4800);
      await sleep(9000);`);
    at("end");
    await send("Page.stopScreencast");
    await sleep(500);
    ws.close();

    // Frames to a constant 30 fps video: each shown until the next arrives.
    const files = readdirSync(frames).filter((f) => f.endsWith(".jpg")).sort();
    const list = [];
    for (let i = 0; i < files.length; i++) {
      const dur = i + 1 < files.length ? Math.max(0.001, stamps[i + 1] - stamps[i]) : 0.2;
      list.push(`file '${join(frames, files[i]).replace(/\\/g, "/")}'`, `duration ${dur.toFixed(4)}`);
    }
    list.push(`file '${join(frames, files[files.length - 1]).replace(/\\/g, "/")}'`);
    writeFileSync(join(frames, "list.txt"), list.join("\n"));
    const seconds = stamps[stamps.length - 1] - stamps[0];
    // Bitrate from the size cap (kilobits a second), minus a little headroom for the container.
    const kbps = Math.floor(((MAX_MB * 8 * 1024) / seconds) * 0.93);
    console.log(`${files.length} frames, ${seconds.toFixed(1)} s, target ${kbps} kbps`);
    const out = join(OUT, "gameplay.mp4");
    const enc = spawnSync(FFMPEG, [
      "-y", "-hide_banner", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", join(frames, "list.txt"),
      // JPEG frames are full range; players and uploads expect standard limited-range BT.709.
      "-vf", `fps=${FPS},scale=720:720:flags=neighbor:in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p`,
      "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-maxrate", `${kbps}k`, "-bufsize", `${kbps * 2}k`,
      "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
      "-movflags", "+faststart", out,
    ], { stdio: "inherit" });
    if (enc.status !== 0) throw new Error("ffmpeg failed");
    console.log(`saved ${out} (${(statSync(out).size / 1048576).toFixed(2)} MB)`);
  } finally {
    chrome.kill();
    rmSync(frames, { recursive: true, force: true });
  }
}

await main();
