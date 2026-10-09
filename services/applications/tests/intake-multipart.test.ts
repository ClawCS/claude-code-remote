import { afterEach, describe, expect, it } from "vitest";
import { createServer, request, type Server } from "node:http";
import { once } from "node:events";
import { parseMultipart } from "../src/intake-multipart";
let server: Server;
const boundary = "synthetic-evidence";
afterEach(async () => { if (server?.listening) { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); } });
async function parse(body: Buffer, type = `multipart/form-data; boundary=${boundary}`, split = 65536, length?: number) {
  server = createServer((req, res) => {
    void parseMultipart(req, new AbortController().signal).then(payload => { res.writeHead(200, { connection: "close" }); res.end(JSON.stringify(payload)); }, error => { res.writeHead(error.message === "PAYLOAD_TOO_LARGE" ? 413 : 400, { connection: "close" }); res.end(JSON.stringify({ code: error.message })); });
  }); server.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address() as import("node:net").AddressInfo;
  return new Promise<{ status: number; body: unknown }>((resolve, reject) => {
    const req = request({ host: "127.0.0.1", port: address.port, path: "/synthetic-parser", method: "POST", headers: { "content-type": type, ...(length === undefined ? {} : { "content-length": String(length) }) } }, res => {
      const chunks: Buffer[] = []; res.on("data", chunk => chunks.push(chunk)); res.on("end", () => resolve({ status: res.statusCode!, body: JSON.parse(Buffer.concat(chunks).toString()) }));
    }); req.on("error", reject);
    for (let offset = 0; offset < body.length; offset += split) req.write(body.subarray(offset, offset + split)); req.end();
  });
}
function part(name: string, bytes: Buffer | string, extra = "", disposition = "") {
  return Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"${disposition}\r\n${extra}\r\n`), Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes), Buffer.from("\r\n")]);
}
function body(parts: Buffer[]) { return Buffer.concat([...parts, Buffer.from(`--${boundary}--\r\n`)]); }
const required = () => [part("name", "Synthetic"), part("email", "synthetic@example.invalid"), part("job", "sales-fulltime")];
describe("raw multipart evidence on real local HTTP streams", () => {
  it("preserves split UTF8 and partial boundary prefixes while canonicalizing safe Unicode names", async () => {
    const value = body([...required(), part("message", "Synthetisch äö漢"), part("files", "synthetic\r\n--synthetic-evidenc\nbytes", "Content-Type: image/png\r\n", '; filename=" Cafe\u0301.png "')]);
    const result = await parse(value, undefined, 1); expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ input: { message: "Synthetisch äö漢" }, files: [{ name: "Café.png", content: Buffer.from("synthetic\r\n--synthetic-evidenc\nbytes").toString("base64") }] });
  });
  it.each([
    ["field charset", () => body([...required(), part("message", "synthetic", "Content-Type: text/plain; charset=iso-8859-1\r\n")])],
    ["invalid UTF8 with explicit charset", () => body([part("name", Buffer.from([0xff]), "Content-Type: text/plain; charset=UTF-8\r\n"), ...required().slice(1)])],
    ["unsupported filename charset", () => body([...required(), part("files", "synthetic", "Content-Type: image/png\r\n", "; filename*=ISO-8859-1''synthetic.png")])],
    ["invalid extended filename", () => body([...required(), part("files", "synthetic", "Content-Type: image/png\r\n", "; filename*=UTF-8''%FF.png")])],
    ["duplicate parameter", () => body([...required(), part("files", "synthetic", "Content-Type: image/png\r\n", '; filename="a.png"; filename="b.png"')])],
    ["path filename", () => body([...required(), part("files", "synthetic", "Content-Type: image/png\r\n", '; filename="../synthetic.png"')])],
    ["wrong file role", () => body([...required(), part("portrait", "synthetic", "Content-Type: image/png\r\n", '; filename="synthetic.png"')])],
    ["duplicate header", () => body([...required(), part("message", "synthetic", "Content-Type: text/plain\r\nContent-Type: text/plain\r\n")])],
    ["transfer encoding", () => body([...required(), part("message", "synthetic", "Content-Transfer-Encoding: base64\r\n")])],
    ["truncated framing", () => body(required()).subarray(0, -7)],
    ["false delimiter disagreement", () => body([...required(), part("files", `synthetic\r\n--${boundary}Xnot-delimiter`, "Content-Type: image/png\r\n", '; filename="synthetic.png"')])],
  ] as [string, () => Buffer][])("rejects %s ambiguity", async (_name, value) => { expect((await parse(value(), undefined, 7)).status).toBe(400); });
  it("accepts explicit UTF8 extended filename and field charset", async () => {
    expect((await parse(body([part("name", "Synthetisch ä", "Content-Type: text/plain; charset=utf-8\r\n"), ...required().slice(1), part("files", "synthetic", "Content-Type: image/png\r\n", "; filename*=UTF-8''Caf%C3%A9.png")]))).body).toMatchObject({ files: [{ name: "Café.png" }] });
  });
  it.each([[16384, 400], [16385, 413]] as const)("keeps cumulative field byte budget inclusive at %i", async (bytes, expected) => {
    // Shape is intentionally invalid; exact byte cap must reach shape validation,
    // whereas +1 must fail transport budget first. All approved Input maxima fit below 16KiB.
    const prefix = [part("name", "Synthetic"), part("email", "synthetic@example.invalid"), part("job", "sales-fulltime")];
    const fixed = Buffer.byteLength("Syntheticsynthetic@example.invalidsales-fulltime");
    expect((await parse(body([...prefix, part("message", "x".repeat(bytes - fixed))]))).status).toBe(expected);
  });
  it.each([[8, 400], [9, 413]] as const)("keeps submitted field count inclusive at %i", async (count, expected) => { const result = await parse(body(Array.from({ length: count }, () => part("unknown", "x"))), undefined, 1); expect(result.status).toBe(expected); });
  it.each([[13, 400], [14, 413]] as const)("keeps submitted part count inclusive at %i", async (count, expected) => {
    const fields = Array.from({ length: 8 }, () => part("unknown", "x"));
    const files = Array.from({ length: count - 8 }, () => part("files", "synthetic", "Content-Type: image/png\r\n", '; filename="synthetic.png"'));
    expect((await parse(body([...fields, ...files]))).status).toBe(expected);
  });
  it.each([[11534336, 400], [11534337, 413]] as const)("keeps declared whole request budget inclusive at %i", async (bytes, expected) => {
    expect((await parse(Buffer.from("invalid preamble longer than first boundary"), undefined, 65536, bytes)).status).toBe(expected);
  });
  it("rejects malformed unquoted boundary params as request error", async () => { expect((await parse(body(required()), "multipart/form-data; boundary=a:b")).status).toBe(400); });
});
