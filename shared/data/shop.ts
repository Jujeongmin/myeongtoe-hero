import { cloneState, type GameState } from "../state";
import { fill, type Text } from "../text";
import { kstDay } from "../time";

// VX 상품 (sold through the Verse8 VX Shop; what is bought arrives on the server's
// $onItemPurchased and goes through grantPurchase). The prices here are fallbacks: the shop's
// listed price wins. tools/vx-sheet.ts builds the dashboard registration sheet from this table.
export type ProductKind = "repeat" | "once" | "timed";

export interface Product {
  id: string;
  // What the game shows, as patterns for t() (shared/text.ts). nameKo and textKo are the same in
  // Korean, for the server and the VX dashboard.
  name: Text;
  text: Text;
  nameKo: string;
  nameEn: string;
  textKo: string;
  textEn: string;
  vx: number;
  kind: ProductKind;
  gems?: number;
  tickets?: number;
  coupons?: number;
  // 승진 패키지: the best floor that opens it.
  floor?: number;
}

const DAY_MS = 24 * 3600_000;
export const ROOKIE_DAYS = 7;
export const PASS_DAYS = 30;
export const PREMIUM_DAILY_GEMS = 100;
export const PASS_DAILY_GEMS = 300;
export const PREMIUM_OFFLINE_SEC = 4 * 3600;

// The shown name and text, and the same filled in Korean.
const ko = (name: Text, text: Text) => ({ name, text, nameKo: fill(name), textKo: fill(text) });

const gemPack = (id: string, vx: number, gems: number, name: string, labelEn: string): Product => ({
  id, vx, gems, kind: "repeat",
  ...ko({ key: name }, { key: "보석 {n}개", vars: { n: gems.toLocaleString("en-US") } }),
  nameEn: `Gem ${labelEn}`, textEn: `${gems.toLocaleString("en-US")} gems`,
});

const promo = (floor: number, vx: number, gems: number, tickets: number, coupons: number): Product => ({
  id: `pack_promo_${floor}`, vx, gems, tickets, coupons, floor, kind: "once",
  ...ko(
    { key: "승진 패키지 {floor}층", vars: { floor } },
    { key: "{floor}층 도달 기념: 보석 {gems}, 응시권 {tickets}, 상품권 {coupons}", vars: { floor, gems, tickets, coupons } },
  ),
  nameEn: `Promotion Pack ${floor}F`,
  textEn: `For reaching floor ${floor}: ${gems} gems, ${tickets} exam tickets, ${coupons} coupons`,
});

export const PRODUCTS: readonly Product[] = [
  gemPack("gems_xs", 100, 120, "보석 한 줌", "Handful"),
  gemPack("gems_s", 500, 650, "보석 주머니", "Pouch"),
  gemPack("gems_m", 1_000, 1_400, "보석 봉투", "Envelope"),
  gemPack("gems_l", 3_000, 4_500, "보석 서류가방", "Briefcase"),
  gemPack("gems_xl", 5_000, 8_000, "보석 금고", "Safe"),
  gemPack("gems_xxl", 10_000, 17_000, "보석 본사 금고", "HQ Vault"),
  {
    id: "pack_rookie", vx: 500, kind: "once", gems: 1_000, tickets: 5_000, coupons: 300,
    ...ko({ key: "신입 패키지" }, { key: "시작 {days}일 안 1회: 보석 1,000, 응시권 5,000, 상품권 300", vars: { days: ROOKIE_DAYS } }),
    nameEn: "Rookie Pack",
    textEn: `Once, within ${ROOKIE_DAYS} days of starting: 1,000 gems, 5,000 exam tickets, 300 coupons`,
  },
  {
    id: "premium", vx: 1_000, kind: "once",
    ...ko({ key: "프리미엄" }, { key: "광고 없이 보상, 버프 3종 항상 켜짐, 오프라인 +4시간, 매일 보석 {gems}", vars: { gems: PREMIUM_DAILY_GEMS } }),
    nameEn: "Premium",
    textEn: `Ad rewards without ads, all 3 buffs always on, +4 h offline, ${PREMIUM_DAILY_GEMS} gems daily`,
  },
  {
    id: "pass_salary", vx: 1_000, kind: "timed",
    ...ko(
      { key: "월급 통장" },
      { key: "{days}일 동안 매일 보석 {gems} (다시 사면 {days}일 연장)", vars: { days: PASS_DAYS, gems: PASS_DAILY_GEMS } },
    ),
    nameEn: "Salary Account",
    textEn: `${PASS_DAILY_GEMS} gems daily for ${PASS_DAYS} days (buying again adds ${PASS_DAYS} days)`,
  },
  promo(100, 500, 500, 1_000, 200),
  promo(300, 1_000, 1_000, 30_000, 400),
  promo(500, 1_500, 1_500, 300_000, 600),
  promo(1000, 2_000, 2_000, 5_000_000, 1_000),
];

const BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]));

export function findProduct(id: string): Product | undefined {
  return BY_ID.get(id);
}

// Whether the shop should offer it now (what was bought once already, or a pack not yet open, is
// not offered).
export function productOffered(s: GameState, p: Product, now = s.lastTick): boolean {
  if (p.id === "pack_rookie") return !s.vx.rookie && now < s.startedAt + ROOKIE_DAYS * DAY_MS;
  if (p.id === "premium") return !s.vx.premium;
  if (p.floor !== undefined) return s.bestFloor >= p.floor && !s.vx.promos.includes(p.id);
  return true;
}

// What a completed purchase gives. The platform has already taken the VX, so this never refuses:
// a one-off bought twice (two dialogs open at once) still pays its contents.
export function grantPurchase(state: GameState, productId: string, quantity: number, now: number): GameState {
  const p = findProduct(productId);
  if (!p) throw new Error(`unknown product ${productId}`);
  const s = cloneState(state);
  const n = Math.max(1, Math.floor(quantity));
  s.gems += (p.gems ?? 0) * n;
  s.tickets += (p.tickets ?? 0) * n;
  s.coupons += (p.coupons ?? 0) * n;
  s.vx = { ...s.vx, total: s.vx.total + p.vx * n };
  if (p.id === "pack_rookie") s.vx.rookie = true;
  if (p.id === "premium") s.vx.premium = true;
  if (p.id === "pass_salary") s.vx.passUntil = Math.max(s.vx.passUntil, now) + PASS_DAYS * DAY_MS * n;
  if (p.floor !== undefined && !s.vx.promos.includes(p.id)) s.vx.promos = [...s.vx.promos, p.id];
  return s;
}

// The daily VX gems claimable today: 프리미엄 and a running 월급 통장.
export function dailyVxGems(s: GameState): number {
  return (s.vx.premium ? PREMIUM_DAILY_GEMS : 0) + (s.vx.passUntil > s.lastTick ? PASS_DAILY_GEMS : 0);
}

export function dailyVxClaimed(s: GameState): boolean {
  return s.vx.dailyClaimed === kstDay(s.lastTick);
}
