import { t } from "../i18n";
import type { Connection } from "../net/connection";

export function StatusBanner({ connection, guest }: { connection: Connection; guest: boolean }) {
  if (connection === "fallback") {
    return <div className="banner warn">{t("서버 연결 실패 · 로컬 테스트 모드 (이 브라우저에만 저장)")}</div>;
  }
  if (connection === "trying" || connection === "failed") {
    return <div className="banner warn">{t("연결이 끊겼어요. 다시 연결하는 중…")}</div>;
  }
  if (guest) {
    return <div className="banner">{t("게스트로 플레이 중이에요. 로그인하지 않으면 진행 상황이 사라질 수 있어요.")}</div>;
  }
  return null;
}
