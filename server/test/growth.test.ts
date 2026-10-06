import { SAVE_VERSION, newState, toSave } from "../../shared/state";

describe("permanent growth on the server", () => {
  test("a pet box levels the same pet on the server as on the client", async (server) => {
    server.connect({ account: "test-g1" });
    const s = newState(Date.now());
    s.bestFloor = 600;
    s.coupons = 100;
    await $global.updateUserState("test-g1", { save: toSave(s) });
    const r = await server.sync([{ k: "petBox" }]);
    expect(r.rejected.length).toBe(0);
    expect(Object.values(r.save.pets)).toEqual([2]);
    expect(r.save.coupons).toBe(30);
  });

  test("a suit bought on the server is worn", async (server) => {
    server.connect({ account: "test-g3" });
    const s = newState(Date.now());
    s.coupons = 100;
    await $global.updateUserState("test-g3", { save: toSave(s) });
    const r = await server.sync([{ k: "buySuit", id: "s1_tie" }]);
    expect(r.save.wear.tie).toBe("s1_tie");
  });

  test("a version 2 save with gear above 5 comes down to 5", async (server) => {
    server.connect({ account: "test-g2" });
    const v2 = { ...toSave(newState(Date.now())), v: 2, gear: { tier: 1, level: 9 }, stats: { atk: 2, crit: 0, critDmg: 0, aspd: 0 } } as Record<string, unknown>;
    for (const k of ["coupons", "ticketCarry", "pets", "relics", "apartment", "suits", "office", "wear"]) delete v2[k];
    await $global.updateUserState("test-g2", { save: v2 });
    const r = await server.sync([]);
    expect(r.save.v).toBe(SAVE_VERSION);
    expect(r.save.gear.level).toBe(5);
    expect(r.save.stats).toBe(undefined);
  });
});
