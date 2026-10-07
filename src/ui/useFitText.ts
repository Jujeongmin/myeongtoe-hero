import { useLayoutEffect, useRef } from "react";

// One line, never cut: the font steps down a pixel at a time (12px to 7px) until the text fits.
export function useFitText<T extends HTMLElement>(text: string) {
  const ref = useRef<T>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    for (let px = 12; px >= 7; px--) {
      el.style.fontSize = `${px}px`;
      if (el.scrollWidth <= el.clientWidth) break;
    }
  }, [text]);
  return ref;
}
