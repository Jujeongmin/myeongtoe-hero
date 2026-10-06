import { mkdtempSync, mkdirSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { scanVersions } from "./artVersions";

describe("art versions", () => {
  test("every file under the folder, by slash path, with its modification time", () => {
    const dir = mkdtempSync(join(tmpdir(), "art-"));
    mkdirSync(join(dir, "park", "fx"), { recursive: true });
    writeFileSync(join(dir, "park", "fx", "a.png"), "x");
    writeFileSync(join(dir, "b.png"), "y");
    const when = new Date(1_700_000_000_000);
    utimesSync(join(dir, "b.png"), when, when);
    const v = scanVersions(dir);
    expect(Object.keys(v).sort()).toEqual(["b.png", "park/fx/a.png"]);
    expect(v["b.png"]).toBe(1_700_000_000_000);
  });

  test("a missing folder versions nothing", () => {
    expect(scanVersions(join(tmpdir(), "no-such-art-folder-123"))).toEqual({});
  });
});
