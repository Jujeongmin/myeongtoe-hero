// How the link to the Verse8 server stands, for the screen to say: local (no Verse8 project, or ?local
// in development), fallback (a development build that could not reach the server and plays locally,
// see shouldPlayLocally), ready, trying (the SDK connects or reconnects with its own back-off), or
// failed (the SDK gave up; only reloading helps).
export type Connection = "local" | "fallback" | "ready" | "trying" | "failed";

export function connectionOf(opts: { online: boolean; connected: boolean; phase: string | undefined }): Connection {
  if (!opts.online) return "local";
  if (opts.connected) return "ready";
  return opts.phase === "unavailable" ? "failed" : "trying";
}

// Online when the build has a Verse8 project id (.env's VITE_AGENT8_VERSE), unless a development
// build was opened with ?local to play against the in-page server instead.
export function wantsOnline(verse: string | undefined, search: string, dev: boolean): boolean {
  if (!verse) return false;
  if (dev && new URLSearchParams(search).has("local")) return false;
  return true;
}

export const FALLBACK_AFTER_MS = 10_000;

// A development build — which is what the Verse8 editor's preview runs — plays on against the
// in-page server when it never reached the game server: the SDK gave up, or is still trying after
// FALLBACK_AFTER_MS. So the game can be tried while the preview server is down. A release build
// never does: there the server is the only judge of a save.
export function shouldPlayLocally(opts: { dev: boolean; connection: Connection; synced: boolean; waitedMs: number }): boolean {
  if (!opts.dev || opts.synced) return false;
  if (opts.connection === "failed") return true;
  return opts.connection === "trying" && opts.waitedMs >= FALLBACK_AFTER_MS;
}
