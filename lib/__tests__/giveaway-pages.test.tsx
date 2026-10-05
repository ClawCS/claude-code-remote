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
    expect(html).not.toMatch(/<form|<iframe|<svg|<header|<footer|shimmer/i);
    for (const id of ["2026-01", "2026-02", "2026-04", "2026-05", "2026-06", "2026-07"]) {
      expect(html).toContain(`data-giveaway-cover="${id}"`);
      expect(decodeURIComponent(html)).toContain(`/images/editorial/canva/giveaway-${id}.webp`);
    }
    expect(html).not.toMatch(/giveaway-2026-(?:11|12)\.webp/);
    const currentActions = html.match(/<section id="aktuell"[\s\S]*?<\/section>/)?.[0];
    expect(currentActions).toBeDefined();
    expect(currentActions).not.toContain('data-giveaway-id="2026-10"');
    expect(currentActions).not.toContain('data-giveaway-id="2026-disaronno"');
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
    expect(html).not.toMatch(/<form|<iframe|<header|<footer/);
    for (const id of ["2026-01", "2026-02", "2026-04", "2026-05", "2026-06", "2026-07", "2026-easter", "2026-faxe", "2026-wm"]) {
      expect(html).toContain(`data-giveaway-cover="${id}"`);
    }
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

  test("shows both October original covers as current and keeps the four older Instagram covers in the archive", () => {
    vi.stubEnv("CINEMATIC_TEST_NOW", "2026-10-05T10:00:00.000Z");
    const html = renderToStaticMarkup(<GewinnspielPage />);
    const currentActions = html.match(/<section id="aktuell"[\s\S]*?<\/section>/)?.[0];
    expect(currentActions).toBeDefined();
    for (const id of ["2026-10", "2026-disaronno"]) {
      expect(currentActions).toContain(`data-giveaway-id="${id}" data-status="active"`);
      expect(currentActions).toContain(`data-giveaway-cover="${id}"`);
    }
    const archive = renderToStaticMarkup(<AktionenArchivPage />);
    for (const id of ["2026-03", "2026-08", "2026-09", "2026-guinness"]) {
      expect(currentActions).not.toContain(`data-giveaway-id="${id}"`);
      expect(archive).toContain(`data-giveaway-id="${id}" data-status="ended"`);
      expect(archive).toContain(`data-giveaway-cover="${id}"`);
    }
    expect(archive).not.toContain('data-giveaway-id="2026-10"');
    expect(archive).not.toContain('data-giveaway-id="2026-disaronno"');
  });
});
