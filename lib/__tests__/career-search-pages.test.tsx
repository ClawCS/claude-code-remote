import { describe, expect, it } from "vitest";
import sitemap from "@/app/sitemap";
import { CINEMATIC_NAV } from "@/lib/cinematic/site";
import { renderToStaticMarkup } from "react-dom/server";
import PublicJobPage, { generateMetadata } from "@/app/karriere/[slug]/page";

describe("public career discovery preserves private application boundaries", () => {
  it("lists the public index and each real vacancy, but never application states", () => {
    const paths = sitemap().map(entry => new URL(entry.url).pathname);
    expect(paths).toContain("/karriere");
    expect(paths).toContain("/karriere/verkauf-vollzeit");
    expect(paths).toContain("/karriere/verkauf-teilzeit");
    expect(paths).toContain("/karriere/ausbildung");
    expect(paths.some(path => path.startsWith("/bewerbung"))).toBe(false);
  });

  it("takes the existing career navigation entry to the readable public vacancies", () => {
    const discovery = CINEMATIC_NAV.find(item => item.label === "Jammers entdecken");
    expect(discovery && "groups" in discovery && discovery.groups
      .find(group => group.label === "Team & Karriere")?.children
      .some(link => link.href === "/karriere")).toBe(true);
  });

  it("keeps the actual vacancy readable without inventing original posting dates or qualifications", async () => {
    const html = renderToStaticMarkup(await PublicJobPage({ params: Promise.resolve({ slug: "verkauf-teilzeit" }) }));
    const jobs = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
      .map(match => JSON.parse(match[1])).filter(value => value["@type"] === "JobPosting");
    expect(jobs).toHaveLength(0);
    expect(html).toContain("150 Stunden");
    expect(html).toContain("Jurgensstraße 20");
    expect(html).toContain("mailto:info@trinkgut-jammers.de?subject=Bewerbung%20Verkauf%20Teilzeit");
    expect(html).toContain("/images/editorial/user/jobs-teilzeit.webp");
  });

  it("gives a real job its own canonical and rejects unknown job identifiers", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "verkauf-vollzeit" }) });
    expect(metadata.alternates?.canonical).toBe("https://trinkgut-jammers.de/karriere/verkauf-vollzeit");
    expect(metadata.openGraph?.url).toBe("https://trinkgut-jammers.de/karriere/verkauf-vollzeit");
    await expect(PublicJobPage({ params: Promise.resolve({ slug: "unbekannte-stelle" }) })).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  });
});
