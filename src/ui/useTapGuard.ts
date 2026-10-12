import { useCallback, useEffect, useRef, useState, type SyntheticEvent } from "react";

// Something that opens by itself (the webtoon, a popup) can land under a finger that was tapping
// the game, 강화 again and again. For its first moments it lets no tap through, so none of those
// taps skips a page or presses a button by accident. `arm` starts such a moment again (a new
// webtoon page). While `armed` is false the screen shows it (index.css .arming).
export const ARM_MS = 900;

export function useTapGuard(ms = ARM_MS) {
  const until = useRef(Date.now() + ms);
  const [armed, setArmed] = useState(false);
  const arm = useCallback((wait: number) => {
    until.current = Date.now() + wait;
    setArmed(false);
  }, []);
  useEffect(() => {
    if (armed) return;
    const id = setTimeout(() => setArmed(true), Math.max(0, until.current - Date.now()));
    return () => clearTimeout(id);
  }, [armed]);
  const onClickCapture = useCallback((e: SyntheticEvent) => {
    if (Date.now() < until.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, []);
  return { armed, arm, onClickCapture };
}

// When the player last touched the screen, for opening things only once they have paused.
let lastTouch = 0;
if (typeof window !== "undefined") {
  window.addEventListener("pointerdown", () => (lastTouch = Date.now()), { capture: true, passive: true });
}

export function idleFor(ms: number): boolean {
  return Date.now() - lastTouch >= ms;
}
