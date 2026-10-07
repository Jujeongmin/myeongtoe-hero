// 30-day balance simulator: a scripted player plays the real rules (shared/: settle + applyIntent)
// on a daily routine, and the curve that comes out is what the numbers are tuned against
// (design §9.3). Three players: 무과금 (free), 광고 (watches every ad), 소과금 (premium, salary pass,
// rookie pack, a small gem pack a week).
// Run: npm run sim
import { applyIntent, RuleError, type Intent } from "../shared/actions";
import { AD_PLACEMENTS } from "../shared/data/ads";
import { CERTS, certLevelCost, certOpen } from "../shared/data/certs";
import { DAILY_QUESTS } from "../shared/data/dailyQuests";
import { GEAR_MAX_LEVEL, GEAR_TIERS } from "../shared/data/gear";
import { SUIT_ITEMS } from "../shared/data/costumes";
import { OFFICE_PARTS } from "../shared/data/home";
import { SPECIAL_MISSIONS } from "../shared/data/missions";
import { petsUnlocked } from "../shared/data/pets";
import { relicsUnlocked } from "../shared/data/relics";
import { SIDE_JOBS, sideJobCycle, sideJobIncome } from "../shared/data/sideJobs";
import { Big } from "../shared/big";
import { PRESTIGE_MIN_FLOOR } from "../shared/data/prestige";
import { grantPurchase } from "../shared/data/shop";
import { formatBig, formatCount } from "../shared/format";
import { gearLevelCostFor, gearPriceFor, sideJobCostFor } from "../shared/prices";
import { settle } from "../shared/settle";
import { newState, type GameState } from "../shared/state";
import { incomePerSec, jobChangeReward } from "../shared/stats";

type Profile = "free" | "ads" | "paid";

const DAY = 86_400_000;
const MIN = 60_000;
// Four short check-ins a day (hours after midnight, minutes long); the rest is offline.
const SESSIONS: readonly [number, number][] = [[8, 15], [12.5, 10], [19, 20], [22.5, 15]];
const STEP_MS = 30_000;
// Job change once the run has not gained a floor for this long online, past floor 100.
const STALL_MS = 120 * MIN;
const START = Date.UTC(2026, 9, 5, 15, 0, 0); // 00:00 KST

function attempt(s: GameState, intent: Intent): GameState | null {
  try {
    return applyIntent(s, intent);
  } catch (error) {
    if (error instanceof RuleError) return null;
    throw error;
  }
}

// Spends gold: the side-job level with the best income gained per gold, or the next gear step when
// that is no dearer (gear first while a boss blocks the run), until nothing fits.
function spendGold(s: GameState): GameState {
  for (let i = 0; i < 2000; i++) {
    let job: { id: string; cost: Big; ratio: number } | null = null;
    for (const j of SIDE_JOBS) {
      const lv = s.sideJobs[j.id]?.level ?? 0;
      const cost = sideJobCostFor(s, j, lv);
      const gain = sideJobIncome(j, lv + 1).sub(sideJobIncome(j, lv)).mulN(1 / sideJobCycle(j, lv + 1));
      const ratio = gain.div(cost).toNumber();
      if (!job || ratio > job.ratio) job = { id: j.id, cost, ratio };
    }
    const gearIntent: Intent | null = s.gear.level < GEAR_MAX_LEVEL ? { k: "levelGear" } : s.gear.tier + 1 < GEAR_TIERS.length ? { k: "buyGear" } : null;
    const gearCost = s.gear.level < GEAR_MAX_LEVEL ? gearLevelCostFor(s, s.gear.tier, s.gear.level) : gearPriceFor(s, Math.min(s.gear.tier + 1, GEAR_TIERS.length - 1));
    const gearFirst = gearIntent && (s.run.farming || !job || gearCost.cmp(job.cost) <= 0);
    const order: Intent[] = [];
    if (gearFirst && gearIntent) order.push(gearIntent);
    // Blocked by a boss: save for the gear, buying only side-job levels that are small change next to it.
    const saving = s.run.farming && gearIntent && job && job.cost.mulN(100).cmp(gearCost) > 0;
    if (job && !saving) order.push({ k: "levelSideJob", id: job.id });
    if (!gearFirst && gearIntent) order.push(gearIntent);
    let next: GameState | null = null;
    for (const o of order) {
      next = attempt(s, o);
      if (next) break;
    }
    if (!next) return s;
    s = next;
  }
  return s;
}

const CERT_ORDER = ["atk1", "b_aspd", "b_crit", "crit1", "gold1", "b_cost", "b_side", "side1", "grit1", "atk2", "crit2", "gold2", "side2"];

function spendTickets(s: GameState): GameState {
  for (let i = 0; i < 2000; i++) {
    let best: { id: string; cost: number } | null = null;
    for (const id of CERT_ORDER) {
      const def = CERTS.find((c) => c.id === id)!;
      const lv = s.certs[id] ?? 0;
      if (lv >= def.maxLevel || !certOpen(def, s.certs)) continue;
      const cost = certLevelCost(def, lv);
      if (!best || cost < best.cost) best = { id, cost };
    }
    if (!best || s.tickets < best.cost) return s;
    s = attempt(s, { k: "levelCert", id: best.id, bulk: false }) ?? s;
  }
  return s;
}

function spendGems(s: GameState): GameState {
  for (let i = 0; i < 200; i++) {
    const tries: Intent[] = [
      ...petsUnlocked(s.bestFloor).map((p) => ({ k: "levelPet", id: p.id }) as Intent),
      ...relicsUnlocked(s.bestFloor).map((r) => ({ k: "levelRelic", id: r.id }) as Intent),
      { k: "expandApartment" },
      { k: "levelCert", id: "c_coach", bulk: false },
    ];
    let next: GameState | null = null;
    for (const t of tries) {
      next = attempt(s, t);
      if (next) break;
    }
    if (!next) return s;
    s = next;
  }
  return s;
}

function spendCoupons(s: GameState): GameState {
  for (const item of SUIT_ITEMS) {
    if (s.suits.includes(item.id)) continue;
    const bought = attempt(s, { k: "buySuit", id: item.id });
    if (!bought) break;
    s = attempt(bought, { k: "wearSuit", id: item.id }) ?? bought;
  }
  for (let i = 0; i < 50; i++) {
    let done = true;
    for (const part of OFFICE_PARTS) {
      const next = attempt(s, { k: "upgradeOffice", part: part.key });
      if (next) {
        s = next;
        done = false;
      }
    }
    if (done) break;
  }
  return s;
}

function claimAll(s: GameState): GameState {
  for (let i = 0; i < 25; i++) s = attempt(s, { k: "claimStep" }) ?? s;
  s = attempt(s, { k: "claimAttendance" }) ?? s;
  s = attempt(s, { k: "claimDailyVx" }) ?? s;
  for (const m of SPECIAL_MISSIONS) s = attempt(s, { k: "claimSpecial", id: m.id }) ?? s;
  for (const q of DAILY_QUESTS) s = attempt(s, { k: "claimDaily", id: q.id }) ?? s;
  return s;
}

interface Run {
  s: GameState;
  runBestAt: number;
  firstPrestigeAt: number | null;
  log: string[];
}

function act(r: Run, profile: Profile, now: number): void {
  let s = settle(r.s, now);
  if (profile !== "free") {
    for (const ad of AD_PLACEMENTS) s = attempt(s, { k: "watchAd", id: ad.id }) ?? s;
  }
  while (s.parking.passes > 0) s = attempt(s, { k: "enterParking" }) ?? { ...s, parking: { ...s.parking, passes: 0 } };
  s = claimAll(s);
  s = spendGold(s);
  s = spendTickets(s);
  s = spendGems(s);
  s = spendCoupons(s);
  if (s.run.maxFloor > (r.s.run.maxFloor ?? 0)) r.runBestAt = now;
  if (s.run.maxFloor >= PRESTIGE_MIN_FLOOR && now - r.runBestAt > STALL_MS) {
    const mode = s.gems >= 1500 && profile !== "free" ? "super" : "plain";
    const reward = jobChangeReward(s);
    const next = attempt(s, { k: "prestige", mode });
    if (next) {
      if (r.firstPrestigeAt === null) r.firstPrestigeAt = now;
      r.log.push(`  이직 #${next.prestiges} ${((now - START) / 3_600_000).toFixed(1)}h 최고 ${s.run.maxFloor}층 응시권 +${formatCount(reward.tickets)}`);
      s = next;
      r.runBestAt = now;
    }
  }
  r.s = s;
}

export function simulate(profile: Profile, days: number): Run {
  let s = newState(START);
  if (profile === "paid") {
    s = grantPurchase(s, "pack_rookie", 1, START);
    s = grantPurchase(s, "premium", 1, START);
    s = grantPurchase(s, "pass_salary", 1, START);
    s = attempt(s, { k: "toggleSpeed" }) ?? s;
  }
  const r: Run = { s, runBestAt: START, firstPrestigeAt: null, log: [] };
  for (let d = 0; d < days; d++) {
    if (profile === "paid" && d > 0 && d % 7 === 0) r.s = grantPurchase(r.s, "gems_m", 1, START + d * DAY);
    if (profile === "paid" && d === 30) r.s = grantPurchase(r.s, "pass_salary", 1, START + d * DAY);
    for (const [hour, minutes] of SESSIONS) {
      const from = START + d * DAY + hour * 3_600_000;
      for (let t = from; t <= from + minutes * MIN; t += STEP_MS) act(r, profile, t);
    }
    const s2 = r.s;
    if (process.env.DEBUG) r.log.push(`   q=${formatBig(incomePerSec(s2))}/s jobs=${Object.entries(s2.sideJobs).map(([id, j]) => `${id}:${j.level}`).join(",")} certs=${JSON.stringify(s2.certs)} pets=${JSON.stringify(s2.pets)} apt=${s2.apartment}`);
    r.log.push(`D${d + 1}: 최고 ${s2.bestFloor}층 · 이번 회차 ${s2.run.maxFloor}층 · 이직 ${s2.prestiges}회 · 장비 ${s2.gear.tier + 1}단계 · 타격기능사 Lv${s2.certs.atk1 ?? 0} · 골드 ${formatBig(s2.gold)} · 보석 ${s2.gems}`);
  }
  return r;
}

// The first session: a new free player plays FIRST_MIN minutes straight, watching only the 2× speed
// ad (again whenever it is ready), upgrading every 5 seconds and retrying the boss when farming.
// Run: FIRST=30 npm run sim
export function firstSession(minutes: number): string[] {
  let s = newState(START);
  const out: string[] = [];
  let shown = 0;
  for (let now = START; now <= START + minutes * MIN; now += 5_000) {
    s = settle(s, now);
    if (!process.env.NOAD) s = attempt(s, { k: "watchAd", id: "ad_speed" }) ?? s;
    s = claimAll(s);
    s = spendGold(s);
    s = spendTickets(s);
    if (s.run.farming) s = attempt(s, { k: "challengeBoss" }) ?? s;
    const min = Math.floor((now - START) / MIN);
    if (min >= shown) {
      out.push(`${min}분: ${s.run.maxFloor}층 · 장비 ${s.gear.tier + 1}단계 Lv${s.gear.level} · 골드 ${formatBig(s.gold)}${s.run.farming ? " (보스 막힘)" : ""}`);
      shown += 5;
    }
  }
  return out;
}

const days = Number(process.env.DAYS ?? 30);
if (process.env.FIRST) {
  for (const line of firstSession(Number(process.env.FIRST))) console.log(line);
  process.exit(0);
}
for (const profile of (process.env.PROFILES ?? "free,ads,paid").split(",") as Profile[]) {
  const t0 = Date.now();
  const r = simulate(profile, days);
  console.log(`\n=== ${profile} (${((Date.now() - t0) / 1000).toFixed(1)}s) — 첫 이직 ${r.firstPrestigeAt === null ? "없음" : `${((r.firstPrestigeAt - START) / 3_600_000).toFixed(1)}h`}`);
  for (const line of r.log) console.log(line);
}
