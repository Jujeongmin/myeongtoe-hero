import { certBonuses } from "./data/certs";
import { awakenStage, petsUnlocked } from "./data/pets";
import type { GameState } from "./state";

// Every permanent effect in one place: certificates, pets (and later relics, the apartment, suits
// and office gear). heroPower, settle and the offline cap read only this. Random effects (최대리's
// 0~30%, 공주임's buff, 오사원's drops) count as their expected values.
export interface Mods {
  dmgMult: number;
  aspdMult: number;
  critDmgAdd: number;
  bossMult: number;
  goldMult: number;
  sideJobMult: number;
  prestigeBonus: number;
  prestigeFloorMult: number;
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

export function mods(s: GameState): Mods {
  const c = certBonuses(s.certs);
  const m: Mods = {
    dmgMult: 1 + c.atk,
    aspdMult: 1 + c.aspd,
    critDmgAdd: c.critDmg,
    bossMult: 1 + c.boss,
    goldMult: 1 + c.gold,
    sideJobMult: 1 + c.sideJob,
    prestigeBonus: c.prestige,
    prestigeFloorMult: 1,
    offlineSec: c.offlineSec,
    hpMult: 1,
    drainPerSec: 0,
    extraHitPerSec: 0,
    sideJobPaySec: 0,
    sideJobPayMult: 1,
    ticketPerKill: 0,
  };
  applyPets(s, m);
  return m;
}

function applyPets(s: GameState, m: Mods): void {
  const stage = awakenStage(s.bestFloor);
  const awake = stage >= 1;
  const boost = 1 + 0.1 * stage;
  for (const pet of petsUnlocked(s.bestFloor)) {
    const lv = petLevel(s, pet.id);
    switch (pet.id) {
      case "p_intern":
        m.extraHitPerSec += (1 / 2.5) * (1 + 0.1 * (lv - 1)) * boost * (awake ? 2 : 1);
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
        const per = 1 + ((2 * boost - 1) * uptime) / 3;
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
