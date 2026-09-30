import { expect, test } from "./test-fixtures";
import type { Page } from "@playwright/test";

async function expectStaticPosters(page: Page) {
  const root=page.locator("[data-cinematic-root]");
  await expect(root).toHaveAttribute("data-motion-state","static");
  await expect(root).toHaveAttribute("data-motion-controller-count","0");
  await expect(root).toHaveAttribute("data-motion-trigger-count","0");
  await expect(page.locator(".pin-spacer")).toHaveCount(0);
  const rail=root.locator('[data-rail="cinematic"]');
  await expect(rail).toHaveCSS("display","grid");
  await expect(rail).toHaveCSS("transform","none");
  await expect(rail.locator("figure")).toHaveCount(3);
}

test("desktop posters remain in normal flow while scrolling",async({page})=>{
  await page.setViewportSize({width:1440,height:900});await page.goto("/");
  await expectStaticPosters(page);
  await page.locator("#eigenmarken").scrollIntoViewIfNeeded();
  await page.mouse.wheel(0,600);
  await expectStaticPosters(page);
  await expect(page.locator("#eigenmarken")).not.toHaveCSS("position","fixed");
});
test("mobile posters retain all three product links",async({page})=>{
  await page.setViewportSize({width:390,height:844});await page.goto("/");
  await expectStaticPosters(page);
  for(const name of ["Pralle Kirsche","Schwarzer Teufel","Caramello"]) await expect(page.getByRole("link",{name:new RegExp(name)})).toBeVisible();
});
test("reduced motion disables the poster hover lift",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});await page.goto("/");
  const poster=page.locator('#eigenmarken img').first();
  await page.locator('#eigenmarken a').first().hover();
  await expect(poster).toHaveCSS("transform","none");await expectStaticPosters(page);
});
test("all posters and links work without JavaScript",async({browser,baseURL})=>{
  const context=await browser.newContext({javaScriptEnabled:false});
  try {const page=await context.newPage();await page.goto(new URL("/",baseURL).href);await expectStaticPosters(page);
    for(const name of ["Pralle Kirsche","Schwarzer Teufel","Caramello"]) await expect(page.getByRole("link",{name:new RegExp(name)})).toBeVisible();
  } finally {await context.close();}
});
test("navigation leaves no motion artifacts on other pages",async({page})=>{
  await page.goto("/");await expectStaticPosters(page);await page.locator('footer a[href="/kontakt"]').click();
  await expect(page).toHaveURL(/\/kontakt$/);await expect(page.locator(".pin-spacer")).toHaveCount(0);
  await page.getByRole("link",{name:"Home",exact:true}).first().click();await expectStaticPosters(page);
});
test("viewport and motion preference changes keep the same usable static layout",async({page})=>{
  await page.goto("/");
  for(const width of [1440,390,1024,1280]){
    await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:"reduce"});await expectStaticPosters(page);
    await page.emulateMedia({reducedMotion:"no-preference"});await expectStaticPosters(page);
  }
});
