// What Park says over his head on the battle screen: a random line now and then, and a parting
// line when a boss falls (by who it was: 중간보스, 팀장 every 10th floor, 임원 every 100th).

export const PARK_QUIPS: readonly string[] = [
  "아이고 허리야…",
  "이 나이에 내가…",
  "집사람한텐 비밀이다",
  "대출 이자가 몇 프로였더라",
  "애들 학원비는 벌어야지",
  "무릎이 아프네… 비가 오려나…",
  "점심은 김치찌개다",
  "이것도 경력에 써도 되나",
  "라떼는 말이야…",
  "퇴직금 아직 안 들어왔나",
  "파스 어디 뒀더라",
  "돋보기 어디 갔지",
  "계단 말고 엘리베이터 없나",
  "용사도 4대 보험 되나",
  "믹스커피 한 잔만…",
  "늙크크가 뭐지… 딸래미가 나보고 늙크크라던데…",
  // 아재개그
  "딸기가 회사에서 잘리면? 딸기시럽!",
  "인천 앞바다의 반대말은? 인천 엄마다!",
  "바나나가 웃으면? 바나나킥!",
  "세상에서 제일 가난한 왕은? 최저임금!",
  "소가 웃으면? 우하하!",
  "오리가 얼면? 언덕!",
];

export type BossKind = "mid" | "leader" | "exec";

export function bossKind(floor: number): BossKind {
  return floor % 100 === 0 ? "exec" : floor % 10 === 0 ? "leader" : "mid";
}

export const BOSS_LINES: Record<BossKind, readonly string[]> = {
  mid: [
    "결재 반려!",
    "보고는 간단히 합시다",
    "이건 내 전결이다",
    "다음 층 회의실로!",
  ],
  leader: [
    "팀장님, 그동안 감사했습니다(퍽)",
    "제 연차 결재는 제가 하겠습니다",
    "주말 출근은 이제 없습니다",
    "인사고과 잘 부탁드립니다(퍽)",
  ],
  exec: [
    "상무님, 명퇴 서류 돌려드립니다",
    "25년 근속 기념 선물입니다(퍽)",
    "임원 회의는 이걸로 끝입니다",
    "제 퇴직금, 이자 붙여 받아갑니다",
  ],
};

// What the office-parody bosses and the CEO say: on arriving, and as they fall (by monster id).
// With several lines, each visit (counted by floor) says the next one.
export const BOSS_SAYS: Readonly<Record<string, { appear: readonly string[]; fall: readonly string[] }>> = {
  lee_ceo: {
    appear: [
      "영광인 줄 알아!",
      "대박나야지!",
      "부자되자!",
      "우리 다 같이 부자되자!",
      "올해는 무조건 대박이다!",
      "우리 회사는 가족 같은 회사입니다",
      "꿈은 크게! 연봉은 겸손하게!",
      "이 시계 한정판인 거 알지?",
      "내가 왕년에는 말이야~",
    ],
    fall: [
      "이 시계가 얼마짜린데…",
      "내 클러치… 스크래치 나면 안 되는데…",
      "법카로 다시 사면 되지 뭐…",
      "다음 분기엔… 대박날 거야…",
    ],
  },
  card_audit_bujang: { appear: ["이 법카 내역, 컨펌 받으셨어요?"], fall: ["…리스펙트는 해 드리죠"] },
  third_year_jooim: { appear: ["호흡과 반복이 중요합니다"], fall: ["그 호흡이 아닌데…"] },
  ppeongtwigi_gwajang: { appear: ["…(바삭)"], fall: ["제 뻥튀기는 건드리지 마세요"] },
  mz_sawon: { appear: ["6시 정각인데요?"], fall: ["저 칼퇴할게요"] },
  love_daeri: { appear: ["저 사랑꾼 아니라니까요"], fall: ["그 프레임… 진짜 싫은데…"] },
};

// The line for a boss's visit to `floor`, the next one each time it comes back: 이대표 comes every
// 100 floors from floor 50, so his first visit says the first line.
export function bossLine(lines: readonly string[], floor: number): string {
  return lines[Math.floor(floor / 100) % lines.length];
}

// A line from a list, picked by a number in [0, 1).
export function pickLine(lines: readonly string[], r: number): string {
  return lines[Math.min(lines.length - 1, Math.floor(r * lines.length))];
}
