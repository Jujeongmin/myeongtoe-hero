import { describe, expect, test } from "vitest";
import { connectionOf, wantsOnline } from "./connection";

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
