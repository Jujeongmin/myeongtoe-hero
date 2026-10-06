// mulberry32: tiny and deterministic, the same on the server and every client. The seed lives in
// the save and moves on with each draw, so the client predicts exactly the draw the server makes.
export function nextRandom(seed: number): { value: number; seed: number } {
  const next = (seed + 0x6d2b79f5) >>> 0;
  let r = Math.imul(next ^ (next >>> 15), 1 | next);
  r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
  return { value: ((r ^ (r >>> 14)) >>> 0) / 4294967296, seed: next };
}
