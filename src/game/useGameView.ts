import { useEffect, useReducer } from "react";
import type { GameState } from "../../shared/state";
import type { GameStore } from "./store";

// Redraw 4 times a second: settle is cheap and the gold counter should feel alive.
const FRAME_MS = 250;

export function useGameView(store: GameStore): GameState | null {
  const [, redraw] = useReducer((n: number) => n + 1, 0);
  useEffect(() => store.subscribe(redraw), [store]);
  useEffect(() => {
    const id = setInterval(redraw, FRAME_MS);
    return () => clearInterval(id);
  }, []);
  return store.view();
}
