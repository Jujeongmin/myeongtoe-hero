import { describe, expect, test } from "vitest";
import { displayName, readBoard, readNickname, rankRowOf } from "./ranking";
import { newState } from "./state";

describe("nicknames", () => {
  test("2 to 8 Korean letters, English letters or digits, trimmed", () => {
    expect(readNickname("  박부장  ")).toBe("박부장");
    expect(readNickname("Park52")).toBe("Park52");
    expect(readNickname("박")).toBeNull();
    expect(readNickname("박부장박부장박부장")).toBeNull();
    expect(readNickname("박 부장")).toBeNull();
    expect(readNickname("<script>")).toBeNull();
    expect(readNickname(42)).toBeNull();
  });

  test("a row without a nickname shows as 직원 + the account's last 4", () => {
    expect(displayName({ account: "0xabcdef1234", nickname: "", floor: 1, depth: 0 })).toBe("직원 1234");
    expect(displayName({ account: "0xabcdef1234", nickname: "박부장", floor: 1, depth: 0 })).toBe("박부장");
  });
});

describe("boards", () => {
  test("floor or depth only", () => {
    expect(readBoard("floor")).toBe("floor");
    expect(readBoard("depth")).toBe("depth");
    expect(readBoard("gold")).toBeNull();
  });

  test("a save's row", () => {
    const s = newState(0);
    s.bestFloor = 120;
    s.parking = { ...s.parking, best: 40 };
    s.nickname = "박부장";
    expect(rankRowOf("acc", s)).toEqual({ account: "acc", nickname: "박부장", floor: 120, depth: 40 });
  });
});
