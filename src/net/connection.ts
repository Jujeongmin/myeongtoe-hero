// How the link to the Verse8 server stands, for the screen to say: local (no Verse8 project, or ?local
// in development), ready, trying (the SDK connects or reconnects with its own back-off), or failed
// (the SDK gave up; only reloading helps).
export type Connection = "local" | "ready" | "trying" | "failed";

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
