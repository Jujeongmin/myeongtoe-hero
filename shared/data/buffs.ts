import type { GameState } from "../state";

// Timed buffs, from the gem shop, ads and packs. Each is stored as the server time (ms) it ends;
// settle splits its time at those ends, so a buff counts exactly while it lasts.
export type BuffKind = "atk" | "gold" | "move";
export const BUFF_KINDS: readonly BuffKind[] = ["atk", "gold", "move"];

export const BUFFS: Record<BuffKind, { name: string; text: string; mult: number }> = {
  atk: { name: "야근 모드", text: "공격력 6배", mult: 6 },
  gold: { name: "성과급", text: "처치 골드 3배", mult: 3 },
  move: { name: "칼퇴 걸음", text: "이동 속도 2배", mult: 2 },
};

export function buffActive(s: Pick<GameState, "buffs" | "lastTick">, kind: BuffKind): boolean {
  return s.buffs[kind] > s.lastTick;
}

// A buff bought or earned while one is running adds on after it.
export function extendBuff(s: GameState, kind: BuffKind, ms: number): void {
  s.buffs = { ...s.buffs, [kind]: Math.max(s.buffs[kind], s.lastTick) + ms };
}
