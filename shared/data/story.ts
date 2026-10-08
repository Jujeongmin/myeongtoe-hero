// 스토리: the webtoon (docs/story/webtoon.md). Each episode opens on its own the first time the
// best floor reaches it, and can be read again from the menu. Panels are pictures in art/story;
// the lines are shown as text with them (narration, or who says it).

import { SUIT_ITEMS } from "./costumes";

export interface StoryLine {
  who?: string; // none: narration
  text: string;
  // Speech: the point over the speaker's head (panel pixels, 192×128) the bubble's tail points at;
  // the bubble grows up from it, to the right (to the left when `flip`).
  at?: [number, number];
  flip?: boolean;
  oneLine?: boolean; // narration kept on one line (the font shrinks to fit)
  w?: number; // the bubble's widest, in panel pixels (default 62% of the panel)
}

export interface StoryPanel {
  img: string; // art/story/<img>.png
  lines: readonly StoryLine[];
}

export interface Episode {
  id: string;
  floor: number; // opens when the best floor reaches it (0: from the start)
  allCostumes?: boolean; // also needs every costume (all 36 suit pieces) owned
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
          { text: "마왕그룹 본사 용사 채용 — 나이·경력 무관 / 성과급 즉시 지급", oneLine: true },
          { who: "박부장", text: "…나이 무관?", at: [172, 8], flip: true },
        ],
      },
      { img: "prologue_3", lines: [{ who: "박부장", text: "면접은 25년 만이네…", at: [92, 63] }] },
      {
        img: "prologue_4",
        lines: [
          { who: "서류 슬라임", text: "자기소개 해 보세요.", at: [32, 42], w: 96 },
          { who: "박부장", text: "25년간 결재, 회식, 야근… 무엇이든 버텼습니다!", at: [158, 47], flip: true, w: 64 },
        ],
      },
      {
        img: "prologue_5",
        lines: [
          { who: "결재 강시 총무 상무", text: "합격. 내일부터 1층에서 시작하세요.", at: [128, 23] },
          { who: "박부장", text: "…직급은요?", at: [22, 40] },
          { who: "결재 강시 총무 상무", text: "용사요. 계약직.", at: [176, 84], flip: true },
        ],
      },
      {
        img: "prologue_6",
        lines: [
          { who: "박부장", text: "…용사라니? 내가?", at: [92, 22], flip: true },
          { who: "인사팀", text: "회장실까지 올라오시면 정규직 전환입니다. 만 층이에요.", at: [150, 44], w: 84 },
        ],
      },
      {
        img: "prologue_7",
        lines: [
          { who: "아내", text: "여보, 회사는 별일 없지?", at: [118, 14] },
          { who: "박부장", text: "지금 회의 중이야! 바빠! 끊어!", at: [55, 46], w: 100 },
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
    floor: 70,
    title: "헤드헌터",
    panels: [
      { img: "hunter_1", lines: [{ who: "헤드헌터 냥", text: "박부장님, 연봉은 올려 드리죠. 대신 1층부터 다시 시작입니다.", at: [96, 36] }] },
      { img: "hunter_2", lines: [{ who: "박부장", text: "1층부터? 내가 여기까지 어떻게 왔는데!", at: [110, 10] }] },
      { img: "hunter_3", lines: [{ who: "헤드헌터 냥", text: "경력은 인정해 드립니다. 연봉협상할 때마다 자격증 응시권으로요. 자격증 붙으면 1층쯤은 금방이죠.", at: [112, 30] }] },
      { img: "hunter_4", lines: [{ who: "박부장", text: "…중장비 자격증도 있나?", at: [92, 18] }, { text: "70층부터 연봉협상할 수 있어요." }] },
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
      { img: "ep3_3", lines: [{ who: "최대리", text: "마왕그룹 임금체불 건으로 소송 중입니다. 몬스터 체력, 등장하자마자 30%까지 압류합니다.", at: [118, 46], w: 72 }] },
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
  {
    id: "ep12",
    floor: 6000,
    title: "12화 — 정규직",
    panels: [
      { img: "ep12_1", lines: [{ text: "6000층 인사팀. 거대한 결재 도장이 놓여 있다." }] },
      { img: "ep12_2", lines: [{ text: "3개월 전, 김인턴은 정규직 약속을 받았었다." }] },
      {
        img: "ep12_3",
        lines: [
          { who: "김인턴", text: "이 도장… 효력 있는 거예요?", at: [40, 31] },
          { who: "박부장", text: "몰라. 찍으면 된 거야.", at: [112, 26] },
        ],
      },
      { img: "ep12_4", lines: [{ text: "기념품 '대형 결재 도장'을 얻었다." }] },
    ],
  },
  {
    id: "ep13",
    floor: 6500,
    title: "13화 — 비서실장",
    panels: [
      { img: "ep13_1", lines: [{ who: "실장", text: "회장님께서 기다리고 계십니다. 다만… 저는 사표를 내고 왔습니다.", at: [107, 58] }] },
      { img: "ep13_2", lines: [{ who: "최대리", text: "회장 측 사람이잖아요.", at: [68, 44] }] },
      {
        img: "ep13_3",
        lines: [
          { who: "실장", text: "회장님 책상에 늘 있던 사진입니다. 회장님은 당신을 아십니다.", at: [120, 13], flip: true },
          { text: "꽃미남 실장이 동료가 되었다." },
        ],
      },
    ],
  },
  {
    id: "ep14",
    floor: 7000,
    title: "14화 — 들켰다",
    panels: [
      { img: "ep14_1", lines: [{ text: "7000층 보스와 대치 중. 휴대폰이 울린다. '여보'." }] },
      { img: "ep14_2", lines: [{ who: "아내", text: "…여보. 이게 뭐야?", at: [48, 14] }] },
      { img: "ep14_3", lines: [{ who: "박부장", text: "그게… 회사가… 명예롭게…", at: [56, 52] }] },
      {
        img: "ep14_4",
        lines: [
          { who: "아내", text: "집에서 얘기해.", at: [48, 20] },
          { text: "뚝. (다음 화에 계속)" },
        ],
      },
    ],
  },
  {
    id: "ep15",
    floor: 8000,
    title: "15화 — 택배",
    panels: [
      { img: "ep15_1", lines: [{ text: "8000층. 택배 상자 하나가 도착했다." }] },
      { img: "ep15_2", lines: [{ text: "파스 한 박스, 도시락, 손편지." }] },
      { img: "ep15_3", lines: [{ text: "당신 허리 안 좋잖아. 파스 붙이고 해. 대출은 내가 알아서 할게. 25년 동안 고생했어. 끝까지 올라가 봐. 대신 다치면 죽어. — 여보가" }] },
      {
        img: "ep15_4",
        lines: [
          { who: "오사원", text: "저 퇴사 안 할래요…", at: [134, 38], flip: true },
          { text: "기념품 '파스'를 얻었다." },
        ],
      },
    ],
  },
  {
    id: "ep16",
    floor: 9000,
    title: "16화 — 에어컨 고장",
    panels: [
      { img: "ep16_1", lines: [{ who: "홍과장", text: "회장실 시원하라고 아랫사람들은 쪄 죽는구만!", at: [115, 52] }] },
      { img: "ep16_2", lines: [{ text: "실외기 보스가 결재판만 한 부채를 떨어뜨렸다. '회장님 하사품'." }] },
      {
        img: "ep16_3",
        lines: [
          { who: "박부장", text: "위에서 내려오는 건 명단만 있는 줄 알았는데.", at: [25, 51] },
          { text: "기념품 '부채'를 얻었다." },
        ],
      },
    ],
  },
  {
    id: "final",
    floor: 10000,
    title: "최종화 — 회장실",
    panels: [
      { img: "final_1", lines: [{ who: "박부장", text: "회장님. 하나만 묻겠습니다. 왜 저였습니까.", at: [33, 40] }] },
      {
        img: "final_2",
        lines: [
          { who: "박부장", text: "왕… 대리님?", at: [28, 48] },
          { who: "회장", text: "오랜만이다, 박 신입.", at: [122, 28] },
        ],
      },
      { img: "final_3", lines: [{ who: "회장", text: "꼭대기에 와 보니 알겠더라. 사람을 자르는 건 쉽고, 끝까지 올라오는 사람을 찾는 건 어렵다.", at: [60, 12] }] },
      { img: "final_4", lines: [{ who: "회장", text: "그 공고, 너한테만 보였다. 25년 동안 지각 한 번 안 한 사람한테만.", at: [103, 23] }] },
      { img: "final_5", lines: [{ who: "회장", text: "이겨라. 그럼 이 의자는 네 거다.", at: [160, 31], flip: true }] },
      { img: "final_6", lines: [{ who: "박부장", text: "회장님, 그럼 첫 결재 하나만 하겠습니다.", at: [72, 38] }] },
      {
        img: "final_7",
        lines: [
          { who: "박부장", text: "6시에 퇴근하고 싶습니다.", at: [90, 25] },
          { text: "마왕그룹 명예퇴직 제도 폐지. 전 직원 6시 칼퇴." },
        ],
      },
      {
        img: "final_8",
        lines: [
          { who: "아내", text: "요즘 회사 생활은 어때?", at: [148, 37], flip: true },
          { who: "박부장", text: "…나 회장 됐어.", at: [33, 38] },
          { text: "마왕그룹 회장 박부장." },
          { text: "END — 그리고 탑은 계속된다" },
        ],
      },
    ],
  },
  {
    // After the finale: opens one floor past the 회장실.
    id: "cookie",
    floor: 10001,
    title: "쿠키 — 10000층 이후",
    panels: [
      { img: "cookie_1", lines: [{ who: "실장", text: "회장님! 뉴욕 지사에서 용사가 쳐들어왔습니다! 52세랍니다!", at: [36, 34] }] },
      { img: "cookie_2", lines: [{ who: "박부장", text: "…1층에서 기다리라고 해. 내가 내려간다.", at: [89, 30] }] },
    ],
  },
  {
    id: "wardrobe",
    floor: 0,
    allCostumes: true,
    title: "특별편 — 옷장",
    panels: [
      { img: "wardrobe_1", lines: [{ who: "박부장", text: "부장 시절엔 양복 세 벌로 25년 버텼는데.", at: [110, 40] }] },
      { img: "wardrobe_2", lines: [{ who: "아내", text: "여보. 이 옷들 살 돈 다 어디서 났어?", at: [140, 35], flip: true }] },
      { img: "wardrobe_3", lines: [{ who: "박부장", text: "나 얼른 출근해야 해!", at: [128, 18], flip: true }] },
    ],
  },
];

export function findEpisode(id: string): Episode | undefined {
  return EPISODES.find((e) => e.id === id);
}

// Whether an episode can be read: its floor reached, and for the 옷장 special every costume owned.
export function episodeOpen(ep: Episode, s: { bestFloor: number; suits: readonly string[] }): boolean {
  return s.bestFloor >= ep.floor && (!ep.allCostumes || SUIT_ITEMS.every((i) => s.suits.includes(i.id)));
}
