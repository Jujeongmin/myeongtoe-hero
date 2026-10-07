// Store screenshots: drives a headless Chrome over the DevTools protocol against the dev server
// (npm run dev, then: node tools/shots.mjs). A phone screen (390×844 at 3×) with a mid-game save
// planted in localStorage; each scene is set up by clicking through the real UI.
// Output: store/screenshots/*.png (1170×2532).
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL = process.env.SHOT_URL ?? "http://localhost:5180/?local";
const PORT = 9333;
const OUT = "store/screenshots";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A save about a week in: floor 230, a costume set worn, buffs running, every episode read so none
// pops up over the scene.
function plantedSave(now) {
  const parts = ["helmet", "armor", "cape", "gloves", "boots", "accessory"];
  const owned = [1, 2, 3, 4].flatMap((n) => parts.map((p) => `s${n}_${p}`));
  const story = ["prologue2", "ep0", "ep1", "hunter", "ep2", "ep3", "ep4", "ep5", "ep6", "ep7", "ep8", "ep9", "ep10", "ep11", "ep12"];
  return {
    v: 12, lastTick: now, gold: "8.4e15",
    run: { floor: 230, target: 9, carrySec: 0, farming: true, maxFloor: 230, gearBoost: 0 },
    bestFloor: 230, gear: { tier: 12, level: 3, confirmed: 8 },
    sideJobs: { j00: { level: 120, progressSec: 0, running: true }, j01: { level: 104, progressSec: 0, running: true }, j02: { level: 60, progressSec: 0, running: true }, j03: { level: 41, progressSec: 0, running: true }, j04: { level: 26, progressSec: 0, running: true } },
    reserved: {}, tickets: 5200, gems: 1250, certs: { atk1: 40, b_crit: 12 }, rngSeed: 7, prestiges: 9, coupons: 320, ticketCarry: 0,
    pets: {}, relics: {}, apartment: 2, suits: owned, wear: Object.fromEntries(parts.map((p) => [p, `s3_${p}`])),
    office: { keyboard: 3, mouse: 2, chair: 2, monitor: 2 },
    parking: { passes: 3, passCarrySec: 0, best: 180, runFrom: 0, runUntil: 0, last: null, claimed: true },
    daily: { day: "", entries: 0, bestDepth: 0, claimed: [] }, missions: { step: 20, special: [] }, attendance: { lastDay: "", count: 0 },
    nickname: "박부장", buffs: { atk: now + 25 * 60_000, gold: now + 25 * 60_000, move: now + 25 * 60_000 }, ads: {}, startedAt: now - 7 * 86_400_000,
    vx: { total: 0, premium: false, passUntil: 0, dailyClaimed: "", rookie: false, promos: [] },
    speed: { until: 0, on: false }, costume: { auras: [], aura: 0, legend: {} }, story,
  };
}

async function main() {
  const profile = join(tmpdir(), `shots-${Date.now()}`);
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
      return r.result?.result?.value;
    };
    const shot = async (name) => {
      const r = await send("Page.captureScreenshot", { format: "png" });
      writeFileSync(join(OUT, `${name}.png`), Buffer.from(r.result.data, "base64"));
      console.log("saved", name);
    };

    mkdirSync(OUT, { recursive: true });
    await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
    await send("Page.navigate", { url: URL });
    await sleep(2500);
    await run(`localStorage.clear(); localStorage.setItem("myeongtoe-hero:locale", "ko"); localStorage.setItem("myeongtoe-hero:save", ${JSON.stringify(JSON.stringify(plantedSave(Date.now())))});`);
    const fresh = async () => {
      await send("Page.navigate", { url: URL });
      await sleep(4000);
      await run(`document.querySelectorAll(".modal button").forEach((b) => b.innerText.length < 14 && b.click()); document.querySelectorAll(".story header button").forEach((b) => b.click());`);
      await sleep(600);
    };
    const S = `const sleep = (ms) => new Promise((r) => setTimeout(r, ms));`;
    const openSide = (label) => `${S} document.querySelector(".menu-btn").click(); await sleep(300); [...document.querySelectorAll(".side-icons button")].find((b) => b.innerText.includes("${label}")).click(); await sleep(700);`;

    await fresh();
    await run(`${S} [...document.querySelectorAll(".bottom-nav button")][1].click(); await sleep(400); window.__quip = "아이고 허리야… 믹스커피 한 잔만…"; await sleep(1200);`);
    await shot("1_battle");

    await fresh();
    await run(`${S} [...document.querySelectorAll(".bottom-nav button")][0].click(); await sleep(300); document.querySelector(".boss-btn")?.click(); await sleep(3500);`);
    await shot("2_boss");

    await fresh();
    await run(openSide("코스튬"));
    await shot("3_costume");

    await fresh();
    await run(`${S} document.querySelector(".prestige-btn").click(); await sleep(900);`);
    await shot("4_prestige");

    await fresh();
    await run(`${openSide("스토리")} [...document.querySelectorAll(".sheet .row")].find((r) => r.innerText.includes("1화 —")).querySelector("button").click(); await sleep(1500);`);
    await shot("5_webtoon");
    ws.close();
  } finally {
    chrome.kill();
  }
}

await main();
