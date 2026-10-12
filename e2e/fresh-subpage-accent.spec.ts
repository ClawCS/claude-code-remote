import { test, expect } from "@playwright/test";
import { SITEWIDE_DESIGN_CASES } from "./sitewide-design-cases";
import type { WeeklyOfferContent } from "../lib/weekly-publication-types";

test.describe.configure({ mode: "parallel" });
const courses = { bier:"rgb(128, 84, 30)", whiskey:"rgb(128, 82, 55)", mineralwasser:"rgb(0, 111, 134)", saft:"rgb(139, 92, 0)", wein:"rgb(143, 39, 76)", schaumwein:"rgb(126, 101, 44)", likoere:"rgb(168, 27, 68)", rum:"rgb(107, 87, 62)" };
for (const width of [390,1440]) {
  for (const {path} of SITEWIDE_DESIGN_CASES.filter(item=>item.path!=="/")) {
    test(`native fresh palette ${path} at ${width}`, async ({page})=>{
      await page.setViewportSize({width,height:1000});
      await page.emulateMedia({reducedMotion:"reduce"});
      await page.goto(path);
      const main=page.getByRole("main");
      await expect(main).toHaveCSS("background-color","rgb(255, 255, 255)");
      const intro=main.locator("[data-editorial-intro]");
      if(await intro.count()) {
        await expect(intro).toHaveCSS("background-color","rgb(23, 26, 29)");
        await expect(intro.locator("h1")).toHaveCSS("color","rgb(255, 255, 255)");
      }
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
      if(path==="/nl") await expect(main.locator("h1 span")).toHaveCSS("color","rgb(165, 65, 8)");
      if(path==="/gewinnspiel") {
        for (const label of ["Jahresagenda 2026", "Gewinnmomente", "Zum Archiv"]) {
          await expect(intro.getByRole("link",{name:label,exact:true})).toHaveCSS("color","rgb(255, 255, 255)");
        }
      }
      if(path==="/eigenmarke") await expect(main.locator('[data-collection="brands"]')).toHaveCSS("background-color","rgb(33, 30, 28)");
    });
  }
  test(`course accents and complete catalogue focus at ${width}`, async ({page,request})=>{
    await page.setViewportSize({width,height:1000});
    await page.goto("/akademie");
    for(const [slug,color] of Object.entries(courses)) {
      const card=page.locator(`[data-learning="academy"] > div > a[href="/akademie/${slug}"]`);
      await expect(card.locator("img")).toHaveCSS("object-fit","contain");
      await expect(card.locator("div").first()).toHaveCSS("background-color","rgb(255, 255, 255)");
      await expect(card.locator("div > span")).toHaveCSS("color",color);
    }
    await page.goto("/produkte");
    const response=await request.get("/api/content/offers",{headers:{"X-Jammers-Content-Version":"2"}});
    expect(response.ok()).toBe(true);
    const content:WeeklyOfferContent=await response.json();
    const offers=page.locator("[data-offer-id]");
    await expect(offers).toHaveCount(content.offers.length);
    if (content.offers.length) {
      await expect(offers.first()).toHaveCSS("overflow","visible");
      await expect(offers.first().locator("img")).toHaveCSS("object-fit","contain");
      await page.keyboard.press("Tab");
      const imageLink=offers.first().locator(":scope > a");
      await imageLink.focus();
      await expect(imageLink).toHaveCSS("outline-style","solid");
    }
    await page.getByRole("button",{name:"Nederlands",exact:true}).click();
    await expect(offers).toHaveCount(content.offers.filter(offer=>offer.language==="nl").length);
    await page.getByRole("button",{name:"Deutsch",exact:true}).click();
    await expect(offers).toHaveCount(content.offers.filter(offer=>offer.language==="de").length);
  });
}
