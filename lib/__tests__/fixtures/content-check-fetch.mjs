import { readFile } from "node:fs/promises";
import path from "node:path";

// Only explicit fixture responses are allowed; no network or production files.
const files = new Map([
  ["https://werbung.trinkgut.de/frontend/catalogs/1335913/2/pdf/complete.pdf", "application/pdf"],
  ["https://werbung.trinkgut.de/frontend/mvc/api/catalogs/1335913/v2/normal/bk_1.jpg", "image/jpeg"],
  ["https://werbung.trinkgut.de/frontend/catalogs/1384969/4/pdf/complete.pdf", "application/pdf"],
  ["https://werbung.trinkgut.de/frontend/mvc/api/catalogs/1384969/v4/normal/bk_1.jpg", "image/jpeg"],
]);
let published;
try { published = JSON.parse(await readFile(path.join(process.cwd(), "test-published.json"), "utf8")); }
catch (error) { if (error.code !== "ENOENT") throw error; }
let officialImport;
try { officialImport = JSON.parse(await readFile(path.join(process.cwd(), "test-official-import.json"), "utf8")); }
catch (error) { if (error.code !== "ENOENT") throw error; }
globalThis.fetch = async (input, options) => {
  const url = String(input);
  if (officialImport) {
    const response = (body, type) => { const result = new Response(body, {headers:{"content-type":type}}); Object.defineProperty(result,"url",{value:url});return result; };
    if (url === officialImport.viewerUrl) return response(officialImport.viewer,"text/html");
    if (url === `${officialImport.base}/xml/catalog.xml`) return response(officialImport.xml,"application/xml");
    if (url === officialImport.pdfUrl) return response(options?.method === "HEAD" ? null : await readFile(path.join(process.cwd(),"test-original.pdf")),"application/pdf");
    if ([1,2].some(number => [`${officialImport.base}/normal/bk_${number}.jpg`,`${officialImport.base}/thumbnails/bk_${number}.jpg`].includes(url))) return response(options?.method === "HEAD" ? null : await readFile(path.join(process.cwd(),"test-cover.jpg")),"image/jpeg");
  }
  if (options?.method === "HEAD" && files.has(url)) return new Response(null, { status: 200, headers: { "content-type": files.get(url) } });
  const parsed = new URL(url);
  if (published && parsed.origin === "http://127.0.0.1:39001") {
    if (parsed.pathname === "/api/content/current") return Response.json(published.current);
    if (parsed.pathname === "/api/content/flyers") return Response.json(published.index);
    if (Object.hasOwn(published.pages, parsed.pathname)) return new Response(published.pages[parsed.pathname], { headers: { "content-type": "text/html" } });
    if (["/handzettel/2026/nl.pdf", "/images/content/nl.webp"].includes(parsed.pathname)) {
      const bytes = await readFile(path.join(process.cwd(), "public", parsed.pathname));
      const body = published.corruptBytes && parsed.pathname.endsWith(".pdf") ? Buffer.concat([bytes, Buffer.from("tampered")]) : bytes;
      return new Response(options?.method === "HEAD" ? null : body, { headers: { "content-type": parsed.pathname.endsWith(".pdf") ? "application/pdf" : "image/webp" } });
    }
  }
  throw new Error(`Unexpected test fetch: ${url}`);
};
