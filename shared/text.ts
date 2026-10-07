// A sentence the game shows that has numbers or names in it: a Korean pattern with {name} slots
// and the values for them. shared/ never translates; the client shows it as t(key, vars) (the
// pattern is the translation key), and the server and tools fill it in Korean with fill().
export type TextVars = Record<string, string | number>;

export interface Text {
  key: string;
  vars?: TextVars;
}

export function fill({ key, vars }: Text): string {
  return vars ? key.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : key;
}
