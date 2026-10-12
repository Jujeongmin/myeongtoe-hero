import { newState, toSave } from "../../shared/state";

describe("rankings", () => {
  test("a sync that raises the record writes the row; boards sort best first", async (server) => {
    for (const [account, floor, depth] of [["test-r1", 50, 10], ["test-r2", 300, 5], ["test-r3", 120, 80]] as const) {
      server.connect({ account });
      const s = newState(Date.now());
      s.bestFloor = floor;
      s.parking = { ...s.parking, best: depth };
      await $global.updateUserState(account, { save: toSave(s) });
      // A sync on a save whose record is above the stored row (none yet) writes it.
      await server.sync([]);
    }
    const floor = await server.ranking("floor");
    expect(floor.board).toBe("floor");
    expect(floor.rows.map((r: any) => r.account).slice(0, 3)).toEqual(["test-r2", "test-r3", "test-r1"]);
    expect(floor.mine.account).toBe("test-r3");
    const depth = await server.ranking("depth");
    expect(depth.rows[0].account).toBe("test-r3");
    expect(floor.rows[0].__id).toBe(undefined);
  });

  test("a nickname is checked, saved and shown on the board", async (server) => {
    server.connect({ account: "test-r4" });
    await server.sync([]);
    let error = "";
    try {
      await server.setNickname("<b>");
    } catch (e: any) {
      error = String(e?.message ?? e);
    }
    expect(error).toContain("bad_nickname");
    const r = await server.setNickname(" 박부장 ");
    expect(r.nickname).toBe("박부장");
    expect((await $global.getUserState("test-r4")).save.nickname).toBe("박부장");
    const board = await server.ranking("floor");
    expect(board.mine.nickname).toBe("박부장");
  });

  test("a profile: anyone's records and the costume pieces they own and wear", async (server) => {
    const s = newState(Date.now());
    s.nickname = "김대리";
    s.bestFloor = 77;
    s.suits = ["s1_helmet"];
    s.wear = { helmet: "s1_helmet", armor: "s1_armor" };
    await $global.updateUserState("test-r5", { save: toSave(s) });
    server.connect({ account: "test-r6" });
    const p = await server.profile("test-r5");
    expect(p.nickname).toBe("김대리");
    expect(p.floor).toBe(77);
    expect(p.wear).toEqual({ helmet: "s1_helmet" });
    let error = "";
    try {
      await server.profile("test-nobody");
    } catch (e: any) {
      error = String(e?.message ?? e);
    }
    expect(error).toContain("not_found");
  });
});
