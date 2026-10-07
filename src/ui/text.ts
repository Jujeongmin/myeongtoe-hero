import { t } from "../i18n";

const ERRORS: Record<string, string> = {
  not_enough_gold: "골드가 부족해요",
  locked: "아직 잠겨 있어요",
  max: "이미 최대예요",
  not_owned: "아직 가지고 있지 않아요",
  unknown: "알 수 없는 항목이에요",
  not_enough_tickets: "응시권이 부족해요",
  not_enough_gems: "보석이 부족해요",
  not_enough_coupons: "상품권이 부족해요",
  owned: "이미 가지고 있어요",
  no_pass: "주차권이 없어요",
  not_done: "아직 조건을 채우지 못했어요",
  claimed: "이미 받았어요",
  cooldown: "아직 다시 볼 수 없어요",
  bad_nickname: "닉네임은 한글·영문·숫자 2~8자예요",
};

export function errorText(code: string): string {
  const text = ERRORS[code];
  return text ? t(text) : t("잠시 후 다시 시도해 주세요");
}
