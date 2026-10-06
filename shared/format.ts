import type { Big } from "./big";

// The unit for 1000^k: 1 → A, 26 → Z, 27 → AA (bijective base 26, like spreadsheet columns).
export function unitName(k: number): string {
  let name = "";
  let n = k;
  while (n > 0) {
    n -= 1;
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26);
  }
  return name;
}

// 1,000 = 1.00A, 1,000A = 1.00B. Three significant digits, truncated so the screen never shows more
// gold than there is.
export function formatBig(v: Big): string {
  if (v.isZero()) return "0";
  if (v.e < 3) return String(Math.floor(v.toNumber()));
  const k = Math.floor(v.e / 3);
  const scaled = v.m * 10 ** (v.e - 3 * k);
  let text: string;
  if (scaled < 10) text = (Math.floor(scaled * 100) / 100).toFixed(2);
  else if (scaled < 100) text = (Math.floor(scaled * 10) / 10).toFixed(1);
  else text = String(Math.floor(scaled));
  return text + unitName(k);
}
