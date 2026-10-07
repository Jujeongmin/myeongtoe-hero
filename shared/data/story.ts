// 스토리: the webtoon (docs/story/webtoon.md). Each episode opens on its own the first time the
// best floor reaches it, and can be read again from the menu. Panels are pictures in art/story;
// the lines are shown as text with them (narration, or who says it).

export interface StoryLine {
  who?: string; // none: narration
  text: string;
  // Speech: the point over the speaker's head (panel pixels, 192×128) the bubble's tail points at;
  // the bubble grows up from it, to the right (to the left when `flip`).
  at?: [number, number];
  flip?: boolean;
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
    // v2: the job-application prologue (the first one, about the 명퇴 envelope, was replaced).
    id: "prologue2",
    floor: 0,
    title: "프롤로그 — 나이 무관",
    panels: [
      { img: "prologue_1", lines: [{ text: "박부장, 52세. 25년 다닌 회사에서 명퇴. 이력서 100통, 서류 탈락 100번." }] },
      {
        img: "prologue_2",
        lines: [
          { text: "마왕그룹 본사 용사 채용 — 나이·경력 무관 / 성과급 즉시 지급 / 출퇴근 자유" },
          { who: "박부장", text: "…나이 무관?", at: [172, 8], flip: true },
        ],
      },
      { img: "prologue_3", lines: [{ who: "박부장", text: "면접은 25년 만이네…", at: [92, 63] }] },
      {
        img: "prologue_4",
        lines: [
          { who: "서류 슬라임", text: "자기소개 해 보세요.", at: [32, 42] },
          { who: "박부장", text: "25년간 결재, 회식, 야근… 무엇이든 버텼습니다!", at: [155, 47], flip: true },
        ],
      },
      {
        img: "prologue_5",
        lines: [
          { who: "결재 강시 총무 상무", text: "합격. 내일부터 1층에서 시작하세요.", at: [128, 23] },
          { who: "박부장", text: "…직급은요?", at: [22, 40] },
          { who: "결재 강시 총무 상무", text: "용사요. 계약직.", at: [150, 60] },
        ],
      },
      {
        img: "prologue_6",
        lines: [
          { who: "박부장", text: "…용사라니? 내가?", at: [72, 22] },
          { who: "인사팀", text: "회장실까지 올라오시면 정규직 전환입니다. 만 층이에요.", at: [150, 60] },
        ],
      },
      {
        img: "prologue_7",
        lines: [
          { who: "아내", text: "여보, 회사는 별일 없지?", at: [70, 77], flip: true },
          { who: "박부장", text: "지금 회의 중이야! 바빠! 끊어!", at: [53, 40] },
          { text: "명퇴용사 박부장" },
        ],
      },
    ],
  },
  {
    id: "ep0",
    floor: 3,
    title: "0.5화 — 월급만큼만",
    panels: [
      { img: "ep0_1", lines: [{ who: "박부장", text: "덤벼라!", at: [36, 46] }] },
      {
        img: "ep0_2",
        lines: [
          { who: "박부장", text: "…안 덤벼?", at: [24, 40] },
          { who: "서류 슬라임", text: "제 업무에 '전투'는 없는데요.", at: [120, 34] },
        ],
      },
      { img: "ep0_3", lines: [{ who: "서류 슬라임", text: "아야. …6시까지만 버티면 돼.", at: [112, 28], flip: true }] },
      {
        img: "ep0_4",
        lines: [
          { who: "박부장", text: "…라떼는 저러면 잘렸어.", at: [84, 44] },
        ],
      },
    ],
  },
  {
    id: "ep1",
    floor: 100,
    title: "1화 — 상무님은 부재중",
    panels: [
      { img: "ep1_1", lines: [{ who: "???", text: "명퇴 대상자여… 감히 여기까지…", at: [92, 12] }] },
      { img: "ep1_2", lines: [{ who: "박부장", text: "사, 상무님! 저는 그냥 퇴직금 얘기를…", at: [44, 38] }] },
      { img: "ep1_3", lines: [{ text: "자세히 보니 상무 등신대였다. 목에 걸린 팻말: '골프 중 — 급한 건 비서실로'. 목소리는 휴대폰 자동응답." }] },
      { img: "ep1_4", lines: [{ who: "박부장", text: "결재 반려! …25년 동안 이런 상사 한둘이 아니었다.", at: [56, 32] }] },
      { img: "ep1_5", lines: [{ who: "김인턴", text: "사람이다… 3개월 만에 사람이다… 복사기 고치다가 갇혔어요.", at: [86, 44], flip: true }] },
      {
        img: "ep1_6",
        lines: [
          { who: "김인턴", text: "부장님이시죠? 저 정규직 전환 약속 받았는데요!", at: [74, 24], flip: true },
          { text: "(난 명퇴했는데…)" },
          { who: "박부장", text: "…열심히 하면.", at: [144, 28], flip: true },
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
      { img: "hunter_1", lines: [{ who: "헤드헌터 냥", text: "박부장님, 더 좋은 조건으로 1층부터 다시 시작하시죠.", at: [96, 36] }] },
      { img: "hunter_2", lines: [{ who: "박부장", text: "1층부터? 내가 여기까지 어떻게 왔는데!", at: [110, 10] }] },
      { img: "hunter_3", lines: [{ who: "헤드헌터 냥", text: "경력은 인정해 드립니다. 이직할 때마다 자격증 응시권으로요. 자격증 붙으면 1층쯤은 금방이죠.", at: [112, 30] }] },
      { img: "hunter_4", lines: [{ who: "박부장", text: "…중장비 자격증도 있나?", at: [92, 18] }, { text: "100층부터 이직할 수 있어요." }] },
    ],
  },
  {
    id: "ep2",
    floor: 300,
    title: "2화 — 네트워크 마케팅 아닙니다",
    panels: [
      { img: "ep2_1", lines: [{ who: "박부장", text: "스테이플러가… 이 가격이라고?", at: [64, 56] }] },
      {
        img: "ep2_2",
        lines: [
          { who: "박주임", text: "형님! 부업 하나 하시죠. 다단계 아니고요, 네트워크 마케팅…", at: [96, 42] },
          { who: "박부장", text: "꺼져.", at: [48, 44], flip: true },
        ],
      },
      { img: "ep2_3", lines: [{ who: "박주임", text: "형님 부업 수입, 제가 20초마다 정산해 드립니다. 수수료는 안 받아요. 형님 인맥만 빌려주세요.", at: [96, 22] }] },
      {
        img: "ep2_4",
        lines: [
          { who: "김인턴", text: "같은 박씨라서 봐주시는 거예요?", at: [146, 50] },
          { who: "박부장·박주임", text: "남이야.", at: [64, 40] },
          { text: "박주임이 동료가 되었다." },
        ],
      },
    ],
  },
  {
    id: "ep3",
    floor: 600,
    title: "3화 — 내용증명",
    panels: [
      { img: "ep3_1", lines: [{ who: "법무 상무 리치", text: "요즘 것들은 끈기가 없어. 라떼는…", at: [92, 10] }] },
      { img: "ep3_2", lines: [{ text: "날아온 서류 한 장. '내용증명'." }] },
      { img: "ep3_3", lines: [{ who: "최대리", text: "마왕그룹 임금체불 건으로 소송 중입니다. 몬스터 체력, 등장하자마자 30%까지 압류합니다.", at: [96, 14] }] },
      {
        img: "ep3_4",
        lines: [
          { who: "박부장", text: "멋있다… 우리 회사엔 저런 사람 없었는데.", at: [46, 50], flip: true },
          { who: "최대리", text: "있었는데 다 명퇴하셨겠죠.", at: [92, 54] },
          { text: "최대리가 동료가 되었다." },
        ],
      },
    ],
  },
  {
    id: "ep4",
    floor: 900,
    title: "4화 — 구독과 좋아요",
    panels: [
      { img: "ep4_1", lines: [{ who: "공주임", text: "안녕하세요 여러분~ 공주임 채널입니다!", at: [100, 18] }] },
      { img: "ep4_2", lines: [{ who: "공주임", text: "52세 부장님이 용사로 이직! 이거 떡상각인데요?", at: [96, 34] }] },
      { img: "ep4_3", lines: [{ who: "박부장", text: "찍지 마! 와이프가 보면 어떡해!", at: [56, 32] }] },
      {
        img: "ep4_4",
        lines: [
          { text: "댓글: 부장님 힘내세요 / 우리 아빠 같아요ㅠ" },
          { who: "공주임", text: "보셨죠? 구독자 응원이 곧 버프예요.", at: [40, 14] },
          { who: "박부장", text: "…얼굴은 모자이크해 줘.", at: [96, 40] },
          { text: "공주임이 동료가 되었다." },
        ],
      },
    ],
  },
  {
    id: "ep5",
    floor: 1000,
    title: "5화 — 김팀장",
    panels: [
      { img: "ep5_1", lines: [{ text: "1000층. 결재 서류가 산더미처럼 쌓인 보스방." }] },
      {
        img: "ep5_2",
        lines: [
          { who: "박부장", text: "팀장님…? 여기서 뭐 하세요?", at: [44, 62], flip: true },
          { who: "김팀장", text: "나도 작년에 명퇴했다. 여기 계약직 보스야. 4대 보험 된다.", at: [124, 16] },
        ],
      },
      { img: "ep5_3", lines: [{ who: "김팀장", text: "네가 책상에 두고 간 거다. 근속 25년 금배지.", at: [118, 42] }] },
      {
        img: "ep5_4",
        lines: [
          { who: "박부장", text: "팀장님. 명퇴 명단에 제 이름, 누가 썼습니까.", at: [60, 26], flip: true },
          { who: "김팀장", text: "나도 몰라. 명단은 늘 '위에서' 내려왔다. 맨 위에서.", at: [178, 44], flip: true },
        ],
      },
      {
        img: "ep5_5",
        lines: [
          { who: "김팀장", text: "회장실은 만 층이다. 가라, 박부장.", at: [100, 76] },
          { text: "기념품 '근속 25년 금배지'를 얻었다." },
        ],
      },
    ],
  },
  {
    id: "ep6",
    floor: 1100,
    title: "6화 — 3일 차 신입",
    panels: [
      { img: "ep6_1", lines: [{ who: "오사원", text: "입사 3일 차인데요, 이거 퇴사각이에요.", at: [95, 48] }] },
      { img: "ep6_2", lines: [{ who: "박부장", text: "사직서는 두괄식으로. 사유는 한 줄로.", at: [47, 32] }] },
      {
        img: "ep6_3",
        lines: [
          { who: "오사원", text: "부장님 팀은 6시 칼퇴예요?", at: [129, 59] },
          { who: "박부장", text: "…용사는 출퇴근 자유다.", at: [54, 63] },
        ],
      },
      {
        img: "ep6_4",
        lines: [
          { who: "오사원", text: "그럼 일단 다녀볼게요. 저 자격증 모으는 게 취미라서 응시권 떨어지면 드릴게요.", at: [112, 27] },
          { text: "막내 오사원이 동료가 되었다." },
        ],
      },
    ],
  },
  {
    id: "ep7",
    floor: 2000,
    title: "7화 — 올해의 영업왕",
    panels: [
      { img: "ep7_1", lines: [{ text: "2000층. 영업팀 보스를 쓰러뜨리자, 보스방 벽에 액자들이 보였다." }] },
      { img: "ep7_2", lines: [{ text: "'2009 올해의 영업왕'. 박부장 자신의 공로패였다." }, { who: "박부장", text: "이게 왜 여기 있어?", at: [29, 48] }] },
      {
        img: "ep7_3",
        lines: [
          { who: "박주임", text: "형님… 영업왕이셨어요? 그럼 제 네트워크…", at: [130, 33] },
          { who: "박부장", text: "안 해.", at: [37, 36] },
        ],
      },
      {
        img: "ep7_4",
        lines: [
          { text: "(내 물건이 왜 자꾸 이 빌딩에…)" },
          { text: "기념품 '공로패'를 얻었다." },
        ],
      },
    ],
  },
  {
    id: "ep8",
    floor: 3000,
    title: "8화 — 늦지 마",
    panels: [
      { img: "ep8_1", lines: [{ text: "3000층 재무팀 금고. 그 안에 낡은 손목시계가 있었다." }] },
      { img: "ep8_2", lines: [{ text: "시계 뒷면의 각인: '늦지 마. — 여보가'" }] },
      { img: "ep8_3", lines: [{ who: "아내", text: "당신은 덤벙대니까. 늦지 마.", at: [110, 44] }] },
      {
        img: "ep8_4",
        lines: [
          { who: "박부장", text: "…25년 동안 한 번도 안 늦었어.", at: [72, 42] },
          { text: "기념품 '명품 손목시계'를 얻었다." },
        ],
      },
    ],
  },
  {
    id: "ep9",
    floor: 4000,
    title: "9화 — 박부장들",
    panels: [
      { img: "ep9_1", lines: [{ text: "4000층. 몬스터에 둘러싸인 박부장의 주머니에서 명함 뭉치가 떨어졌다." }] },
      { img: "ep9_2", lines: [{ who: "박대리", text: "선배님, 아니 저님, 도와드리겠습니다!", at: [60, 37] }] },
      { img: "ep9_3", lines: [{ who: "박부장", text: "내가 나를 부려먹는 날이 오다니.", at: [78, 45] }] },
      {
        img: "ep9_4",
        lines: [
          { who: "박부장", text: "…저 때로 돌아가고 싶다.", at: [57, 37] },
          { text: "기념품 '명함 뭉치'를 얻었다. 분신이 함께 싸운다." },
        ],
      },
    ],
  },
  {
    id: "ep10",
    floor: 4500,
    title: "10화 — 동기",
    panels: [
      { img: "ep10_1", lines: [{ who: "홍과장", text: "박! 넌 아직도 넥타이를 그렇게 매냐!", at: [108, 39] }] },
      { img: "ep10_2", lines: [{ who: "홍과장", text: "우리 둘 중 하나는 꼭 임원 달자.", at: [124, 31] }] },
      { img: "ep10_3", lines: [{ who: "홍과장", text: "작년에 명퇴 명단에 우리 둘이 올라왔어. 내가 먼저 나가면 넌 남을 줄 알았지.", at: [112, 46] }] },
      {
        img: "ep10_4",
        lines: [
          { who: "박부장", text: "같이 올라가자. 잔소리는 몬스터한테 해.", at: [67, 42], flip: true },
          { who: "홍과장", text: "그건 자신 있지.", at: [106, 45] },
          { text: "홍과장이 동료가 되었다." },
        ],
      },
    ],
  },
  {
    id: "ep11",
    floor: 5000,
    title: "11화 — 구독자 100만",
    panels: [
      { img: "ep11_1", lines: [{ text: "공주임 채널, 구독자 100만 돌파!" }] },
      { img: "ep11_2", lines: [{ who: "홍보팀", text: "부장님 영상 덕분에 저희 채용 지원자가 300% 늘었습니다. 감사패 대신…", at: [118, 40] }] },
      {
        img: "ep11_3",
        lines: [
          { who: "공주임", text: "부장님, 이제 진짜 셀럽이에요!", at: [118, 35] },
          { who: "박부장", text: "모자이크는 했지?", at: [45, 34] },
          { who: "공주임", text: "…대머리는 모자이크가 안 돼요.", at: [150, 62] },
          { text: "기념품 '부장님 넥타이핀'을 얻었다." },
        ],
      },
    ],
  },
];

export function findEpisode(id: string): Episode | undefined {
  return EPISODES.find((e) => e.id === id);
}
