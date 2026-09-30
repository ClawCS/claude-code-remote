import { readFileSync } from "node:fs";
import { expect, test as base, type BrowserContext } from "@playwright/test";
import catalog from "./fixtures/handzettel-cache.json";

// Network-isolated fixture only. The retired July cover no longer exists upstream.
// This is NOT production publication evidence; real current assets are checked by content:check.
export async function installCatalogCoverFixture(context: BrowserContext) {
  const bytes=readFileSync("public/images/home/cinematic/poster-pralle-kirsche.webp");
  await context.route(url=>url.pathname === "/_next/image" && url.searchParams.get("url") === catalog.pages[0].imageUrl,route=>route.fulfill({status:200,contentType:"image/webp",body:bytes}));
}
export const test=base.extend<{catalogCover: void}>({
  catalogCover:[async({context},use)=>{await installCatalogCoverFixture(context);await use();},{auto:true}],
});
export {expect};
