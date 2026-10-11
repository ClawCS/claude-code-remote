import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";

const proof=process.env.AUDIT_SCREENSHOT_DIR??".superpowers/sdd/2026-10-11-nl-publication-streams/screenshots";

for(const width of [390,768,1440]) for(const landing of ["home","nl","index","handzettel"]) {
  test(`[fixture] ${landing} main pair and separate supplement at ${width}px`,async({page})=>{
    await page.setViewportSize({width,height:1000});
    await page.goto(`/test-fixtures/weekly-flyer?landing=${landing}&state=active`);
    const main=page.locator('[data-flyer-group="weekly"]'), supplemental=page.locator('[data-flyer-group="supplemental"]');
    await expect(main.locator("article")).toHaveCount(2);await expect(supplemental.locator("article")).toHaveCount(1);
    await expect(supplemental).toContainText(landing==="nl"?"Aanvullende advertenties":"Zusätzliche Anzeigen");
    await expect(supplemental).toContainText("07.–18.10.2026");
    const [a,b,s]=await Promise.all([main.locator("article").nth(0).boundingBox(),main.locator("article").nth(1).boundingBox(),supplemental.boundingBox()]);
    if(width>=768) expect(a!.y).toBeCloseTo(b!.y,0);else expect(b!.y).toBeGreaterThan(a!.y+a!.height);
    expect(s!.y).toBeGreaterThanOrEqual(Math.max(a!.y+a!.height,b!.y+b!.height));
    for(const article of await page.locator('article:has([data-flyer-viewer])').all()) {
      const image=article.locator("img");await image.scrollIntoViewIfNeeded();
      await expect.poll(()=>image.evaluate(el=>(el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
      await expect(image).toHaveCSS("object-fit","contain");
      const trigger=article.getByRole("button");await expect(trigger).toBeEnabled();
      await trigger.focus();await page.keyboard.press("Enter");
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByRole("dialog").getByRole("button")).toBeFocused();
      await page.keyboard.press("Escape");await expect(page.getByRole("dialog")).toHaveCount(0);await expect(trigger).toBeFocused();
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    mkdirSync(proof,{recursive:true});await page.screenshot({path:`${proof}/task4-${landing}-${width}.png`,fullPage:true});
  });
}

test("[fixture] a supplement never hides the missing Dutch weekly notice and main-only has no empty extra section",async({page})=>{
  await page.goto("/test-fixtures/weekly-flyer?landing=nl&state=missing-nl");
  await expect(page.getByRole("status")).toContainText("Nederlandse weekfolder is nog niet beschikbaar");
  await expect(page.locator('[data-flyer-group="weekly"] article')).toHaveCount(1);
  await expect(page.locator('[data-flyer-group="supplemental"] article')).toHaveCount(1);
  await page.goto("/test-fixtures/weekly-flyer?landing=nl&state=main-only");
  await expect(page.locator('[data-flyer-group="supplemental"]')).toHaveCount(0);
  await page.goto("/test-fixtures/weekly-flyer?landing=nl&state=expired");
  await expect(page.locator("[data-flyer-viewer]")).toHaveCount(0);
});

test("[fixture] catalogue preserves distinct conditions, language filters and name search",async({page})=>{
  await page.goto("/test-fixtures/weekly-flyer?landing=products&state=active");
  await expect(page.locator("[data-offer-id]")).toHaveCount(3);
  await page.getByRole("button",{name:"Nederlands",exact:true}).click();await expect(page.locator("[data-offer-id]")).toHaveCount(2);
  const supplemental=page.locator('[data-offer-id="synthetic-maasduinen-offer"]');
  await expect(supplemental).toContainText("Maasduinen · Zusatzanzeige");
  await supplemental.locator("summary").click();await expect(supplemental).toContainText("Synthetische Zusatzbedingung");
  const search=page.getByRole("textbox");await search.fill("nicht vorhanden");await expect(page.locator("[data-offer-id]")).toHaveCount(0);
  await search.fill("Montagsangebot");await expect(page.locator("[data-offer-id]")).toHaveCount(2);
});
