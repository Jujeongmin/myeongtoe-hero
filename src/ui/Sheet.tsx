import type { ReactNode } from "react";
import { t } from "../i18n";

// A panel over the game, for costumes, the apartment and the like.
// `theme` picks that menu's own frames (art/ui/<theme>_panel, _row, _button), so each menu looks like its own place.
// `wallet`: the currencies this menu spends, shown with what the player holds.
export function Sheet({ title, theme, wallet, onClose, children }: { title: string; theme?: string; wallet?: ReactNode; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className={`sheet${theme ? ` theme-${theme}` : ""}`} onClick={(e) => e.stopPropagation()}>
        <header>
          <b>{title}</b>
          {wallet && <span className="sheet-wallet">{wallet}</span>}
          <button onClick={onClose}>{t("닫기")}</button>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
