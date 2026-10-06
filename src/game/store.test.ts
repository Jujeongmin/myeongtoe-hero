import { describe, expect, test } from "vitest";
import type { Intent } from "../../shared/actions";
import type { SyncResult } from "../../shared/sync";
import { LocalTransport, OFFLINE, type Transport } from "../net/transport";
import { GameStore } from "./store";

function memory(): Pick<Storage, "getItem" | "setItem"> {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

function setup() {
  let now = 1_000_000;
  const clock = () => now;
  const transport = new LocalTransport(memory(), clock);
  const store = new GameStore(transport, clock);
  return { store, transport, advance: (ms: number) => (now += ms) };
}

describe("GameStore", () => {
  test("has nothing to show before the first sync", async () => {
    const { store } = setup();
    expect(store.view()).toBeNull();
    await store.flush();
    expect(store.view()?.run.floor).toBe(1);
  });

  test("refuses what the rules refuse, without queueing it", async () => {
    const { store } = setup();
    await store.flush();
    expect(store.do({ k: "levelGear" })).toBe(false);
    expect(store.error?.code).toBe("not_enough_gold");
  });

  test("predicts gold over time and applies a queued intent at once, then confirms it", async () => {
    const { store, advance } = setup();
    await store.flush();
    advance(60_000);
    const before = store.view()!;
    expect(before.gold.isZero()).toBe(false);
    expect(store.do({ k: "levelGear" })).toBe(true);
    expect(store.view()!.gear.level).toBe(1);
    await store.flush();
    expect(store.view()!.gear.level).toBe(1);
  });

  test("skips the heartbeat until it is due", async () => {
    const calls: Intent[][] = [];
    const inner = setup();
    const counting: Transport = {
      ...OFFLINE,
      sync: (intents) => {
        calls.push(intents);
        return inner.transport.sync(intents);
      },
    };
    const store = new GameStore(counting, () => 0);
    await store.flush();
    await store.flush();
    expect(calls.length).toBe(1);
  });

  test("puts intents back when the network fails", async () => {
    const { store, transport, advance } = setup();
    await store.flush();
    advance(60_000);
    store.do({ k: "levelGear" });
    let fail = true;
    const flaky: Transport = {
      ...OFFLINE,
      sync: (intents): Promise<SyncResult> => (fail ? Promise.reject(new Error("offline")) : transport.sync(intents)),
    };
    (store as unknown as { transport: Transport }).transport = flaky;
    await expect(store.flush()).rejects.toThrow("offline");
    expect(store.view()!.gear.level).toBe(1); // still predicted
    fail = false;
    await store.flush();
    expect(store.view()!.gear.level).toBe(1);
  });

  test("switching transport sends the queued intents over the new one", async () => {
    const { store, transport, advance } = setup();
    await store.flush();
    advance(60_000);
    store.setTransport(OFFLINE);
    store.do({ k: "levelGear" });
    await expect(store.flush()).rejects.toThrow("offline");
    store.setTransport(transport);
    await store.flush();
    expect(store.view()!.gear.level).toBe(1);
  });

  test("knows whether it has heard from the server yet", async () => {
    const { store } = setup();
    expect(store.synced()).toBe(false);
    await store.flush();
    expect(store.synced()).toBe(true);
  });

  test("keeps the away report until dismissed", async () => {
    const { store, advance } = setup();
    await store.flush();
    advance(600_000);
    await store.flush();
    expect(store.offline?.seconds).toBeCloseTo(600, 6);
    store.dismissOffline();
    expect(store.offline).toBeNull();
  });

  test("local play: the ranking is just me, and a nickname is checked and saved", async () => {
    const { store } = setup();
    await store.flush();
    await expect(store.setNickname("<b>")).rejects.toThrow("bad_nickname");
    await store.setNickname(" 박부장 ");
    expect(store.view()!.nickname).toBe("박부장");
    const board = await store.ranking("floor");
    expect(board.rows).toHaveLength(1);
    expect(board.mine?.nickname).toBe("박부장");
  });

  test("LocalTransport keeps the save between stores", async () => {
    const storage = memory();
    const a = new GameStore(new LocalTransport(storage, () => 0), () => 0);
    await a.flush();
    const b = new GameStore(new LocalTransport(storage, () => 120_000), () => 120_000);
    await b.flush();
    expect(b.view()!.gold.isZero()).toBe(false);
  });
});
