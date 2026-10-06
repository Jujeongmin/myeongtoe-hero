import { describe, expect, test } from "vitest";
import { CERTS, certBonuses, certDrawCost, certLevelCost, certTierOpen, findCert } from "./data/certs";
import { settle } from "./settle";
import { OFFLINE_CAP_SEC, newState } from "./state";
import { heroPower, offlineCapSec } from "./stats";

describe("certificate table", () => {
  test("40 certificates: 15 / 15 / 10 by tier, unique ids", () => {
    expect(CERTS).toHaveLength(40);
    expect(new Set(CERTS.map((c) => c.id)).size).toBe(40);
    expect(CERTS.filter((c) => c.tier === 1)).toHaveLength(15);
    expect(CERTS.filter((c) => c.tier === 2)).toHaveLength(15);
    expect(CERTS.filter((c) => c.tier === 3)).toHaveLength(10);
    expect(findCert("c00")).toBe(CERTS[0]);
    expect(findCert("c40")).toBeUndefined();
  });

  test("higher tiers give less per ticket", () => {
    const perTicket = (tier: 1 | 2 | 3) => {
      const c = CERTS.find((x) => x.tier === tier && x.kind === "atk")!;
      return c.perLevel / certLevelCost(c, 1);
    };
    expect(perTicket(1)).toBeGreaterThan(perTicket(2));
    expect(perTicket(2)).toBeGreaterThan(perTicket(3));
  });

  test("draws cost more as you own more, tiers open at 10 and 25", () => {
    expect(certDrawCost(0)).toBe(1);
    expect(certDrawCost(7)).toBe(8);
    expect(certTierOpen(9)).toBe(1);
    expect(certTierOpen(10)).toBe(2);
    expect(certTierOpen(25)).toBe(3);
  });
});

describe("certificate effects", () => {
  test("bonuses add up per kind", () => {
    const atk = CERTS.find((c) => c.tier === 1 && c.kind === "atk")!;
    expect(certBonuses({ [atk.id]: 3 }).atk).toBeCloseTo(atk.perLevel * 3, 12);
    expect(certBonuses({}).gold).toBe(0);
  });

  test("they reach Park's power and the offline cap", () => {
    const atk = CERTS.find((c) => c.tier === 1 && c.kind === "atk")!;
    const s = newState(0);
    const base = heroPower(s).dps.toNumber();
    s.certs[atk.id] = 10;
    expect(heroPower(s).dps.toNumber()).toBeCloseTo(base * (1 + atk.perLevel * 10), 6);

    const off = CERTS.find((c) => c.tier === 1 && c.kind === "offline")!;
    const t = newState(0);
    t.certs[off.id] = 6;
    expect(offlineCapSec(t)).toBe(OFFLINE_CAP_SEC + off.perLevel * 6);
    const capped = settle(newState(0), OFFLINE_CAP_SEC * 2000);
    const longer = settle(t, OFFLINE_CAP_SEC * 2000);
    expect(longer.gold.cmp(capped.gold)).toBe(1);
  });
});
