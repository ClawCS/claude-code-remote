import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, test } from "vitest";

const root = process.cwd();
const cinematicComponentsDirectory = join(root, "components/cinematic");

const clientIslands = [
  "components/cinematic/FlyerViewer.tsx",
  "components/cinematic/LiveMarketStatus.tsx",
  "components/cinematic/MobileNavigation.tsx",
] as const;

const serverSources = [
  "app/page.tsx",
  "components/cinematic/CinematicHome.tsx",
  "components/cinematic/CinematicHeader.tsx",
  "components/cinematic/HeroSection.tsx",
  "components/cinematic/CurrentSection.tsx",
  "components/cinematic/PeopleSection.tsx",
  "components/cinematic/ServiceSection.tsx",
  "components/cinematic/SpotlightSection.tsx",
  "components/cinematic/ActionsSection.tsx",
  "components/cinematic/InstagramSection.tsx",
  "components/cinematic/LocationFooter.tsx",
] as const;

function absolute(relativePath: string): string {
  return join(root, relativePath);
}

function source(relativePath: string): string | null {
  const file = absolute(relativePath);
  return existsSync(file) ? readFileSync(file, "utf8") : null;
}

function startsWithClientDirective(value: string): boolean {
  return value.startsWith('"use client";');
}

describe("cinematic homepage component boundaries", () => {
  test("allows exactly the three planned Task-4 client islands", () => {
    const actualClientIslands = existsSync(cinematicComponentsDirectory)
      ? readdirSync(cinematicComponentsDirectory)
          .filter((fileName) => fileName.endsWith(".tsx"))
          .map((fileName) => `components/cinematic/${fileName}`)
          .filter((relativePath) => {
            const value = source(relativePath);
            return value !== null && startsWithClientDirective(value);
          })
          .sort()
      : [];

    expect(actualClientIslands).toEqual([...clientIslands].sort());
  });

  test("keeps the root page, composition, header, and every section on the server", () => {
    const missing = serverSources.filter(
      (relativePath) => source(relativePath) === null,
    );
    expect(missing, "all planned Server Component sources must exist").toEqual(
      [],
    );

    for (const relativePath of serverSources) {
      const value = source(relativePath);
      expect(value, `${relativePath} must exist`).not.toBeNull();
      expect(
        startsWithClientDirective(value ?? ""),
        `${relativePath} must remain a Server Component`,
      ).toBe(false);
    }
  });

  test("marks the only root clock as server-only at the first statement", () => {
    const value = source("lib/cinematic/server-clock.ts");

    expect(value, "lib/cinematic/server-clock.ts must exist").not.toBeNull();
    expect(value?.startsWith('import "server-only";')).toBe(true);
  });

  test("keeps the server clock out of every client island", () => {
    const missing = clientIslands.filter(
      (relativePath) => source(relativePath) === null,
    );
    expect(missing, "all planned client-island sources must exist").toEqual([]);

    for (const relativePath of clientIslands) {
      const value = source(relativePath);
      expect(value, `${relativePath} must exist`).not.toBeNull();
      expect(value).not.toMatch(/server-clock/);
    }
  });

  test("resolves one server time and consumes the homepage adapter exactly once", () => {
    const pageSource = source("app/page.tsx");

    expect(pageSource).not.toBeNull();
    expect(pageSource).toContain('export const dynamic = "force-dynamic";');
    expect(pageSource).toContain("export const revalidate = 0;");
    expect(pageSource).toMatch(/const now = resolveHomepageNow\(\);/);
    expect(pageSource).toMatch(
      /const content = await getHomepageContent\(now\);/,
    );
    expect(pageSource?.match(/getHomepageContent\(now\)/g)).toHaveLength(1);
    expect(pageSource).not.toMatch(/new Date\(|Date\.now\(/);
  });
});
