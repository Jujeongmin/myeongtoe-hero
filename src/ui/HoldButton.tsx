import { useEffect, useRef, type ButtonHTMLAttributes } from "react";

const FIRST_DELAY_MS = 350;
const START_EVERY_MS = 140;
const FASTEST_EVERY_MS = 50;

// A level-up button that keeps firing while held: once on press, then after a short pause again
// and again, faster the longer it is held. It stops on release, when the finger leaves it, or as
// soon as it turns disabled (out of gold, maxed). A keyboard press fires once.
export function HoldButton({ onFire, disabled, ...rest }: { onFire: () => void } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">) {
  const fire = useRef(onFire);
  fire.current = onFire;
  const timer = useRef(0);
  const stop = () => {
    window.clearTimeout(timer.current);
    timer.current = 0;
  };
  useEffect(() => {
    if (disabled) stop();
  }, [disabled]);
  useEffect(() => stop, []);
  const repeat = (every: number) => {
    timer.current = window.setTimeout(() => {
      fire.current();
      repeat(Math.max(FASTEST_EVERY_MS, every * 0.85));
    }, every);
  };
  return (
    <button
      {...rest}
      disabled={disabled}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        stop();
        fire.current();
        timer.current = window.setTimeout(() => repeat(START_EVERY_MS), FIRST_DELAY_MS - START_EVERY_MS);
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => {
        if (e.detail === 0) fire.current(); // keyboard (Enter/Space); pointer presses already fired
      }}
    />
  );
}
