import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";
vi.mock("next/link", async () => {
  const React = await import("react");
  return { default: ({ href, children }: { href: string; children: React.ReactNode }) => React.createElement("a", { href }, children) };
});
import AssortmentSection from "@/components/cinematic/AssortmentSection";

test("places real Canva market and gift motifs behind their own relevant rubric links", () => {
  const html = decodeURIComponent(renderToStaticMarkup(<AssortmentSection />));
  expect(html).toContain("/images/editorial/canva/salitos-market.webp");
  expect(html).toContain("/images/editorial/canva/gift-basket.webp");
  expect(html).toContain('href="/geschenkideen"');
  expect(html).toContain('href="/regionale-spirituosen"');
  expect(html).toContain('href="/marktleben"');
  expect(html).not.toContain("almdudler-market");
  expect(html).not.toContain("cdn.canva.com");
  expect(html).not.toContain('href="/#');
});
