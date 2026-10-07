import type { ReactNode } from "react";
import { t } from "../i18n";

// A panel over the game, for costumes, the apartment and the like.
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <header>
          <b>{title}</b>
          <button onClick={onClose}>{t("닫기")}</button>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
