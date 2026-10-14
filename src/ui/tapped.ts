import { useState } from "react";

// Things the player has tapped at least once (the battle screen's buffs and 2배속), kept in this
// browser. Until then a red dot sits on them, so a new player finds them. Without storage the dots
// come back next time, which is harmless.
const KEY = "myeongtoe-hero:tapped";

function read(): string[] {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

// [already tapped, mark it tapped].
export function useTappedOnce(id: string): [boolean, () => void] {
  const [tapped, setTapped] = useState(() => read().includes(id));
  const mark = () => {
    if (tapped) return;
    setTapped(true);
    try {
      localStorage.setItem(KEY, JSON.stringify([...read().filter((k) => k !== id), id]));
    } catch {
      // No storage: the dot comes back next time.
    }
  };
  return [tapped, mark];
}
