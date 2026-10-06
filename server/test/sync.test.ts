import { toSave, newState } from "../../shared/state";
import { Big } from "../../shared/big";

describe("sync", () => {
  test("a new account starts a new game on floor 1", async (server) => {
    server.connect({ account: "test-a" });
    const r = await server.sync([]);
    expect(r.save.run.floor).toBe(1);
    expect(r.save.gold).toBe("0e0");
    expect(r.rejected.length).toBe(0);
    const stored = await $global.getUserState("test-a");
    expect(stored.save.lastTick).toBe(r.now);
  });

  test("applies intents to the stored save and reports refusals", async (server) => {
    server.connect({ account: "test-b" });
    const rich = toSave({ ...newState(Date.now()), gold: Big.of(1, 100) });
    await $global.updateUserState("test-b", { save: rich });
    const r = await server.sync([{ k: "levelGear" }, { k: "levelRelic", id: "r_badge" }]);
    expect(r.save.gear.level).toBe(1);
    expect(r.rejected[0].index).toBe(1);
    expect(r.rejected[0].code).toBe("locked");
    expect((await $global.getUserState("test-b")).save.gear.level).toBe(1);
  });

  test("players do not share saves", async (server) => {
    server.connect({ account: "test-c" });
    await $global.updateUserState("test-c", { save: toSave({ ...newState(Date.now()), gold: Big.of(1, 100) }) });
    await server.sync([{ k: "levelGear" }]);
    server.connect({ account: "test-d" });
    const other = await server.sync([]);
    expect(other.save.gear.level).toBe(0);
  });
});
