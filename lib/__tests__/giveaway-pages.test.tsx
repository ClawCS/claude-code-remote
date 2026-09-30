import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("server-only", () => ({}));

import GewinnspielPage from "@/app/gewinnspiel/page";
import AktionenArchivPage from "@/app/gewinnspiel/archiv/page";

beforeEach(() => {
  vi.stubEnv("CINEMATIC_E2E", "1");
  vi.stubEnv("CINEMATIC_TEST_NOW", "2026-09-30T12:00:00.000Z");
});
afterEach(() => vi.unstubAllEnvs());

describe("giveaway public pages", () => {
  test("renders the monthly agenda and separate special giveaway with original-post participation", () => {
    const html = renderToStaticMarkup(<GewinnspielPage />);
    expect(html).toContain("Jahresagenda 2026");
    expect(html).toContain("Veltins Helles Lager");
    expect(html).toContain("Guinness");
    expect(html).toContain("Sondergewinnspiel");
    expect(html).toContain("30.09.2026");
    expect(html).toContain("03.10.2026");
    expect(html).toContain("23:59 Uhr");
    expect(html).toContain("https://www.instagram.com/trinkgutjammers_goch/p/DcsoYTBMQLJ/");
    expect(html).toContain("https://www.instagram.com/trinkgutjammers_goch/p/DdQ8_8hsWYB/");
    expect(html).toContain("Noch nicht angekündigt");
    expect(html).toContain("Teilnahme ausschließlich im Originalbeitrag");
    expect(html).not.toMatch(/<form|<img|<svg|<header|<footer|shimmer/i);
  });

  test("closes September at Berlin midnight while leaving the October special open", () => {
    vi.stubEnv("CINEMATIC_TEST_NOW", "2026-09-30T22:00:00.000Z");
    const html = renderToStaticMarkup(<GewinnspielPage />);
    expect(html).toContain('data-giveaway-id="2026-09" data-status="ended"');
    expect(html).toContain('data-giveaway-id="2026-guinness" data-status="active"');
  });

  test("archives ended source-backed actions, not current prizes or invented winners", () => {
    const html = renderToStaticMarkup(<AktionenArchivPage />);
    expect(html).toContain("Gewinnspielarchiv 2026");
    expect(html).toContain("Salitos SUP-Paket");
    expect(html).toContain("Erdinger Sommer-Set");
    expect(html).not.toContain("Veltins Helles Lager");
    expect(html).not.toContain("Guinness");
    expect(html).not.toMatch(/<form|<img|<header|<footer/);
  });

  test("preserves the archive and shows no current action after the year changes", () => {
    vi.stubEnv("CINEMATIC_TEST_NOW", "2027-01-01T00:00:00.000Z");
    const html = renderToStaticMarkup(<GewinnspielPage />);
    expect(html).toContain("Aktuell ist kein belegtes Gewinnspiel offen");
    expect(html).toContain("Jahresagenda 2026");
    expect(html).not.toContain('data-status="active"');
    const archive = renderToStaticMarkup(<AktionenArchivPage />);
    expect(archive).toContain("Veltins Helles Lager");
    expect(archive).toContain("Guinness");
  });
});
