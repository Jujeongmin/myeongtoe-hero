import { describe, expect, test } from "vitest";
import { bustCssImports } from "./cssCacheBust";

describe("bustCssImports", () => {
  const version = () => "123";

  test("versions relative stylesheet imports", () => {
    expect(bustCssImports(`import "./index.css";`, "/p/src/main.tsx", version)).toBe(`import "./index.css?v=123";`);
    expect(bustCssImports(`import '../a/b.css'`, "/p/src/x/y.ts", version)).toBe(`import '../a/b.css?v=123'`);
  });

  test("leaves code without relative css imports alone", () => {
    expect(bustCssImports(`import "react";`, "/p/src/main.tsx", version)).toBeNull();
    expect(bustCssImports(`import "pkg/style.css";`, "/p/src/main.tsx", version)).toBeNull();
  });
});
