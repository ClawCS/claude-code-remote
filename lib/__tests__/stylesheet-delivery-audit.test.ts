import { execFile } from "node:child_process";
import { createServer, type Server } from "node:http";
import { resolve } from "node:path";
import { expect, test } from "vitest";

async function listen(server: Server): Promise<string> {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("missing fixture port");
  return `http://127.0.0.1:${address.port}`;
}

async function close(server: Server) {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

test.each([
  { mode: "direct", expectedCode: 0 },
  { mode: "same-origin redirect", expectedCode: 1 },
  { mode: "cross-origin redirect", expectedCode: 1 },
])("stylesheet audit returns $expectedCode for $mode without following redirects", async ({ mode, expectedCode }) => {
  let followedRequests = 0;
  const cssHeaders = { "Content-Type": "text/css", "Cache-Control": "public, max-age=31536000, immutable" };
  const destination = createServer((_request, response) => {
    followedRequests++;
    response.writeHead(200, cssHeaders).end("body{color:black}");
  });
  const destinationUrl = await listen(destination);
  const source = createServer((request, response) => {
    if (request.url === "/styles.css") {
      if (mode === "direct") response.writeHead(200, cssHeaders).end("body{color:black}");
      else response.writeHead(302, { Location: mode === "same-origin redirect" ? "/final.css" : `${destinationUrl}/final.css` }).end();
    } else if (request.url === "/final.css") {
      followedRequests++;
      response.writeHead(200, cssHeaders).end("body{color:black}");
    } else {
      response.writeHead(200, { "Content-Type": "text/html", "Content-Security-Policy": "default-src 'self'; style-src 'self'" })
        .end('<!doctype html><link rel="stylesheet" href="/styles.css"><h1>Fixture</h1>');
    }
  });
  try {
    const sourceUrl = await listen(source);
    const result = await new Promise<{ code: number; stdout: string; stderr: string }>(resolveResult => {
      execFile(process.execPath, [resolve("scripts/audit-stylesheet-delivery.mjs"), "--url", sourceUrl],
        { timeout: 5000 }, (error, stdout, stderr) => {
          resolveResult({ code: error ? typeof error.code === "number" ? error.code : -1 : 0, stdout, stderr });
        });
    });
    expect(result.code, result.stderr).toBe(expectedCode);
    expect(followedRequests).toBe(0);
    if (mode === "direct") {
      expect(result.stderr).toBe("");
      expect(result.stdout.trim().split("\n").map(line => JSON.parse(line).route))
        .toEqual(["/", "/nl", "/angebote", "/produkte", "/gewinnspiel"]);
    } else {
      expect(result.stdout).toBe("");
      expect(result.stderr.trim().split("\n")).toHaveLength(5);
    }
  } finally {
    await close(source);
    await close(destination);
  }
});
