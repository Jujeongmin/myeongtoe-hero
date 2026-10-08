// Coins flying from fallen monsters to the gold counter: how many are in the air, and a signal each
// time one lands, so the counter can go up when the coins arrive rather than before.
let inFlight = 0;
const landed = new Set<() => void>();

export function coinLaunched(): void {
  inFlight += 1;
}

export function coinLanded(): void {
  inFlight = Math.max(0, inFlight - 1);
  landed.forEach((f) => f());
}

export function coinsInFlight(): number {
  return inFlight;
}

export function onCoinLanded(f: () => void): () => void {
  landed.add(f);
  return () => landed.delete(f);
}
