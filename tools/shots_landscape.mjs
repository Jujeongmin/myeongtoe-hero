// Landscape store screenshots (16:9, 1280x720, each under 1 MB, named 1.png … 6.png).
// Drives a headless Chrome over the DevTools protocol against the dev server (npm run dev, then:
// node tools/shots_landscape.mjs), plays the real UI from a planted mid-game save and takes the phone
// screen (480x720 at 2x) at each of 8 scenes; tools/store_shots.py then dresses them for the store
// page (gold-framed phones over the game's office background, a headline and two lines of copy).
// Output: store/screenshots/landscape/.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL = process.env.SHOT_URL ?? "http://localhost:5180/?local";
const PORT = 9335;
const OUT = "store/screenshots/landscape";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A save a few hours in, built with the game's own rules (so its shape is always the current one).
const PLANT = `
  const m = await import("/shared/state.ts");
  const { kstDay } = await import("/shared/time.ts");
  const { Big } = await import("/shared/big.ts");
  const now = Date.now();
  const s = m.newState(now);
  const parts = ["helmet", "armor", "cape", "gloves", "boots", "accessory"];
  s.nickname = "박부장";
  s.story = ["prologue2", "ep0", "hunter", "ep1", "parking"];
  s.missions = { step: 17, special: [] };
  s.attendance = { lastDay: kstDay(now), count: 3 };
  s.run = { floor: 128, target: 0, carrySec: 0, farming: false, maxFloor: 128, gearBoost: 0 };
  s.bestFloor = 128;
  // Weak enough that a boss fight lasts about twenty seconds (shared/settle targetSec), long enough to photograph.
  s.gear = { tier: 12, level: 4, confirmed: 3 };
  s.gold = Big.of(1, 15);
  s.tickets = 400; s.gems = 900; s.coupons = 300; s.prestiges = 2; s.apartment = 4;
  s.certs = { atk1: 60, b_crit: 10, gold1: 14 };
  s.suits = [1, 2].flatMap((n) => parts.map((p) => "s" + n + "_" + p));
  s.wear = Object.fromEntries(parts.map((p) => [p, "s2_" + p]));
  s.sideJobs = { j00: { level: 40, progressSec: 0, running: true }, j01: { level: 30, progressSec: 0, running: true }, j02: { level: 18, progressSec: 0, running: true }, j03: { level: 9, progressSec: 0, running: true } };
  s.parking.passes = 9; s.parking.best = 60;
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
  const hold = async (el, ms) => { el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 })); await sleep(ms); el.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0 })); };
  const menu = async (label) => { document.querySelector(".menu-btn").click(); await sleep(500); [...document.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(label)).click(); await sleep(900); };`;

async function main() {
  const profile = join(tmpdir(), `lshots-${Date.now()}`);
  const raw = join(tmpdir(), `lshots-raw-${Date.now()}`);
  mkdirSync(raw, { recursive: true });
  mkdirSync(OUT, { recursive: true });
  const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
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
    ws.addEventListener("message", (e) => {
      const m = JSON.parse(e.data);
      if (m.id && waiting.has(m.id)) waiting.get(m.id)(m);
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
    let n = 0;
    const shot = async (label) => {
      const r = await send("Page.captureScreenshot", { format: "png" });
      writeFileSync(join(raw, `${++n}.png`), Buffer.from(r.result.data, "base64"));
      console.log("shot", n, label);
    };

    await send("Emulation.setDeviceMetricsOverride", { width: 480, height: 720, deviceScaleFactor: 2, mobile: false });
    await send("Page.navigate", { url: URL });
    await sleep(3000);
    await run(PLANT);
    await send("Page.navigate", { url: URL });
    await run(`${S} for (let i = 0; i < 160 && !document.querySelector(".phone"); i++) await sleep(250); await sleep(1200);`);

    // 1. The fight, the mission card, gold a second.
    await run(`${S} await sleep(1800);`);
    await shot("battle");
    // 2. The boss: caught with its timer up (a boss falls in about six seconds, so look again).
    for (let tries = 0; tries < 6; tries++) {
      await run(`${S} for (let i = 0; i < 160 && !document.querySelector(".boss-timer"); i++) await sleep(100); await sleep(1700);`);
      if (await run(`return !!document.querySelector(".boss-timer");`)) break;
    }
    await shot("boss");
    await run(`${S} for (let i = 0; i < 100 && document.querySelector(".boss-timer"); i++) await sleep(150); await sleep(800);`);
    // 3. Side jobs, 10 levels a press, caught as it flashes.
    await run(`${S} nav("sideJobs"); await sleep(900); const b = document.querySelector(".list .row .hot"); await hold(b, 120); await sleep(350);`);
    await shot("side jobs");
    // 4. Costumes.
    await run(`${S} nav("gear"); await menu("코스튬"); await sleep(900);`);
    await shot("costume");
    await run(`${S} [...document.querySelectorAll(".sheet header button")].pop().click(); await sleep(500);`);
    // 5. A webtoon page.
    await run(`${S} await menu("스토리"); [...document.querySelectorAll(".sheet .row button:not(:disabled)")].find((b) => b.closest(".row").innerText.includes("1화")).click(); await sleep(1800);`);
    await shot("webtoon");
    await run(`${S} document.querySelector(".story header button").click(); await sleep(500); [...document.querySelectorAll(".sheet header button")].pop().click(); await sleep(500);`);
    // 6. 연봉협상: the seal.
    await run(`${S} document.querySelector(".prestige-btn").click(); await sleep(1300); const sign = document.querySelector(".prestige-card.plain button"); sign.click(); await sleep(400); sign.click(); await sleep(1750);`);
    await shot("seal");
    // 7. 피버타임.
    await run(`${S} await sleep(4200);`);
    await shot("fever");
    await run(`${S} for (let i = 0; i < 160 && document.querySelector('[data-tut="nav-gear"]') && !document.querySelector(".battle-head"); i++) await sleep(150); await sleep(14000);`);
    // 8. 지하주차장.
    await run(`${S} nav("dungeon"); await sleep(900); document.querySelector('[data-tut="park-enter"]').click(); await sleep(11500);`);
    await shot("garage");
    ws.close();

    const r = spawnSync("python", ["tools/store_shots.py", raw, OUT], { stdio: "inherit" });
    if (r.status !== 0) throw new Error("compose failed");
  } finally {
    chrome.kill();
  }
}

await main();
