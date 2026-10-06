import type { ReactNode } from "react";

// A panel over the game (the original opens costumes and the like this way).
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <header>
          <b>{title}</b>
          <button onClick={onClose}>닫기</button>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}
