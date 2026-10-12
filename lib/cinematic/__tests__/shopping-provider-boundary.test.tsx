import { build } from "esbuild";
import { chromium, type Browser, type Page } from "@playwright/test";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

let browser: Browser;
let files: Map<string, Uint8Array>;
const pageErrors = new WeakMap<Page, string[]>();

beforeAll(async () => {
  const result = await build({
    stdin: {
      contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import RootLayout from './app/layout'; import {usePathname} from 'next/navigation'; import {useCart} from './context/CartContext'; import {useWishlist} from './context/WishlistContext'; import {getRentalItem,rentalToProduct} from './data/rentals'; import {assortmentProducts} from './lib/catalog';
      import FinderLayout from './app/finder/layout'; import RentalLayout from './app/vermietung/layout'; import CartLayout from './app/warenkorb/layout'; import WishlistLayout from './app/merkzettel/layout'; import CheckoutLayout from './app/checkout/layout';
      function Consumer(){const cart=useCart();const wishlist=useWishlist();return <><p id="count">{cart.totalItems}:{wishlist.totalItems}</p><button id="add" onClick={()=>cart.addItem(rentalToProduct(getRentalItem(20003)),1,{startDate:'2026-10-12',endDate:'2026-10-14',workdays:3,periods:0,basePrice:0,totalRentalPrice:0})}>Add rental</button><button id="save" onClick={()=>wishlist.addItem(assortmentProducts[0])}>Save product</button><button id="clear" onClick={()=>{cart.clearCart();wishlist.clearWishlist()}}>Clear selections</button></>}
      const layouts={'/finder':FinderLayout,'/vermietung':RentalLayout,'/warenkorb':CartLayout,'/merkzettel':WishlistLayout,'/checkout':CheckoutLayout};
      function App(){const path=usePathname();const Layout=layouts[path];return <RootLayout>{Layout?<Layout><Consumer/></Layout>:<p id="ordinary">Ordinary page</p>}</RootLayout>};createRoot(document).render(<App/>);`,
      resolveDir: process.cwd(), loader: "tsx",
    },
    bundle: true, write: false, outdir: "/tmp/shopping-boundary-test", format: "esm", splitting: true, jsx: "automatic",
    // Styling is unrelated to whether real context consumers mount safely.
    loader: { ".css": "empty" },
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [{ name: "framework-boundaries", setup(builder) {
      builder.onResolve({ filter: /^next\/(navigation|font\/google|link|image)$/ }, args => ({ path: args.path, namespace: "test-framework" }));
      builder.onResolve({ filter: /^@\/components\/PublicChrome$/ }, args => ({ path: args.path, namespace: "test-framework" }));
      builder.onResolve({ filter: /^@\/lib\/cinematic\/server-clock$/ }, args => ({ path: args.path, namespace: "test-framework" }));
      builder.onLoad({ filter: /.*/, namespace: "test-framework" }, args => {
        if (args.path === "next/navigation") return { contents: `import {useSyncExternalStore} from 'react';export function usePathname(){return useSyncExternalStore(fn=>{window.addEventListener('popstate',fn);return ()=>window.removeEventListener('popstate',fn)},()=>location.pathname,()=>location.pathname)}`, loader: "js", resolveDir: process.cwd() };
        if (args.path === "next/font/google") return { contents: "export const Plus_Jakarta_Sans=()=>({variable:'jakarta'});", loader: "js" };
        if (args.path === "next/link") return { contents: "import React from 'react'; export default function Link({children,href,...props}){return React.createElement('a',{href,...props},children)}", loader: "js", resolveDir: process.cwd() };
        if (args.path === "next/image") return { contents: "import React from 'react'; export default function Image({src,alt}){return React.createElement('img',{src,alt})}", loader: "js", resolveDir: process.cwd() };
        if (args.path.endsWith("server-clock")) return { contents: "export const resolveHomepageNow=()=>new Date('2026-10-12T12:00:00.000Z');", loader: "js" };
        return { contents: "export default function PublicChrome(){return null}", loader: "js" };
      });
    }}],
  });
  files = new Map(result.outputFiles.map(file => [file.path.split("/").pop()!, file.contents]));
  browser = await chromium.launch();
}, 30_000);
afterAll(async () => { await browser?.close(); });

async function mount(path: string, storageDenied = false, quotaExceeded = false) {
  const page = await browser.newPage();
  page.setDefaultTimeout(2000);
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on("pageerror", error => errors.push(error.message));
  await page.route("https://shopping.test/**", route => {
    const name = new URL(route.request().url()).pathname.split("/").pop()!;
    return files.has(name) ? route.fulfill({ body: Buffer.from(files.get(name)!), contentType: name.endsWith(".css") ? "text/css" : "text/javascript" }) : route.fulfill({ body: '<script type="module" src="/stdin.js"></script>', contentType: "text/html" });
  });
  await page.addInitScript(({ storageDenied, quotaExceeded }) => {
    localStorage.setItem("trinkgut-bestellungen", "retired private order data");
    localStorage.setItem("unrelated-user-key", "leave intact");
    if (storageDenied) Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Storage denied", "SecurityError"); } });
    if (storageDenied) Object.defineProperty(window, "sessionStorage", { get() { throw new DOMException("Storage denied", "SecurityError"); } });
    const get = Storage.prototype.getItem;
    const set = Storage.prototype.setItem;
    const remove = Storage.prototype.removeItem;
    if (quotaExceeded) {
      Storage.prototype.setItem = function (key, value) {
        if (/^trinkgut-(cart|wishlist)$/.test(key)) throw new DOMException("Storage quota exceeded", "QuotaExceededError");
        return set.call(this, key, value);
      };
      Storage.prototype.removeItem = function (key) {
        if (/^trinkgut-(cart|wishlist)$/.test(key)) throw new DOMException("Storage writes blocked", "QuotaExceededError");
        return remove.call(this, key);
      };
    }
    Object.assign(window, { shoppingReads: [] });
    Storage.prototype.getItem = function (key) {
      if (/trinkgut-(cart|wishlist)/.test(key)) (window as unknown as Window & { shoppingReads: string[] }).shoppingReads.push(key);
      return get.call(this, key);
    };
  }, { storageDenied, quotaExceeded });
  await page.goto(`https://shopping.test${path}`);
  return page;
}

describe("shopping provider route boundary", () => {
  it.each(["blocked getters", "quota-exceeded writes"])("keeps and clears cart and wishlist across provider remounts with %s", async failure => {
    const page = await mount("/vermietung", failure === "blocked getters", failure === "quota-exceeded writes");
    await page.locator("#add").click();
    await page.locator("#save").click();
    await page.waitForFunction(() => document.querySelector("#count")?.textContent === "1:1");
    async function visit(path: string) {
      await page.evaluate(path => { history.pushState({}, "", path); dispatchEvent(new PopStateEvent("popstate")); }, path);
      await page.locator(path === "/kontakt" ? "#ordinary" : "#count").waitFor();
    }
    await visit("/kontakt");
    await visit("/merkzettel");
    await page.waitForFunction(() => document.querySelector("#count")?.textContent === "1:1");
    await visit("/warenkorb");
    await page.waitForFunction(() => document.querySelector("#count")?.textContent === "1:1");
    await page.locator("#clear").click();
    await page.waitForFunction(() => document.querySelector("#count")?.textContent === "0:0");
    await visit("/kontakt");
    await visit("/checkout");
    await page.waitForFunction(() => document.querySelector("#count")?.textContent === "0:0");
    expect(pageErrors.get(page)).toEqual([]);
    await page.close();
  });
  it("keeps an in-memory rental selection across consumer routes when all browser storage is blocked", async () => {
    const page = await mount("/vermietung", true);
    await page.locator("#add").click();
    await page.waitForFunction(() => document.querySelector("#count")?.textContent === "1:0");
    await page.evaluate(() => { history.pushState({}, "", "/kontakt"); dispatchEvent(new PopStateEvent("popstate")); });
    await page.locator("#ordinary").waitFor();
    for (const path of ["/warenkorb", "/checkout"]) {
      await page.evaluate(path => { history.pushState({}, "", path); dispatchEvent(new PopStateEvent("popstate")); }, path);
      await page.locator("#count").waitFor();
      await page.waitForFunction(() => document.querySelector("#count")?.textContent === "1:0");
    }
    expect(pageErrors.get(page)).toEqual([]);
    await page.close();
  });
  it("still removes retired personal data on a page that does not need shopping state", async () => {
    const page = await mount("/kontakt");
    await page.locator("#ordinary").waitFor();
    await page.waitForTimeout(50);
    expect(await page.evaluate(() => localStorage.getItem("trinkgut-bestellungen"))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem("unrelated-user-key"))).toBe("leave intact");
    await page.close();
  });

  it("still renders without errors when browser storage is denied", async () => {
    const page = await mount("/kontakt", true);
    await page.locator("#ordinary").waitFor();
    await page.waitForTimeout(50);
    expect(pageErrors.get(page)).toEqual([]);
    await page.close();
  });

  it.each(["/", "/nl", "/angebote", "/produkte", "/kontakt", "/karriere", "/karriere/verkauf-vollzeit", "/bewerbung", "/markt/bestellungen", "/mietbestellung/private-token"])("does not initialize legacy shopping storage on %s", async path => {
    const page = await mount(path);
    await page.locator("#ordinary").waitFor();
    await page.waitForTimeout(50);
    expect(await page.evaluate(() => (window as unknown as Window & { shoppingReads: string[] }).shoppingReads)).toEqual([]);
    await page.close();
  });

  it.each(["/finder", "/vermietung", "/warenkorb", "/merkzettel", "/checkout"])("provides the real hooks to the consumer on %s", async path => {
    const page = await mount(path);
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.locator("#count").waitFor();
    await page.locator("#add").click();
    await page.waitForFunction(() => document.querySelector("#count")?.textContent === "1:0");
    expect(errors).toEqual([]);
    expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("trinkgut-cart")!)[0].product.id)).toBe(20003);
    await page.close();
  });

  it("keeps consumers under providers during ordinary-to-shopping navigation and restores the saved list", async () => {
    const page = await mount("/kontakt");
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.locator("#ordinary").waitFor();
    await page.evaluate(() => { history.pushState({}, "", "/vermietung"); dispatchEvent(new PopStateEvent("popstate")); });
    await page.locator("#add").click();
    await page.waitForFunction(() => document.querySelector("#count")?.textContent === "1:0");
    await page.evaluate(() => { history.pushState({}, "", "/kontakt"); dispatchEvent(new PopStateEvent("popstate")); });
    await page.locator("#ordinary").waitFor();
    await page.evaluate(() => { history.pushState({}, "", "/warenkorb"); dispatchEvent(new PopStateEvent("popstate")); });
    await page.waitForFunction(() => document.querySelector("#count")?.textContent === "1:0");
    expect(errors).toEqual([]);
    await page.close();
  });
});
