// Collects every Korean sentence in src/ and shared/ (string literals and JSX text), rewrites the
// locale files so each has exactly those keys (keeping translations already there, adding the new
// ones empty), and lists what still needs work: Korean JSX text or literals in src/ that are not
// passed through t(), template strings with Korean and ${…} (they need t("…{x}…", { x })), and
// missing translations per language.
// Run: npm run i18n
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

const HANGUL = /[가-힣]/;
const LANGS = ["en", "ja", "zh-Hant", "zh-Hans"];
const LOCALE_DIR = "src/i18n/locales";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return files(p);
    return /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && !p.includes("i18n") ? [p] : [];
  });
}

const keys = new Set<string>();
const todo: string[] = [];

for (const file of [...files("src"), ...files("shared")]) {
  const text = readFileSync(file, "utf8");
  const src = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const where = (n: ts.Node) => `${relative(".", file)}:${src.getLineAndCharacterOfPosition(n.getStart()).line + 1}`;
  const inT = (n: ts.Node) => {
    const p = n.parent;
    return ts.isCallExpression(p) && ts.isIdentifier(p.expression) && p.expression.text === "t" && p.arguments[0] === n;
  };
  const visit = (n: ts.Node): void => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
      if (HANGUL.test(n.text) && !ts.isImportDeclaration(n.parent)) {
        keys.add(n.text);
        if (file.startsWith("src") && !inT(n) && !ts.isPropertyAssignment(n.parent)) todo.push(`${where(n)} literal not in t(): ${n.text}`);
      }
    } else if (ts.isJsxText(n)) {
      const s = n.text.replace(/\s+/g, " ").trim();
      if (HANGUL.test(s)) {
        keys.add(s);
        todo.push(`${where(n)} JSX text: ${s}`);
      }
    } else if (ts.isTemplateExpression(n)) {
      if (HANGUL.test(n.getText())) todo.push(`${where(n)} template with Korean: ${n.getText().slice(0, 60)}`);
    }
    ts.forEachChild(n, visit);
  };
  visit(src);
}

// Names in the art data the game shows (monsters).
const monsters = JSON.parse(readFileSync("art/monsters/monsters.json", "utf8")) as { monsters: Record<string, { name: string }> };
for (const m of Object.values(monsters.monsters)) if (HANGUL.test(m.name)) keys.add(m.name);

const sorted = [...keys].sort();
for (const lang of LANGS) {
  const path = `${LOCALE_DIR}/${lang}.json`;
  const old = JSON.parse(readFileSync(path, "utf8")) as Record<string, string>;
  const next: Record<string, string> = {};
  for (const k of sorted) next[k] = old[k] ?? "";
  writeFileSync(path, JSON.stringify(next, null, 1) + "\n");
  console.log(`${lang}: ${sorted.length} keys, ${sorted.filter((k) => !next[k]).length} untranslated`);
}
console.log(`${todo.length} places to wrap:`);
for (const line of todo) console.log("  " + line);
