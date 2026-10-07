import { useEffect, useRef, useState } from "react";

// A row's level-up, shown on the row (which needs the "levelled" class): "LV UP" (or `label`)
// popping up at its top. Nothing on the first render or when the level drops.
export function LevelUpFx({ level, label = "LV UP" }: { level: number; label?: string }) {
  const last = useRef(level);
  const [at, setAt] = useState(0);
  useEffect(() => {
    if (level > last.current) setAt(Date.now());
    last.current = level;
  }, [level]);
  if (!at) return null;
  return <i key={at} className="lv-up row-lv-up">{label}</i>;
}
