import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import AssortmentSection from "@/components/cinematic/AssortmentSection";
import ApplicationForm from "@/components/applications/ApplicationForm";
import { USER_JOB_POSTERS } from "@/data/user-market-photos";

it("makes each real category photograph part of its correctly named destination", () => {
  const html = renderToStaticMarkup(<AssortmentSection />);
  for (const [slug, title, image] of [
    ["bier", "Bier &amp; Fassbier", "bueble-aufbau.webp"],
    ["alkoholfrei", "Alkoholfrei", "spezi-regal.webp"],
    ["wein", "Wein &amp; Sekt", "weinregal.webp"],
    ["spirituosen", "Spirituosen", "baileys-aufbau.webp"],
  ]) {
    const card = html.match(new RegExp(`<a[^>]*href="/kategorie/${slug}"[^>]*>[\\s\\S]*?</a>`))?.[0];
    expect(card, title).toBeDefined();
    expect(card).toContain("<img");
    expect(decodeURIComponent(card!)).toContain(image);
    expect(card).toContain(title);
  }
  expect(html).toContain("Aktuelle Preise und Verfügbarkeit bestätigen wir persönlich.");
});

it("keeps the three full-size job poster destinations and honest disabled contact without redundant captions", () => {
  const html = renderToStaticMarkup(<ApplicationForm />);
  for (const poster of Object.values(USER_JOB_POSTERS)) expect(html).toContain(`href="${poster.src}"`);
  expect(html).not.toContain("Anzeigenmotive – keine Teamfotos.");
  expect(html).not.toContain("Alle Anzeigen lassen sich in voller Größe öffnen.");
  expect(html).toContain("Der Online-Upload ist zurzeit nicht verfügbar.");
  expect(html).toContain("info@trinkgut-jammers.de");
  expect(html).not.toContain('type="file"');
});
