import { Big } from "../../shared/big";
import { SAVE_VERSION, newState, toSave } from "../../shared/state";

describe("core loop on the server", () => {
  test("a job change resets the run and pays tickets", async (server) => {
    server.connect({ account: "test-p" });
    const s = newState(Date.now());
    s.run = { ...s.run, floor: 100, maxFloor: 100 };
    s.bestFloor = 100;
    s.gold = Big.of(1, 20);
    await $global.updateUserState("test-p", { save: toSave(s) });
    const r = await server.sync([{ k: "prestige", boosted: false }]);
    expect(r.rejected.length).toBe(0);
    expect(r.save.run.floor).toBe(1);
    expect(r.save.prestiges).toBe(1);
    expect(r.save.tickets).toBeGreaterThan(0);
  });

  test("taking a certificate on the server matches the client's prediction", async (server) => {
    server.connect({ account: "test-q" });
    const s = newState(Date.now());
    s.tickets = 30;
    await $global.updateUserState("test-q", { save: toSave(s) });
    const r = await server.sync([{ k: "levelCert", id: "atk1", bulk: true }]);
    expect(r.save.certs).toEqual({ atk1: 2 });
    expect(r.save.tickets).toBe(5);
  });

  test("a version 1 save on the server is migrated", async (server) => {
    server.connect({ account: "test-r" });
    const v1 = {
      v: 1, lastTick: Date.now(), gold: "0e0", bestFloor: 3,
      run: { floor: 3, target: 0, carrySec: 0, farming: false, maxFloor: 3 },
      gear: { tier: 0, level: 2 }, sideJobs: {}, flags: { sideJobAuto: false }, reserved: {},
    };
    await $global.updateUserState("test-r", { save: v1 });
    const r = await server.sync([]);
    expect(r.save.v).toBe(SAVE_VERSION);
    expect(r.save.gear.level).toBe(2);
    expect(r.save.tickets).toBe(0);
  });
});
