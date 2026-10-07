import type { GameStore } from "../game/store";
import { errorText } from "./text";

const SHOW_MS = 2000;

// Re-rendered with the rest of the screen (useGameView ticks), so it disappears on its own.
export function Toast({ store }: { store: GameStore }) {
  const error = store.error;
  if (!error || Date.now() - error.at > SHOW_MS) return null;
  return <div className="toast">{error.text ?? errorText(error.code)}</div>;
}
