#!/usr/bin/env node
// Read-only production gate: shared CSS must be independently retrievable.
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";

const urlIndex = process.argv.indexOf("--url");
const base = new URL(urlIndex >= 0 ? process.argv[urlIndex + 1] : "http://127.0.0.1:3110");
const routes = ["/", "/nl", "/angebote", "/produkte", "/gewinnspiel"];
let failed = false;
for (const route of routes) {
  try {
    const response = await fetch(new URL(route, base), { signal: AbortSignal.timeout(25000) });
    if (response.status !== 200) throw new Error(`HTML status ${response.status}`);
    const csp = response.headers.get("content-security-policy") ?? "";
    if (!/(?:^|;)\s*style-src\s[^;]*'self'/.test(csp)) throw new Error("CSP does not permit same-origin CSS");
    const html = await response.text();
    const inlineBytes = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)]
      .reduce((total, match) => total + Buffer.byteLength(match[1]), 0);
    if (inlineBytes > 1024) throw new Error(`repeated inline CSS ${inlineBytes} bytes exceeds 1024-byte gate`);
    const hrefs = [...new Set([...html.matchAll(/<link\b[^>]*>/gi)]
      .filter(match => /\brel=["']stylesheet["']/i.test(match[0]))
      .map(match => match[0].match(/\bhref=["']([^"']+)["']/i)?.[1]).filter(Boolean))];
    if (!hrefs.length) throw new Error("no independently cacheable stylesheet links");
    const stylesheets = [];
    for (const href of hrefs) {
      const url = new URL(href, base);
      if (url.origin !== base.origin) throw new Error(`cross-origin CSS ${url.origin}`);
      const cssResponse = await fetch(url, { signal: AbortSignal.timeout(25000) });
      if (cssResponse.status !== 200 || !cssResponse.headers.get("content-type")?.includes("text/css")) {
        throw new Error(`CSS not retrievable: ${url.pathname} (${cssResponse.status})`);
      }
      const body = Buffer.from(await cssResponse.arrayBuffer());
      if (!body.length) throw new Error(`empty CSS ${url.pathname}`);
      if (!/immutable/.test(cssResponse.headers.get("cache-control") ?? "")) throw new Error(`CSS lacks immutable caching: ${url.pathname}`);
      stylesheets.push({ path: url.pathname, bytes: body.length, gzipBytes: gzipSync(body).length,
        sha256: createHash("sha256").update(body).digest("hex") });
    }
    console.log(JSON.stringify({ route, htmlBytes: Buffer.byteLength(html), htmlGzipBytes: gzipSync(html).length, inlineBytes, stylesheets }));
  } catch (error) {
    failed = true;
    console.error(`${route}: ${error.message}`);
  }
}
process.exitCode = failed ? 1 : 0;
