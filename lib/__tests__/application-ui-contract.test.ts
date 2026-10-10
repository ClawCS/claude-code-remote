import { expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import BewerbungPage from "@/app/bewerbung/page";
import { metadata } from "@/app/bewerbung/layout";
import sitemap from "@/app/sitemap";
import nextConfig from "@/next.config";
import DatenschutzPage from "@/app/datenschutz/page";
import GaleriePage from "@/app/galerie/page";
import LocationFooter from "@/components/cinematic/LocationFooter";
import ApplicationForm from "@/components/applications/ApplicationForm";
import { APPLICATION_FALLBACK } from "@/lib/applications-client";
import { GET } from "@/app/api/bewerbung/config/route";
import { POST } from "@/app/api/bewerbung/route";
// This assertion checks route links, not Next's asset import transformation.
vi.mock("next/image",()=>({default:()=>null}));

it("offers both approved jobs and the fixed contact in the safe initial HTML", () => {
  const html = renderToStaticMarkup(BewerbungPage());
  expect(html).toContain("Verkauf Vollzeit (m/w/d)");
  expect(html).toContain("150 Stunden/Monat");
  expect(html).toContain("info@trinkgut-jammers.de");
  expect(html).not.toContain("mailto:jammers-goch@trinkgut.de");
  expect(html).not.toContain('<input type="file"');
  expect(html).not.toContain("Bewerbungsdateien hochgeladen oder gespeichert");
});
it.each(["Vollzeit", "Teilzeit"])("offers a role-specific email action for %s before upload readiness", (role) => {
  const html = renderToStaticMarkup(BewerbungPage());
  expect(html).toMatch(new RegExp(`href="mailto:info@trinkgut-jammers\\.de\\?subject=Bewerbung%20Verkauf%20${role}"[^>]*>Per E-Mail für ${role} bewerben</a>`));
});
it("explains conditional portal processing, voluntary files and honest copy limits", () => {
  const html=renderToStaticMarkup(DatenschutzPage());
  expect(html).toContain('id="bewerbungen"');
  expect(html).toContain("sechs Kalendermonate");
  expect(html).toContain("IONOS");
  expect(html).toContain("bereits zugangsberechtigten");
  expect(html).toContain("nicht automatisch");
  expect(html).not.toContain("keine Gewinnspielteilnahmen oder Bewerbungsdateien");
});
it("never promotes static props to runtime readiness and keeps the Next POST closed",async()=>{
  expect(renderToStaticMarkup(createElement(ApplicationForm,{config:{...APPLICATION_FALLBACK,enabled:true,mode:"enabled"}}))).not.toContain('<input');
  const response=GET();expect(response.status).toBe(200);expect(await response.json()).toEqual(APPLICATION_FALLBACK);expect(response.headers.get("cache-control")).toContain("no-store");
  expect(POST(new Request("http://synthetic.invalid/api/bewerbung",{method:"POST"})).status).toBe(503);
});
it("keeps jobs human-discoverable in the existing footer and team page", () => {
  expect(renderToStaticMarkup(LocationFooter())).toContain('href="/bewerbung"');
  expect(renderToStaticMarkup(GaleriePage())).toContain('href="/bewerbung"');
});
it("keeps sensitive application routes out of indexing without hiding their human entry", () => {
  expect(metadata.robots).toMatchObject({ index: false, follow: false });
  expect(sitemap().some(row => new URL(row.url).pathname.startsWith("/bewerbung"))).toBe(false);
});
it("applies sensitive headers to the public form and both application API trees", async () => {
  const rules = await nextConfig.headers!();
  for (const source of ["/bewerbung/:path*", "/api/bewerbung/:path*", "/api/bewerbungsverwaltung/:path*"]) {
    const rule = rules.find(row => row.source === source);
    expect(rule?.headers).toEqual(expect.arrayContaining([
      { key: "Cache-Control", value: "private, no-store" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
    ]));
  }
});
