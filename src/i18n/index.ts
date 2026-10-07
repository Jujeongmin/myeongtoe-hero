import { useSyncExternalStore } from "react";
import en from "./locales/en.json";
import ja from "./locales/ja.json";
import zhHans from "./locales/zh-Hans.json";
import zhHant from "./locales/zh-Hant.json";

// Languages. Korean is the source: every Korean sentence in the code is its own key, and the other
// languages map it to a translation (src/i18n/locales/*.json, kept up to date by `npm run i18n`).
// A missing translation shows the Korean.
export const LOCALES = [
  { code: "ko", name: "한국어" },
  { code: "en", name: "English" },
  { code: "ja", name: "日本語" },
  { code: "zh-Hant", name: "繁體中文" },
  { code: "zh-Hans", name: "简体中文" },
] as const;
export type Locale = (typeof LOCALES)[number]["code"];

const DICTS: Record<Locale, Record<string, string>> = { ko: {}, en, ja, "zh-Hant": zhHant, "zh-Hans": zhHans };
const KEY = "myeongtoe-hero:locale";

// The device language picks the first locale: 한국어 for ko, 日本語 for ja, 繁體 for zh-TW/HK/MO
// and Hant, 简体 for other Chinese, English otherwise.
export function detectLocale(lang: string): Locale {
  const l = lang.toLowerCase();
  if (l.startsWith("ko")) return "ko";
  if (l.startsWith("ja")) return "ja";
  if (l.startsWith("zh")) return /hant|tw|hk|mo/.test(l) ? "zh-Hant" : "zh-Hans";
  return "en";
}

function initial(): Locale {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && saved in DICTS) return saved as Locale;
  } catch {
    // storage blocked: fall through to the device language
  }
  return typeof navigator === "undefined" ? "ko" : detectLocale(navigator.language ?? "ko");
}

let current: Locale = initial();
if (typeof document !== "undefined") document.documentElement.lang = current;
const listeners = new Set<() => void>();

export function locale(): Locale {
  return current;
}

export function setLocale(next: Locale): void {
  current = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // not remembered; still switches for this session
  }
  if (typeof document !== "undefined") document.documentElement.lang = next;
  listeners.forEach((f) => f());
}

// Re-renders the caller when the language changes.
export function useLocale(): Locale {
  return useSyncExternalStore((f) => (listeners.add(f), () => listeners.delete(f)), () => current);
}

// The sentence in the current language, with {name} filled from `vars`.
export function t(ko: string, vars?: Record<string, string | number>): string {
  const s = DICTS[current][ko] || ko;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : s;
}
