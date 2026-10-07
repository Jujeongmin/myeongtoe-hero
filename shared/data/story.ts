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
];

export function findEpisode(id: string): Episode | undefined {
  return EPISODES.find((e) => e.id === id);
}
