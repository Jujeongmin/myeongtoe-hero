import type { GameState } from "../state";
import { CERTS } from "./certs";
import { awakenStage } from "./pets";

// Missions: 단계 미션 (one guided step at a time, shown on the battle screen —
// "4단계 미션: 스테이플러 구매"), 특수 임무 (one-off goals), and 7-day attendance. Checks read
// the save only; lifetime values (best floor, job changes, collections) wherever possible.
export interface Reward {
  gems?: number;
  tickets?: number;
  coupons?: number;
}

export interface MissionDef {
  id: string;
  text: string;
  done: (s: GameState) => boolean;
  reward: Reward;
}

const owned = (r: Record<string, unknown>) => Object.keys(r).length;
const jobsStarted = (s: GameState) => Object.values(s.sideJobs).filter((j) => j.level >= 1).length;

export const STEP_MISSIONS: readonly MissionDef[] = [
  { id: "s01", text: "부업 [편의점 알바] 시작", done: (s) => (s.sideJobs.j00?.level ?? 0) >= 1, reward: { gems: 20 } },
  { id: "s02", text: "업무 장비 [볼펜] Lv5", done: (s) => s.gear.tier > 0 || s.gear.level >= 5, reward: { gems: 20 } },
  { id: "s03", text: "업무 장비 [2. 형광펜] 구매", done: (s) => s.gear.tier >= 1, reward: { gems: 25 } },
  { id: "s04", text: "업무 장비 [3. 스테이플러] 구매", done: (s) => s.gear.tier >= 2, reward: { gems: 25 } },
  { id: "s05", text: "5층 도달", done: (s) => s.bestFloor >= 5, reward: { gems: 30 } },
  { id: "s06", text: "10층 팀장 처치", done: (s) => s.bestFloor >= 11, reward: { gems: 30, tickets: 2 } },
  { id: "s07", text: "자격증 취득", done: (s) => owned(s.certs) >= 1, reward: { gems: 35 } },
  { id: "s08", text: "지하주차장 입장", done: (s) => s.parking.best > 0, reward: { gems: 35, coupons: 30 } },
  { id: "s09", text: "30층 도달", done: (s) => s.bestFloor >= 30, reward: { gems: 40 } },
  { id: "s10", text: "부업 3개 시작", done: (s) => jobsStarted(s) >= 3, reward: { gems: 40 } },
  { id: "s11", text: "50층 도달", done: (s) => s.bestFloor >= 50, reward: { gems: 50 } },
  { id: "s12", text: "정장 1벌 구매", done: (s) => s.suits.length >= 1, reward: { gems: 50 } },
  { id: "s13", text: "100층 도달", done: (s) => s.bestFloor >= 100, reward: { gems: 60, tickets: 5 } },
  { id: "s14", text: "첫 이직", done: (s) => s.prestiges >= 1, reward: { gems: 60 } },
  { id: "s15", text: "동료 레벨업", done: (s) => Object.values(s.pets).some((lv) => lv >= 2), reward: { gems: 80 } },
  { id: "s16", text: "아파트 5평", done: (s) => s.apartment >= 5, reward: { gems: 80 } },
  { id: "s17", text: "200층 도달", done: (s) => s.bestFloor >= 200, reward: { gems: 100 } },
  { id: "s18", text: "자격증 10개", done: (s) => owned(s.certs) >= 10, reward: { gems: 120 } },
  { id: "s19", text: "300층 도달", done: (s) => s.bestFloor >= 300, reward: { gems: 150 } },
  { id: "s20", text: "이직 3회", done: (s) => s.prestiges >= 3, reward: { gems: 200 } },
];

export const SPECIAL_MISSIONS: readonly MissionDef[] = [
  { id: "f500", text: "최고 500층", done: (s) => s.bestFloor >= 500, reward: { gems: 100 } },
  { id: "f1000", text: "최고 1000층", done: (s) => s.bestFloor >= 1000, reward: { gems: 200 } },
  { id: "f2000", text: "최고 2000층", done: (s) => s.bestFloor >= 2000, reward: { gems: 400 } },
  { id: "f5000", text: "최고 5000층", done: (s) => s.bestFloor >= 5000, reward: { gems: 1000 } },
  { id: "p5", text: "이직 5회", done: (s) => s.prestiges >= 5, reward: { gems: 100 } },
  { id: "p10", text: "이직 10회", done: (s) => s.prestiges >= 10, reward: { gems: 200 } },
  { id: "p30", text: "이직 30회", done: (s) => s.prestiges >= 30, reward: { gems: 500 } },
  { id: "c20", text: "자격증 20개", done: (s) => owned(s.certs) >= 20, reward: { gems: 200 } },
  { id: "c40", text: `자격증 ${CERTS.length}개 전부`, done: (s) => owned(s.certs) >= CERTS.length, reward: { gems: 500 } },
  { id: "k100", text: "지하주차장 100m", done: (s) => s.parking.best >= 100, reward: { gems: 100 } },
  { id: "k500", text: "지하주차장 500m", done: (s) => s.parking.best >= 500, reward: { gems: 300 } },
  { id: "k1000", text: "지하주차장 1000m", done: (s) => s.parking.best >= 1000, reward: { gems: 600 } },
  { id: "a10", text: "아파트 10평", done: (s) => s.apartment >= 10, reward: { gems: 100 } },
  { id: "a30", text: "아파트 30평", done: (s) => s.apartment >= 30, reward: { gems: 300 } },
  { id: "w1", text: "동료 첫 각성", done: (s) => awakenStage(s.bestFloor) >= 1, reward: { gems: 300 } },
];

// Day 1..7 of the attendance cycle.
export const ATTENDANCE_REWARDS: readonly Reward[] = [
  { gems: 30 }, { coupons: 30 }, { tickets: 3 }, { gems: 50 }, { coupons: 50 }, { tickets: 5 }, { gems: 100 },
];

const SPECIAL_BY_ID = new Map(SPECIAL_MISSIONS.map((m) => [m.id, m]));

export function findSpecialMission(id: string): MissionDef | undefined {
  return SPECIAL_BY_ID.get(id);
}

export function rewardText(r: Reward): string {
  return [r.gems && `💎 ${r.gems}`, r.tickets && `📝 ${r.tickets}`, r.coupons && `🎟 ${r.coupons}`].filter(Boolean).join(" ");
}
