import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import AkademiePage from "@/app/akademie/page";
import ZertifikatePage, { metadata } from "@/app/akademie/zertifikate/page";

describe("external academy information", () => {
  it("describes the actual seventeen provider links without promising universal bookability", () => {
    const overview = renderToStaticMarkup(createElement(AkademiePage));
    const catalogue = renderToStaticMarkup(createElement(ZertifikatePage));
    expect(catalogue.match(/target="_blank" rel="noopener noreferrer"/g)).toHaveLength(17);
    expect(overview).toContain("17 Weiterbildungshinweise");
    expect(catalogue).toContain("17 Weiterbildungshinweise");
    expect(`${overview} ${catalogue} ${metadata.description}`).not.toMatch(/16 buchbare|alle buchbaren/);
    expect(catalogue.match(/Informationen beim Anbieter/g)).toHaveLength(17);
  });

  it("links the Doemens distillate course with its two provider-listed weeks and fee", () => {
    const catalogue = renderToStaticMarkup(createElement(ZertifikatePage));
    expect(catalogue).toContain('href="https://doemens.org/weiterbildungen/seminar-destillat-sommelier/"');
    expect(catalogue).toContain("Destillat-Sommelier (Doemens)");
    expect(catalogue).toContain("24.–28.05.2027");
    expect(catalogue).toContain("12.–16.07.2027");
    expect(catalogue).toContain("3.200 EUR");
    expect(catalogue).not.toContain('href="https://doemens.org/aktuelles/weiterbildung/"');
  });
});
