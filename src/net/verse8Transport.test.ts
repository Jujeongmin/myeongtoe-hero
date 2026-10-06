import { afterEach, describe, expect, test, vi } from "vitest";
import { syncSave } from "../../shared/sync";
import { Verse8Transport, withTimeout, type RemoteCaller } from "./verse8Transport";

afterEach(() => {
  vi.useRealTimers();
});

describe("Verse8Transport", () => {
  test("calls the server's sync with the intents and returns its answer", async () => {
    const calls: { fn: string; args?: unknown[] }[] = [];
    const server: RemoteCaller = {
      remoteFunction: async (fn, args) => {
        calls.push({ fn, args });
        return syncSave(undefined, args?.[0], 1000);
      },
    };
    const result = await new Verse8Transport(server).sync([{ k: "levelGear" }]);
    expect(calls).toEqual([{ fn: "sync", args: [[{ k: "levelGear" }]] }]);
    expect(result.now).toBe(1000);
  });

  test("an answer that is not a sync result is an error", async () => {
    const server: RemoteCaller = { remoteFunction: async () => ({ hello: 1 }) };
    await expect(new Verse8Transport(server).sync([])).rejects.toThrow("bad_reply");
  });

  test("gives up on a server that never answers", async () => {
    vi.useFakeTimers();
    const server: RemoteCaller = { remoteFunction: () => new Promise(() => undefined) };
    const pending = new Verse8Transport(server, 5000).sync([]);
    const check = expect(pending).rejects.toThrow("timeout");
    await vi.advanceTimersByTimeAsync(5000);
    await check;
  });
});

describe("withTimeout", () => {
  test("passes through a result that arrives in time", async () => {
    await expect(withTimeout(Promise.resolve(7), 1000)).resolves.toBe(7);
    await expect(withTimeout(Promise.reject(new Error("no")), 1000)).rejects.toThrow("no");
  });
});
