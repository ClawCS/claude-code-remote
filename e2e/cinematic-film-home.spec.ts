import { expect, test } from "./test-fixtures";

test("applies the approved near-white homepage palette above the shared inline tokens", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-cinematic-root]")).toHaveCSS("background-color", "rgb(250, 249, 246)");
  await expect(page.locator("[data-current-flyer]")).toHaveCSS("background-color", "rgb(242, 240, 236)");
});

for (const preference of ["reduced-motion", "save-data"] as const) {
  test(`${preference} keeps the integrated homepage poster-only until explicit play`, async ({ page }) => {
    const videos: string[] = [];
    page.on("request", request => { if (/\.mp4/.test(request.url())) videos.push(request.url()); });
    if (preference === "reduced-motion") await page.emulateMedia({ reducedMotion: "reduce" });
    else await page.addInitScript(() => {
      const connection = Object.assign(new EventTarget(), { saveData: true });
      Object.defineProperty(navigator, "connection", { value: connection });
    });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const film = page.locator('[data-hero="cinematic"] video');
    await expect(film).not.toHaveAttribute("src");
    await expect(page.getByRole("heading", { level:1 })).toBeVisible();
    expect(videos).toEqual([]);
    await page.getByRole("button", { name: "Film abspielen", exact:true }).click();
    await expect(film).toHaveAttribute("src", "/videos/jammers-hero-desktop.mp4");
  });
}

test("equal-width complete DE/NL flyers and mobile film geometry survive responsive layout", async ({ page }) => {
  await page.emulateMedia({ reducedMotion:"reduce" });
  for (const width of [390,768,1440]) {
    await page.setViewportSize({ width,height:1000 });
    await page.goto("/");
    const film = await page.locator('[data-hero="cinematic"] video').boundingBox();
    const heading = await page.getByRole("heading", { level:1 }).boundingBox();
    expect(film).not.toBeNull();expect(heading).not.toBeNull();
    expect(film!.width / film!.height).toBeCloseTo(16/9,2);
    const control = await page.getByRole("button", { name:"Film abspielen", exact:true }).boundingBox();
    expect(control).not.toBeNull();
    expect(control!.y).toBeGreaterThanOrEqual(film!.y + film!.height);
    if (width < 768) expect(heading!.y + heading!.height).toBeLessThan(film!.y);
    const de = await page.locator("[data-current-flyer]").boundingBox();
    const nl = await page.locator("[data-current-nl-flyer]").boundingBox();
    expect(de).not.toBeNull();expect(nl).not.toBeNull();
    expect(de!.width).toBeCloseTo(nl!.width,0);
    if (width >= 768) expect(de!.y).toBeCloseTo(nl!.y,0);
    else expect(nl!.y).toBeGreaterThan(de!.y + de!.height);
    for (const image of await page.locator("[data-current-flyer] img, [data-current-nl-flyer] img").all()) await expect(image).toHaveCSS("object-fit","contain");
  }
});

test("homepage film failure leaves copy, poster and destinations usable", async ({ page }) => {
  await page.route("**/videos/*.mp4", route => route.abort());
  await page.goto("/");
  await expect(page.getByRole("heading", { level:1 })).toBeVisible();
  await expect(page.locator('[data-hero="cinematic"] video')).toHaveAttribute("poster", "/images/home/jammers-film-poster.webp");
  await expect(page.locator('[data-hero="cinematic"] a[href="#aktuell"]')).toBeVisible();
  await expect(page.getByText(/Der Film ist gerade nicht verfügbar/)).toBeVisible();
});
