import { newState, toSave } from "../../shared/state";

describe("VX purchases", () => {
  test("a purchase pays into the save once, however often it arrives", async (server) => {
    server.connect({ account: "test-p1" });
    const s = newState(Date.now());
    s.gems = 10;
    await $global.updateUserState("test-p1", { save: toSave(s) });
    const event = { account: "test-p1", purchaseId: "rcpt-1", productId: "gems_m", quantity: 1 };
    const first = await server.$onItemPurchased(event);
    expect(first).toEqual({ success: true, code: "granted" });
    const again = await server.$onItemPurchased(event);
    expect(again).toEqual({ success: true, code: "already_granted" });
    const stored = (await $global.getUserState("test-p1")).save;
    expect(stored.gems).toBe(10 + 1400);
    expect(stored.vx.total).toBe(1000);
    const r = await server.sync([]);
    expect(r.save.gems).toBe(10 + 1400);
  });

  test("a player with no save yet gets one with the purchase in it", async (server) => {
    server.connect({ account: "test-p2" });
    const out = await server.$onItemPurchased({ account: "test-p2", purchaseId: 77, productId: "premium", quantity: 1 });
    expect(out.code).toBe("granted");
    expect((await $global.getUserState("test-p2")).save.vx.premium).toBe(true);
  });

  test("bad events and unknown products are turned down", async (server) => {
    server.connect({ account: "test-p3" });
    expect(await server.$onItemPurchased({ account: "test-p3", purchaseId: "x", productId: "nope", quantity: 1 }))
      .toEqual({ success: false, code: "unknown_product" });
    expect(await server.$onItemPurchased({ account: "", purchaseId: "x", productId: "gems_xs", quantity: 1 }))
      .toEqual({ success: false, code: "invalid_event" });
  });
});
