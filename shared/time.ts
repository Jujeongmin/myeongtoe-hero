// Days and weekdays in Korean time (UTC+9), from the server's clock: daily resets at 00:00 KST.
export const KST_OFFSET_MS = 9 * 3600_000;

export function kstDay(ms: number): string {
  return new Date(ms + KST_OFFSET_MS).toISOString().slice(0, 10);
}

export function kstWeekday(ms: number): number {
  return new Date(ms + KST_OFFSET_MS).getUTCDay();
}

export function isSaturday(ms: number): boolean {
  return kstWeekday(ms) === 6;
}
