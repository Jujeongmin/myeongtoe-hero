// 스킬: unlocked by the best floor ever reached (kept across job changes) and always auto-cast, so
// settle counts each timed one as its average effect — 1 + (value − 1) × duration / cooldown — which
// keeps settling the same however the time is split. 연차 사용 is not 무적 as first designed: Park
// never takes damage, so it gives the boss fight extra seconds instead.
export type SkillKind = "aspd" | "bossTime" | "gold" | "damage";

export interface SkillDef {
  id: string;
  name: string;
  unlockFloor: number;
  kind: SkillKind;
  value: number;
  durationSec: number;
  cooldownSec: number;
}

export const SKILLS: readonly SkillDef[] = [
  { id: "s_kaltoe", name: "칼퇴", unlockFloor: 20, kind: "aspd", value: 2, durationSec: 10, cooldownSec: 60 },
  { id: "s_yeoncha", name: "연차 사용", unlockFloor: 50, kind: "bossTime", value: 10, durationSec: 0, cooldownSec: 0 },
  { id: "s_card", name: "법인카드", unlockFloor: 80, kind: "gold", value: 2, durationSec: 15, cooldownSec: 90 },
  { id: "s_hoesik", name: "회식", unlockFloor: 120, kind: "damage", value: 3, durationSec: 5, cooldownSec: 45 },
];

export function skillsUnlocked(bestFloor: number): SkillDef[] {
  return SKILLS.filter((s) => bestFloor >= s.unlockFloor);
}

// The average multiplier of a timed skill; 1 for one without a cooldown.
export function skillFactor(def: SkillDef): number {
  return def.cooldownSec > 0 ? 1 + ((def.value - 1) * def.durationSec) / def.cooldownSec : 1;
}
