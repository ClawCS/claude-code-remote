import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
vi.mock("server-only", () => ({}));
import MarktlebenPage from "@/app/marktleben/page";
import GewinnspielPage from "@/app/gewinnspiel/page";
import BewerbungPage from "@/app/bewerbung/page";
import { USER_MARKET_PHOTOS, USER_JOB_POSTERS, PRIZE_HANDOVER_PHOTOS } from "@/data/user-market-photos";
import { APPLICATION_FALLBACK } from "@/lib/applications-client";
const render = (page: () => React.ReactNode) => decodeURIComponent(renderToStaticMarkup(page()));

test("all nine new market motifs sit in descriptive groups, with full poster links", () => {
  const html = render(MarktlebenPage);
  for (const p of Object.values(USER_MARKET_PHOTOS)) expect(html).toContain(p.src);
  for (const title of ["Bier &amp; Braukunst", "Wein entdecken", "Alkoholfrei", "Entdeckungen im Markt", "Gasflaschen tauschen"]) expect(html).toContain(title);
  for (const p of [USER_MARKET_PHOTOS.salitosPoster, USER_MARKET_PHOTOS.liefmansPoster, USER_MARKET_PHOTOS.gasExchange]) expect(html).toContain(`href="${p.src}"`);
  expect(html).not.toMatch(/<figcaption|\/Users\/|tcg-regal|IMG_7783|IMG_4853/);
});

test("confirmed gas poster is not described as expired photographic prices", () => {
  const html = render(MarktlebenPage);
  expect(html).toMatch(/Auf den Marktaufnahmen sichtbare Preise[^<]*nicht aktuell/);
  const gas = html.match(/<section[^>]*aria-labelledby="gasflaschen-tauschen"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  expect(gas).toBeDefined();
  expect(gas).toContain("gasflaschen-tausch.webp");
  expect(gas).toContain("14,99"); expect(gas).toContain("25,99");
  expect(gas).not.toMatch(/nicht aktuell|5 kg|11 kg|KW\s*\d+/);
});

test("five full-frame prize handovers remain separate from dated contest agenda", () => {
  const html = render(GewinnspielPage);
  const gallery = html.match(/<section id="gewinnmomente"[^>]*>([\s\S]*?)<\/section>/)?.[1];
  expect(gallery).toBeDefined();
  expect(gallery).toContain("Gewinnmomente im Markt");
  expect([...gallery!.matchAll(/<img\b/g)]).toHaveLength(5);
  for (const p of PRIZE_HANDOVER_PHOTOS) expect(gallery).toContain(p.src);
  expect(gallery).not.toMatch(/data-month|Monatsgewinn|Teilnahmeschluss|2026/);
  expect(html.indexOf('id="gewinnmomente"')).toBeGreaterThan(html.indexOf('id="jahresagenda"'));
  expect(html.slice(0, html.indexOf('id="gewinnmomente"'))).not.toContain("gewinnuebergabe-");
});

test("all three complete job posters are visible without opening an unready upload or adding API roles", () => {
  const html = render(BewerbungPage);
  for (const p of Object.values(USER_JOB_POSTERS)) {
    expect(html).toContain(p.src); expect(html).toContain(`href="${p.src}"`);
  }
  expect(html).toContain("Ausbildung im Getränkehandel / Einzelhandel (m/w/d)");
  expect(html).toContain('href="mailto:info@trinkgut-jammers.de?subject=Bewerbung%20Ausbildung"'.replaceAll("%20", " "));
  expect(html).toContain("KI-generierte Anzeigenmotive");
  expect(html).not.toContain('<input type="file"');
  expect(APPLICATION_FALLBACK.jobs.map(job => job.id)).toEqual(["sales-fulltime", "sales-parttime"]);
});

test("release source allowlist includes sanitized user images, not desktop originals", () => {
  const runbook = readFileSync("docs/DEPLOYMENT-RUNBOOK.md", "utf8");
  const archive = runbook.slice(runbook.indexOf("git archive"), runbook.indexOf("git archive") + 700);
  expect(archive).toContain("assets/source/user-market-photos");
  expect(archive).not.toContain("Fotos Homepage");
});
