import { describe, expect, test } from "vitest";
import { FALLBACK_AFTER_MS, connectionOf, shouldPlayLocally, wantsOnline } from "./connection";

describe("connectionOf", () => {
  test("local when not playing online", () => {
    expect(connectionOf({ online: false, connected: false, phase: undefined })).toBe("local");
  });

  test("ready, trying or failed when online", () => {
    expect(connectionOf({ online: true, connected: true, phase: "connected" })).toBe("ready");
    expect(connectionOf({ online: true, connected: false, phase: "connecting" })).toBe("trying");
    expect(connectionOf({ online: true, connected: false, phase: "reconnecting" })).toBe("trying");
    expect(connectionOf({ online: true, connected: false, phase: "unavailable" })).toBe("failed");
  });
});

describe("wantsOnline", () => {
  test("online only with a Verse8 project id", () => {
    expect(wantsOnline("0xabc-1", "", false)).toBe(true);
    expect(wantsOnline(undefined, "", false)).toBe(false);
    expect(wantsOnline("", "", true)).toBe(false);
  });

  test("?local forces local play, in development only", () => {
    expect(wantsOnline("0xabc-1", "?local", true)).toBe(false);
    expect(wantsOnline("0xabc-1", "?local", false)).toBe(true);
  });
});

describe("shouldPlayLocally", () => {
  const base = { dev: true, connection: "trying" as const, synced: false, waitedMs: 0 };

  test("a development build plays locally once the server gave up", () => {
    expect(shouldPlayLocally({ ...base, connection: "failed" })).toBe(true);
  });

  test("or once it has been trying for too long", () => {
    expect(shouldPlayLocally({ ...base, waitedMs: FALLBACK_AFTER_MS - 1 })).toBe(false);
    expect(shouldPlayLocally({ ...base, waitedMs: FALLBACK_AFTER_MS })).toBe(true);
  });

  test("never in a release build, and never after a server sync", () => {
    expect(shouldPlayLocally({ ...base, dev: false, connection: "failed" })).toBe(false);
    expect(shouldPlayLocally({ ...base, synced: true, connection: "failed" })).toBe(false);
    expect(shouldPlayLocally({ ...base, connection: "ready", waitedMs: 1e9 })).toBe(false);
  });
});
