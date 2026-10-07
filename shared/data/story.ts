// 스토리: the webtoon (docs/story/webtoon.md). Each episode opens on its own the first time the
// best floor reaches it, and can be read again from the menu. Panels are pictures in art/story;
// the lines are shown as text with them (narration, or who says it).

export interface StoryLine {
  who?: string; // none: narration
  text: string;
}

export interface StoryPanel {
  img: string; // art/story/<img>.png
  lines: readonly StoryLine[];
}

export interface Episode {
  id: string;
  floor: number; // opens when the best floor reaches it (0: from the start)
  title: string;
  panels: readonly StoryPanel[];
}

export const EPISODES: readonly Episode[] = [
  {
    id: "prologue",
    floor: 0,
    title: "프롤로그 — 명예로운 퇴직",
    panels: [
      { img: "prologue_1", lines: [{ text: "박부장, 52세. 대왕상사 25년 차. 지각 0회." }] },
      { img: "prologue_2", lines: [{ who: "박부장", text: "명…예? 명예로운 거면 받아야지! 허허" }] },
      { img: "prologue_3", lines: [{ who: "박부장", text: "…명예라며." }] },
      {
        img: "prologue_4",
        lines: [
          { who: "아내", text: "여보, 이번 달 대출 이자랑 민지 학원비…" },
          { who: "박부장", text: "어! 회사지! 지금 회의 중이야! 바빠!" },
        ],
      },
      {
        img: "prologue_5",
        lines: [{ text: "마왕그룹 본사 용사 채용 — 나이·경력 무관 / 몬스터 처치 시 성과급 즉시 지급 / 출퇴근 자유" }],
      },
      { img: "prologue_6", lines: [{ who: "박부장", text: "…너였구나." }] },
      {
        img: "prologue_7",
        lines: [
          { who: "박부장", text: "25년 결재로 단련된 손목이다. 회장실이 몇 층이라고?" },
          { who: "경비", text: "만 층입니다. 엘리베이터는 점검 중이고요. 25년째." },
          { text: "명퇴용사 박부장" },
        ],
      },
    ],
  },
  {
    id: "ep1",
    floor: 100,
    title: "1화 — 상무님은 부재중",
    panels: [
      { img: "ep1_1", lines: [{ who: "???", text: "명퇴 대상자여… 감히 여기까지…" }] },
      { img: "ep1_2", lines: [{ who: "박부장", text: "사, 상무님! 저는 그냥 퇴직금 얘기를…" }] },
      { img: "ep1_3", lines: [{ text: "자세히 보니 상무 등신대였다. 목에 걸린 팻말: '골프 중 — 급한 건 비서실로'. 목소리는 휴대폰 자동응답." }] },
      { img: "ep1_4", lines: [{ who: "박부장", text: "결재 반려! …25년 동안 이런 상사 한둘이 아니었다." }] },
      { img: "ep1_5", lines: [{ who: "김인턴", text: "사람이다… 3개월 만에 사람이다… 복사기 고치다가 갇혔어요." }] },
      {
        img: "ep1_6",
        lines: [
          { who: "김인턴", text: "부장님이시죠? 저 정규직 전환 약속 받았는데요!" },
          { text: "(난 명퇴했는데…)" },
          { who: "박부장", text: "…열심히 하면." },
          { text: "김인턴이 동료가 되었다." },
        ],
      },
    ],
  },
  {
    id: "hunter",
    floor: 100,
    title: "헤드헌터",
    panels: [
      { img: "hunter_1", lines: [{ who: "헤드헌터 냥", text: "박부장님, 더 좋은 조건으로 1층부터 다시 시작하시죠." }] },
      { img: "hunter_2", lines: [{ who: "박부장", text: "1층부터? 내가 여기까지 어떻게 왔는데!" }] },
      { img: "hunter_3", lines: [{ who: "헤드헌터 냥", text: "경력은 인정해 드립니다. 이직할 때마다 자격증 응시권으로요. 자격증 붙으면 1층쯤은 금방이죠." }] },
      { img: "hunter_4", lines: [{ who: "박부장", text: "…중장비 자격증도 있나?" }, { text: "100층부터 이직할 수 있어요." }] },
    ],
  },
];

export function findEpisode(id: string): Episode | undefined {
  return EPISODES.find((e) => e.id === id);
}
