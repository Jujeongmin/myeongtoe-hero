import { certEffects } from "./data/certs";
import { AURAS, LEGENDS, LEGEND_SET, SUIT_ITEMS, hasCostume, legendValue } from "./data/costumes";
import { apartmentDamage } from "./data/home";
import { awakenStage, petsUnlocked } from "./data/pets";
import { relicsUnlocked } from "./data/relics";
import { PREMIUM_OFFLINE_SEC } from "./data/shop";
import { PARK_PASS_MAX, type GameState } from "./state";
import { vipLevel, vipPerks } from "./vip";

// Every permanent effect in one place: certificates, relics, the apartment, suits, office gear and
// pets. heroPower, settle and the offline cap read only this. Random effects (최대리's
// 0~30%, 공주임's buff, 오사원's drops) count as their expected values.
export interface Mods {
  dmgMult: number;
  aspdMult: number;
  critDmgAdd: number;
  critDmgMult: number;
  critChanceAdd: number;
  bossMult: number;
  goldMult: number;
  sideJobMult: number;
  // Gear prices and level costs, side-job level costs (구매관리사).
  costMult: number;
  prestigeBonus: number;
  prestigeFloorMult: number;
  prestigeFloorAdd: number;
  offlineSec: number;
  hpMult: number;
  drainPerSec: number;
  extraHitPerSec: number;
  sideJobPaySec: number;
  sideJobPayMult: number;
  ticketPerKill: number;
  // Walking speed (×), extra boss seconds, and the job-change ticket multiplier (with any that
  // apply only to runs up to a floor).
  moveMult: number;
  bossTimeAdd: number;
  prestigeTicketMult: number;
  prestigeBelow: [floor: number, mult: number][];
}

export function petLevel(s: GameState, id: string): number {
  return s.pets[id] ?? 1;
}

// A relic's level, 0 while it has not arrived yet.
export function relicLevel(s: GameState, id: string): number {
  return relicsUnlocked(s.bestFloor).some((r) => r.id === id) ? (s.relics[id] ?? 1) : 0;
}

export function mods(s: GameState): Mods {
  // 영업왕의 불꽃 counts 커리어코치 ten levels higher.
  const coachBonus = s.costume.auras.includes(2) ? 10 : 0;
  const certs = coachBonus ? { ...s.certs, c_coach: (s.certs.c_coach ?? 0) + coachBonus } : s.certs;
  const c = certEffects(certs, 1 + 0.2 * relicLevel(s, "r_pas"));
  const m: Mods = {
    dmgMult: c.dmgMult,
    aspdMult: c.aspdMult,
    critDmgAdd: c.critDmgAdd,
    critDmgMult: c.critDmgMult,
    critChanceAdd: c.critChanceAdd,
    bossMult: 1,
    goldMult: c.goldMult,
    sideJobMult: c.sideJobMult,
    costMult: c.costMult,
    prestigeBonus: c.prestigeBonus,
    prestigeFloorMult: 1,
    prestigeFloorAdd: c.prestigeFloors,
    offlineSec: 0,
    hpMult: 1,
    drainPerSec: 0,
    extraHitPerSec: 0,
    sideJobPaySec: 0,
    sideJobPayMult: 1,
    ticketPerKill: 0,
    moveMult: 1,
    bossTimeAdd: 0,
    prestigeTicketMult: 1,
    prestigeBelow: [],
  };
  applyRelics(s, m);
  applyHome(s, m);
  applyCostumes(s, m);
  applyPets(s, m);
  const vip = vipPerks(s);
  m.sideJobMult *= vip.sideJobMult;
  m.offlineSec += vip.offlineSec + (s.vx.premium ? PREMIUM_OFFLINE_SEC : 0);
  return m;
}

// Parking passes held at most (VIP 3 and 6 add one each).
export function parkPassMax(s: GameState): number {
  return PARK_PASS_MAX + vipPerks(s).parkPassBonus;
}

function applyHome(s: GameState, m: Mods): void {
  // 수습의 불꽃 counts the apartment seven pyeong bigger.
  const auraPyeong = s.costume.auras.includes(1) ? 7 : 0;
  m.dmgMult *= apartmentDamage(s.apartment + 2 * relicLevel(s, "r_fan") + auraPyeong);

  m.dmgMult *= 1 + 0.15 * (s.office.keyboard - 1);
  m.critDmgAdd += 0.05 * (s.office.mouse - 1);
  m.bossMult *= 1 + 0.1 * (s.office.chair - 1);
  m.goldMult *= 1 + 0.1 * (s.office.monitor - 1);
}

// Every costume owned (or rented) works, worn or not; effects multiply. Then the 불꽃 and the 전설
// costumes with their set effects.
function applyCostumes(s: GameState, m: Mods): void {
  let owned = 0;
  for (const item of SUIT_ITEMS) {
    if (!hasCostume(s, item.id)) continue;
    owned += 1;
    const e = item.effect;
    switch (e.k) {
      case "dmg": m.dmgMult *= 1 + e.v; break;
      case "critDmg": m.critDmgMult *= 1 + e.v; break;
      case "aspd": m.aspdMult *= 1 + e.v; break;
      case "gold": m.goldMult *= 1 + e.v; break;
      case "sideJob": m.sideJobMult *= 1 + e.v; break;
      case "boss": m.bossMult *= 1 + e.v; break;
      case "move": m.moveMult *= 1 + e.v; break;
      case "prestige": m.prestigeTicketMult *= 1 + e.v; break;
      case "critChance": m.critChanceAdd += e.v; break;
      case "cost": m.costMult *= 1 - e.v; break;
      case "bossTime": m.bossTimeAdd += e.v; break;
      case "offline": m.offlineSec += e.v; break;
      case "prestigeFloors": m.prestigeFloorAdd += e.v; break;
      case "dmgBelow": if (s.run.floor <= e.floor) m.dmgMult *= 1 + e.v; break;
      case "prestigeBelow": m.prestigeBelow.push([e.floor, 1 + e.v]); break;
    }
  }
  for (const aura of AURAS) {
    if (!s.costume.auras.includes(aura.set)) continue;
    const e = aura.effect;
    if (e.k === "perAura") m.dmgMult *= 1 + e.v * s.costume.auras.length;
    if (e.k === "perCostume") m.dmgMult *= 1 + e.v * owned;
    if (e.k === "per1000Floors") m.dmgMult *= 1 + e.v * Math.floor(s.bestFloor / 1000);
    if (e.k === "goldPerVip") m.goldMult *= 1 + e.v * vipLevel(s.vx.total);
  }
  let legends = 0;
  for (const l of LEGENDS) {
    const lv = s.costume.legend[l.part] ?? 0;
    if (lv <= 0) continue;
    legends += 1;
    const v = legendValue(l, lv);
    if (l.effect.k === "dmg") m.dmgMult *= 1 + v;
    if (l.effect.k === "prestige") m.prestigeTicketMult *= 1 + v;
    if (l.effect.k === "critDmg") m.critDmgMult *= 1 + v;
    if (l.effect.k === "gold") m.goldMult *= 1 + v;
    if (l.effect.k === "perConfirmed") m.dmgMult *= 1 + v * s.gear.confirmed;
  }
  if (legends >= LEGEND_SET[0].count) m.goldMult *= 6;
  if (legends >= LEGEND_SET[1].count) m.critDmgMult *= 4.5;
  if (legends >= LEGEND_SET[2].count) m.dmgMult *= 4.5;
  if (legends >= LEGEND_SET[3].count) m.prestigeTicketMult *= 1.5;
  if (legends >= LEGEND_SET[4].count) m.moveMult *= 1.1;
}

// 금배지 looks at the current floor, so within one settle it counts from the floor the settle starts
// on; crossing 3000 shows from the next settle.
function applyRelics(s: GameState, m: Mods): void {
  if (s.run.floor <= 3000) m.dmgMult *= 1 + 2.5 * relicLevel(s, "r_badge");
  m.goldMult *= 1 + 0.5 * relicLevel(s, "r_plaque");
  m.aspdMult *= 1 + 0.05 * relicLevel(s, "r_watch");
  m.dmgMult *= 1 + 0.4 * relicLevel(s, "r_cards");
}

function applyPets(s: GameState, m: Mods): void {
  const stage = awakenStage(s.bestFloor);
  const awake = stage >= 1;
  const boost = 1 + 0.1 * stage;
  for (const pet of petsUnlocked(s.bestFloor)) {
    const lv = petLevel(s, pet.id);
    switch (pet.id) {
      case "p_intern":
        m.extraHitPerSec += (1 / 2.5) * (1 + 0.1 * (lv - 1)) * boost * (awake ? 2 : 1) * (1 + 0.01 * relicLevel(s, "r_stamp"));
        break;
      case "p_jumim":
        m.sideJobPaySec = Math.max(5, 20 - 0.5 * (lv - 1));
        m.sideJobPayMult = boost * (awake ? 2 : 1);
        break;
      case "p_daeri": {
        const max = Math.min(0.6, 0.3 + 0.01 * (lv - 1));
        const min = awake ? 0.01 : 0;
        m.hpMult *= 1 - Math.min(0.9, ((min + max) / 2) * boost);
        break;
      }
      case "p_gongju": {
        const uptime = Math.min(5, 2 + 0.1 * (lv - 1)) / 5;
        const per = 1 + ((2 * boost * (1 + 0.3 * relicLevel(s, "r_pin")) - 1) * uptime) / 3;
        m.dmgMult *= per;
        m.aspdMult *= per;
        m.goldMult *= per;
        if (awake) m.prestigeFloorMult *= 1.1;
        break;
      }
      case "p_oh":
        m.ticketPerKill += (0.005 + 0.0005 * (lv - 1)) * boost * (awake ? 1.1 : 1);
        break;
      case "p_hong":
        m.drainPerSec += ((0.01 + 0.0005 * (lv - 1)) / 2) * boost * (awake ? 2 : 1);
        break;
      case "p_minam":
        m.hpMult *= 1 - Math.min(0.5, (0.04 + 0.002 * (lv - 1)) * boost);
        if (awake) m.dmgMult *= 2;
        break;
    }
  }
}
