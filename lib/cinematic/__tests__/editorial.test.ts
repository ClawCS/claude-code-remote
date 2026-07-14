import { describe, expect, test } from "vitest";

import {
  EDITORIAL_IMAGES,
  INSTAGRAM_SELECTION,
  PEOPLE_STORY,
  RENTAL_HIGHLIGHTS,
  RENTAL_SOURCES,
  SERVICE_ITEMS,
  SPOTLIGHT_POSTERS,
} from "@/data/cinematic-editorial";

describe("cinematic editorial contract", () => {
  test("locks the approved poster order and evidence labels", () => {
    expect(SPOTLIGHT_POSTERS.map(({ number, name }) => [number, name])).toEqual([
      ["01", "Pralle Kirsche"],
      ["02", "Schwarzer Teufel"],
      ["03", "Caramello"],
    ]);
    expect(
      SPOTLIGHT_POSTERS.every(
        ({ label, href }) => label === "Originalposter" && href === "/eigenmarke",
      ),
    ).toBe(true);
  });

  test("keeps the approved people story local, unique, and release-gated", () => {
    expect(PEOPLE_STORY).toHaveLength(5);
    expect(new Set(PEOPLE_STORY.map(({ id }) => id)).size).toBe(5);
    for (const item of PEOPLE_STORY) {
      expect(item.alt.length).toBeGreaterThan(12);
      expect(item.reviewedAt).toBe("2026-07-14");
      expect(item.releaseBasis).toBe(
        "user-approved-local-employee-pool-2026-07-14",
      );
    }
    expect(EDITORIAL_IMAGES.jasmin.caption).toBe("Jasmin · Team Jammers");
    expect(EDITORIAL_IMAGES.gabriella.caption).toBe(
      "Gabriella · Team Jammers",
    );
  });

  test("does not fabricate a dated Instagram feed", () => {
    expect(INSTAGRAM_SELECTION).toEqual([]);
  });

  test("uses the sourced rental price and inventory facts", () => {
    expect(RENTAL_HIGHLIGHTS).toEqual([
      { name: "Kühlanhänger", price: "150 €", stock: 3 },
      { name: "Kühltruhe", price: "35 €", stock: 4 },
      { name: "Stehtisch", price: "12 €", stock: 20 },
      { name: "Zapfanlage", price: "25 €", stock: 3 },
      { name: "Bierzeltgarnitur", price: "15 €", stock: 13 },
    ]);
    expect(RENTAL_SOURCES).toEqual({
      price: { label: "Leihartikel-Preisliste", asOf: "01.01.2026" },
      inventory: { label: "Bestandsprüfung", asOf: "06.03.2026" },
    });
    expect(JSON.stringify(RENTAL_SOURCES)).not.toContain("Preislisten/");
    expect(JSON.stringify(RENTAL_SOURCES)).not.toContain("href");
  });

  test("limits service promises to the three explicitly confirmed services", () => {
    expect(SERVICE_ITEMS).toEqual([
      {
        number: "01",
        title: "Persönliche Beratung",
        text: "Direkter Kontakt mit dem Team im Markt.",
        href: "/kontakt",
      },
      {
        number: "02",
        title: "Partybedarf",
        text: "Partybedarf bei Trinkgut Jammers in Goch.",
        href: "/partyplaner",
      },
      {
        number: "03",
        title: "Vermietung",
        text: "Mietartikel anfragen und Verfügbarkeit bestätigen lassen.",
        href: "/vermietung",
      },
    ]);
  });

  test("deep-freezes every exported collection and nested record", () => {
    for (const value of [
      EDITORIAL_IMAGES,
      PEOPLE_STORY,
      INSTAGRAM_SELECTION,
      SPOTLIGHT_POSTERS,
      SERVICE_ITEMS,
      RENTAL_HIGHLIGHTS,
      RENTAL_SOURCES,
    ]) {
      expect(Object.isFrozen(value)).toBe(true);
    }
    expect(Object.values(EDITORIAL_IMAGES).every(Object.isFrozen)).toBe(true);
    expect(
      [...SPOTLIGHT_POSTERS, ...SERVICE_ITEMS, ...RENTAL_HIGHLIGHTS].every(
        Object.isFrozen,
      ),
    ).toBe(true);
    expect(Object.values(RENTAL_SOURCES).every(Object.isFrozen)).toBe(true);
  });
});
