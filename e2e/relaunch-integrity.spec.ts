import { expect, test } from "./test-fixtures";

for (const width of [320,667,1023,1024,1025,1279,1280,1281]) test(`responsive controls do not clip at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:width === 667 ? 375 : 900});await page.goto("/");await page.evaluate(()=>document.fonts.ready);
  const errors=await page.locator('#sortiment a, header a:visible, header summary:visible, [data-hero="cinematic"] h1').evaluateAll(nodes=>nodes.filter(node=>{const r=node.getBoundingClientRect();return r.left < -1 || r.right > window.innerWidth+1 || node.scrollWidth > node.clientWidth+2;}).map(node=>node.textContent));
  expect(errors).toEqual([]);
  if (width < 1024) {
    await page.getByRole("button",{name:"Menü öffnen"}).click();
    const panel=page.getByRole("navigation",{name:"Mobile Navigation"});
    await expect(panel.getByRole("link",{name:"Kontakt",exact:true})).toBeVisible();
    await panel.getByRole("link",{name:"Kontakt",exact:true}).focus();
    await expect(panel.getByRole("link",{name:"Kontakt",exact:true})).toBeInViewport();
  }
});

test("GrailBid bridge is explicit and safe",async({page})=>{
  await page.goto("/");const link=page.locator('#grailbid a');await expect(link).toHaveAttribute("href","https://grailbid.com");await expect(link).toHaveAttribute("target","_blank");await expect(link).toHaveAttribute("rel","noopener noreferrer");await expect(page.locator("#grailbid")).toContainText("im Aufbau");
});

test("paused collection endpoints reject input without server-side processing",async({request})=>{
  const configResponse=await request.get("/api/bewerbung/config");expect(configResponse.status()).toBe(200);
  const {validateApplicationConfig}=await import("../lib/applications-client");
  const config=validateApplicationConfig(await configResponse.json());expect(config).not.toBeNull();
  expect(config?.mode==="disabled" ? !config.enabled : config?.mode==="pilot" ? !config.enabled : true).toBe(true);
  const application=await request.post("/api/bewerbung");expect(application.status()).toBe(config?.mode==="disabled"?503:403);expect(application.headers()["cache-control"]).toContain("no-store");
  for(const route of ["community","chat","kuehlschrank","leergut-scan"]){const response=await request.post(`/api/${route}`,{data:{name:"TEST",text:"TEST"}});expect(response.status(),route).toBe(503);expect(response.headers()["cache-control"]).toBe("no-store");}
  for(const route of ["/api/handzettel/cron","/api/handzettel/fetch"]){const response=await request.post(route,{data:{}});expect([401,503],route).toContain(response.status());expect(response.headers()["cache-control"]).toBe("no-store");}
});

test("legacy flyer metadata is deprecated and Dutch viewer controls are translated",async({page,request})=>{
  const manifest=await request.get("/handzettel/manifest.json");expect(manifest.status()).toBe(200);
  expect(await manifest.json()).toMatchObject({deprecated:true,de:[],nl:[],currentIndex:"/api/content/flyers"});
  expect(manifest.headers()["x-robots-tag"]).toContain("noindex");
  const archive=await request.head("/handzettel/extracted/kw19/de/franziskaner-weissbier.webp");
  expect(archive.status()).toBe(200);expect(archive.headers()["x-robots-tag"]).toContain("noindex");
  await page.goto("/nl");
  await expect(page.getByRole("button",{name:"Folder bekijken",exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"Handzettel ansehen",exact:true})).toHaveCount(0);
  await page.getByRole("button",{name:"Folder bekijken",exact:true}).click();
  await expect(page.getByRole("button",{name:"Folder sluiten",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Folder sluiten",exact:true}).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("all sitemap destinations and utility pages return an intentional page",async({request})=>{
  const sitemap=await request.get("/sitemap.xml");expect(sitemap.status()).toBe(200);const urls=[...(await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>new URL(match[1]).pathname);
  expect(urls).toContain("/produkte/altenmuenster-urig-wuerzig");expect(urls.filter(url=>url.startsWith("/produkte/")).length).toBe(107);
  const results=await Promise.all([...urls,"/checkout","/warenkorb","/bestellungen","/gewinnspiel/archiv"].map(async url=>[url,(await request.get(url)).status()] as const));
  expect(results.filter(([,status])=>status!==200)).toEqual([]);
});

test("assortment, finder and party list do not recycle expired prices or promotions",async({page,request})=>{
  await page.goto("/produkte");
  await expect(page.getByRole("heading",{name:"Alle Produkte",exact:true})).toBeVisible();
  expect(await page.locator("main").innerText()).not.toMatch(/€|gratis|zugabe|im angebot|trinkgut app/i);
  const productImageUrls=await page.locator('main img').evaluateAll(nodes=>nodes.map(node=>(node as HTMLImageElement).currentSrc));
  expect(productImageUrls.every(url=>!decodeURIComponent(url).includes("/handzettel/extracted/"))).toBe(true);
  await page.goto("/finder");
  await page.getByRole("button",{name:/Bierfinder/}).click();
  await page.getByRole("button",{name:/Pils – herb/}).click();
  await expect(page.getByRole("heading",{name:"Wie möchtest du dein Bier genießen?"})).toBeVisible();
  expect(await page.locator("main").innerText()).not.toMatch(/€|unter 12|12-16/);
  await page.getByRole("button",{name:"Keine Präferenz",exact:true}).click();
  await page.getByRole("button",{name:"Feierabendbier",exact:true}).click();
  expect(await page.locator("main").innerText()).not.toMatch(/€|gratis|zugabe|im angebot|trinkgut app/i);
  await page.goto("/partyplaner");
  await page.getByRole("button",{name:"Berechnen",exact:true}).click();
  await expect(page.getByRole("region",{name:"Dein Getränkebedarf"})).toBeVisible();
  expect(await page.locator("main").innerText()).not.toMatch(/€|Gesamtpreis/);
  for(const slug of ["franziskaner-weissbier","jim-beam","beck-s"]){
    const response=await request.get(`/produkte/${slug}`);expect(response.status()).toBe(200);
    const description=(await response.text()).match(/<meta name="description" content="([^"]*)"/);
    expect(description?.[1]).toBeTruthy();expect(description?.[1]).not.toMatch(/€|gratis|zugabe|trinkgut app/i);
  }
});
