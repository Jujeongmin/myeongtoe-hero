const ERRORS: Record<string, string> = {
  not_enough_gold: "골드가 부족해요",
  locked: "아직 잠겨 있어요",
  max: "더 좋은 장비가 없어요",
  running: "이미 일하는 중이에요",
  not_owned: "아직 시작하지 않은 부업이에요",
  unknown: "알 수 없는 항목이에요",
};

export function errorText(code: string): string {
  return ERRORS[code] ?? "잠시 후 다시 시도해 주세요";
}
