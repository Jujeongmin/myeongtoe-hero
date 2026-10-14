import { describe, expect, test } from "vitest";
import { isRude } from "./profanity";
import { displayName, nicknameError, readNickname } from "./ranking";
import { fill } from "./text";

describe("rude nicknames", () => {
  test("swear words, slurs and sexual words in any of the game's languages", () => {
    for (const name of ["시발맨", "씨발", "개새끼", "병신용사", "존나쎔", "느금마", "니애미", "지랄", "fuckyou", "FUCK", "Shit", "nigga", "bitch", "ちんこ", "マンコ", "死ね", "傻逼", "操你妈", "幹你娘", "機掰"]) {
      expect(isRude(name), name).toBe(true);
    }
  });

  test("dodges with digits or look-alike digits are caught", () => {
    for (const name of ["시1발", "씨8발", "병1신", "f4ck", "fu2ck", "sh1t", "b1tch"]) {
      expect(isRude(name), name).toBe(true);
    }
  });

  test("posing as the game's staff is not allowed", () => {
    for (const name of ["운영자", "관리자님", "GM운영팀", "admin"]) expect(isRude(name), name).toBe(true);
  });

  test("ordinary names pass", () => {
    for (const name of ["박부장", "Park52", "パク部長", "朴部长", "김대리", "명퇴용사", "シネマ", "classic", "assist", "부장님"]) {
      expect(isRude(name), name).toBe(false);
    }
  });

  test("a rude nickname is refused with its own reason; a badly formed one keeps the old reason", () => {
    expect(readNickname("시발맨")).toBeNull();
    expect(nicknameError("시발맨")).toBe("rude_nickname");
    expect(nicknameError("박")).toBe("bad_nickname");
    expect(nicknameError("박부장")).toBeNull();
  });

  test("a rude nickname saved before the filter shows as 직원 + the account's last 4", () => {
    expect(fill(displayName({ account: "0xabcdef1234", nickname: "씨발", floor: 1, depth: 0 }))).toBe("직원 1234");
  });
});
