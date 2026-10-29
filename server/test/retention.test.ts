import { ADMINS, PLAYERS, RETENTION_FROM, VISITS, addDays } from "../../shared/retention";
import { kstDay } from "../../shared/time";
import { newState, toSave } from "../../shared/state";

describe("retention", () => {
  test("a sync writes the day's visit once; a new player starts a cohort, an old one does not", async (server) => {
    const today = kstDay(Date.now());
    server.connect({ account: "test-v1" });
    await server.sync([]);
    await server.sync([]);
    server.connect({ account: "test-v2" });
    await $global.updateUserState("test-v2", { save: toSave(newState(Date.now())) });
    await server.sync([]);
    const mine = await $global.getCollectionItems(VISITS, { filters: [{ field: "account", operator: "==", value: "test-v1" }] });
    expect(mine.length).toBe(1);
    expect(mine[0].day).toBe(today);
    expect(mine[0].first).toBe(today);
    const old = await $global.getCollectionItems(VISITS, { filters: [{ field: "account", operator: "==", value: "test-v2" }] });
    expect(old[0].first).toBe(null);
  });

  test("only an admin may read the table; it counts a cohort's returns", async (server) => {
    server.connect({ account: "test-v3" });
    let error = "";
    try {
      await server.retention();
    } catch (e: any) {
      error = String(e?.message ?? e);
    }
    expect(error).toContain("forbidden");
    // Two players who started on the first day; one came back the next day.
    for (const [account, day] of [["test-c1", RETENTION_FROM], ["test-c2", RETENTION_FROM], ["test-c1", addDays(RETENTION_FROM, 1)]]) {
      await $global.addCollectionItem(VISITS, { account, day, first: RETENTION_FROM });
    }
    server.connect({ account: ADMINS[0] });
    const r = await server.retention();
    const first = r.rows.find((row: any) => row.day === RETENTION_FROM);
    expect(first.newUsers).toBe(2);
    if (kstDay(Date.now()) > RETENTION_FROM) expect(first.back[0]).toBe(1);
  });

  test("a sync keeps the player's row; 이탈 counts the new players who have not played for 2 days", async (server) => {
    server.connect({ account: "test-ch1" });
    await server.sync([]);
    const row = await $global.getCollectionItem(PLAYERS, "test-ch1");
    expect(row.floor).toBe(1);
    expect(row.first).toBe(kstDay(Date.now()));
    // One who started on the first day and was last seen then (if that is 2+ days ago, they left).
    await $global.addCollectionItem(PLAYERS, { account: "test-ch0", first: RETENTION_FROM, last: RETENTION_FROM, days: 1, floor: 7, step: 2, prestiges: 0, playMin: 4 }, { id: "test-ch0" });
    let error = "";
    try {
      await server.churn();
    } catch (e: any) {
      error = String(e?.message ?? e);
    }
    expect(error).toContain("forbidden");
    server.connect({ account: ADMINS[0] });
    const r = await server.churn();
    expect(r.newPlayers).toBeGreaterThan(1);
    expect(r.byFloor[0].all).toBeGreaterThan(1);
  });
});

describe("운영자 지급", () => {
  test("only an admin gives; it lands in the player's save and the next sync keeps it", async (server) => {
    server.connect({ account: "test-gift" });
    await server.sync([]);
    let error = "";
    try {
      await server.grant("test-gift", { gems: 100 });
    } catch (e: any) {
      error = String(e?.message ?? e);
    }
    expect(error).toContain("forbidden");
    server.connect({ account: ADMINS[0] });
    const r = await server.grant("test-gift", { gems: 1000, coupons: 300 });
    expect(r.given).toEqual({ gems: 1000, coupons: 300, tickets: 0 });
    server.connect({ account: "test-gift" });
    const after = await server.sync([]);
    expect(after.save.gems).toBe(r.gems);
    expect(after.save.coupons).toBe(r.coupons);
    server.connect({ account: ADMINS[0] });
    let bad = "";
    try {
      await server.grant("test-gift", { gems: -5 });
    } catch (e: any) {
      bad = String(e?.message ?? e);
    }
    expect(bad).toContain("bad_grant");
  });
});
