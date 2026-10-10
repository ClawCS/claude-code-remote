import { expect, test } from "./test-fixtures";

for (const width of [320,667,1023,1024,1025,1151,1152,1153,1279,1280,1281]) test(`responsive controls do not clip at ${width}px`,async({page})=>{
  await page.setViewportSize({width,height:width === 667 ? 375 : 900});await page.goto("/");await page.evaluate(()=>document.fonts.ready);
  const errors=await page.locator('#sortiment a, header a:visible, header summary:visible, [data-hero="cinematic"] h1').evaluateAll(nodes=>nodes.filter(node=>{const r=node.getBoundingClientRect();return r.left < -1 || r.right > window.innerWidth+1 || node.scrollWidth > node.clientWidth+2;}).map(node=>node.textContent));
  expect(errors).toEqual([]);
  if (width < 1152) {
    await page.getByRole("button",{name:"Menü öffnen"}).click();
    const panel=page.getByRole("navigation",{name:"Mobile Navigation"});
    await expect(panel.getByRole("link",{name:"Dein Besuch",exact:true})).toBeVisible();
    await panel.getByRole("link",{name:"Dein Besuch",exact:true}).focus();
    await expect(panel.getByRole("link",{name:"Dein Besuch",exact:true})).toBeInViewport();
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
  const flyersResponse = await request.get("/api/content/flyers");expect(flyersResponse.status()).toBe(200);
  const index = await flyersResponse.json();
  const viewers = page.locator("[data-flyer-viewer]");await expect(viewers).toHaveCount(index.flyers.length);
  await expect(page.getByRole("button",{name:"Handzettel ansehen",exact:true})).toHaveCount(0);
  if (!index.flyers.length) await expect(page.getByText("De volgende geldige folder wordt voorbereid.", { exact:false })).toBeVisible();
  for (const viewer of await viewers.all()) {
    await viewer.getByRole("button",{name:"Folder bekijken",exact:true}).click();
    await expect(page.getByRole("button",{name:"Folder sluiten",exact:true})).toBeVisible();
    await page.getByRole("button",{name:"Folder sluiten",exact:true}).click();
  }
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("all sitemap destinations and utility pages return an intentional page",async({request})=>{
  const sitemap=await request.get("/sitemap.xml");expect(sitemap.status()).toBe(200);const urls=[...(await sitemap.text()).matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>new URL(match[1]).pathname);
  expect(urls).toContain("/kategorie/bier");expect(urls.filter(url=>url.startsWith("/produkte/"))).toEqual([]);
  const results=await Promise.all([...urls,"/checkout","/warenkorb","/bestellungen","/gewinnspiel/archiv"].map(async url=>[url,(await request.get(url)).status()] as const));
  expect(results.filter(([,status])=>status!==200)).toEqual([]);
});

test("assortment uses current dated originals while finder and party list do not recycle expired prices or promotions",async({page,request})=>{
  await page.goto("/produkte");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading",{name:"Sortiment & Wochenangebote",exact:true})).toBeVisible();
  const offersResponse = await request.get("/api/content/offers");expect(offersResponse.status()).toBe(200);
  const content = await offersResponse.json();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone:"Europe/Berlin" }).format(new Date(content.generatedAt));
  expect(content.offers.every((offer: {validFrom:string;validTo:string}) => offer.validFrom <= today && offer.validTo >= today)).toBe(true);
  await expect(page.locator("[data-offer-id]")).toHaveCount(content.offers.length);
  for (const offer of content.offers) {
    const article=page.locator(`[data-offer-id="${offer.id}"]`);
    const source = await article.locator("img").evaluate(node => new URL((node as HTMLImageElement).src));
    expect(source.searchParams.get("url") ?? source.pathname).toBe(offer.image);
    if (offer.sourceWarning) await expect(article).toContainText(offer.sourceWarning);
  }
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
    const response=await request.get(`/produkte/${slug}`,{maxRedirects:0});expect(response.status()).toBe(307);
    expect(response.headers().location).toBe(slug==="jim-beam"?"/kategorie/spirituosen":"/kategorie/bier");
  }
});
