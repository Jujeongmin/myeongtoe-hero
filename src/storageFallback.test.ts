import { describe, expect, test } from "vitest";
import { memoryStorage, storageWorks } from "./storageFallback";

describe("storageFallback", () => {
  test("a working store passes the probe and is left clean", () => {
    const store = memoryStorage();
    expect(storageWorks(() => store)).toBe(true);
    expect(store.length).toBe(0);
  });

  test("a store that throws fails the probe", () => {
    const blocked = () => {
      throw new DOMException("denied", "SecurityError");
    };
    expect(storageWorks(blocked)).toBe(false);
    const throwsOnWrite = { ...memoryStorage(), setItem: () => { throw new Error("quota"); } } as Storage;
    expect(storageWorks(() => throwsOnWrite)).toBe(false);
  });

  test("the memory store behaves like localStorage", () => {
    const s = memoryStorage();
    s.setItem("a", "1");
    s.setItem("b", "2");
    expect(s.getItem("a")).toBe("1");
    expect(s.getItem("zzz")).toBeNull();
    expect(s.length).toBe(2);
    expect(s.key(1)).toBe("b");
    s.removeItem("a");
    expect(s.length).toBe(1);
    s.clear();
    expect(s.length).toBe(0);
  });
});
