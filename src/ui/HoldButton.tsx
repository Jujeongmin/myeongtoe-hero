import { useEffect, useRef, type ButtonHTMLAttributes } from "react";

const FIRST_DELAY_MS = 350;
const START_EVERY_MS = 140;
const FASTEST_EVERY_MS = 50;
// While held but not affordable yet, how often it looks again.
const WAIT_EVERY_MS = 100;

// A level-up button that keeps firing while held: once on press, then after a short pause again
// and again, faster the longer it is held. Held while it can't be paid for (`ready` false), it
// waits and fires the moment the money is there, then carries on. It stops on release, when the
// finger leaves it, or when it turns disabled (maxed). A keyboard press fires once, if ready.
// Not ready is aria-disabled, not disabled, so it can still be held; it makes no sound and shows
// nothing while it waits.
export function HoldButton({ onFire, disabled, ready = true, className, ...rest }: { onFire: () => void; ready?: boolean } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">) {
  const fire = useRef(onFire);
  fire.current = onFire;
  const can = useRef(ready);
  can.current = ready;
  const timer = useRef(0);
  const stop = () => {
    window.clearTimeout(timer.current);
    timer.current = 0;
  };
  useEffect(() => {
    if (disabled) stop();
  }, [disabled]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const repeat = (every: number) => {
    timer.current = window.setTimeout(() => {
      if (!can.current) {
        repeat(every);
        return;
      }
      fire.current();
      repeat(Math.max(FASTEST_EVERY_MS, every * 0.85));
    }, can.current ? every : WAIT_EVERY_MS);
  };
  return (
    <button
      {...rest}
      className={className}
      disabled={disabled}
      aria-disabled={!ready || undefined}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        window.clearTimeout(timer.current);
        if (can.current) fire.current();
        timer.current = window.setTimeout(() => repeat(START_EVERY_MS), FIRST_DELAY_MS - START_EVERY_MS);
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => {
        if (e.detail === 0 && can.current) fire.current(); // keyboard (Enter/Space); pointer presses already fired
      }}
    />
  );
}
