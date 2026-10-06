import { certEffects } from "./data/certs";
import { apartmentDamage, findSuitItem, suitSetWorn } from "./data/home";
import { awakenStage, petsUnlocked } from "./data/pets";
import { relicsUnlocked } from "./data/relics";
import type { GameState } from "./state";

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
}

export function petLevel(s: GameState, id: string): number {
  return s.pets[id] ?? 1;
}

// A relic's level, 0 while it has not arrived yet.
export function relicLevel(s: GameState, id: string): number {
  return relicsUnlocked(s.bestFloor).some((r) => r.id === id) ? (s.relics[id] ?? 1) : 0;
}

export function mods(s: GameState): Mods {
  const c = certEffects(s.certs, 1 + 0.2 * relicLevel(s, "r_pas"));
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
  };
  applyRelics(s, m);
  applyHome(s, m);
  applyPets(s, m);
  return m;
}

function applyHome(s: GameState, m: Mods): void {
  m.dmgMult *= apartmentDamage(s.apartment + 2 * relicLevel(s, "r_fan"));

  // Worn suits only (what Park is seen wearing is what counts): +5% × set number per part.
  let parts = 0;
  for (const id of Object.values(s.wear)) parts += findSuitItem(id)?.set ?? 0;
  m.dmgMult *= 1 + 0.05 * parts;
  if (suitSetWorn(s.wear, 1)) m.goldMult *= 1.2;
  if (suitSetWorn(s.wear, 2)) m.aspdMult *= 1.1;
  if (suitSetWorn(s.wear, 3)) m.bossMult *= 1.3;
  if (suitSetWorn(s.wear, 4)) m.sideJobMult *= 1.5;
  if (suitSetWorn(s.wear, 5)) m.dmgMult *= 1.5;
  if (suitSetWorn(s.wear, 6)) m.goldMult *= 2;

  m.dmgMult *= 1 + 0.15 * (s.office.keyboard - 1);
  m.critDmgAdd += 0.05 * (s.office.mouse - 1);
  m.bossMult *= 1 + 0.1 * (s.office.chair - 1);
  m.goldMult *= 1 + 0.1 * (s.office.monitor - 1);
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
