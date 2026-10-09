import { afterEach, describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { ImapFlow } from "imapflow";
import { readFile, writeFile, mkdtemp, mkdir, rm, cp } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { assertImapDependency } from "../src/imap-dependency";
import manifest from "../../../patches/imapflow-2.3.0-uid-expunge.json";
import { imapServer } from "./helpers/imap-server";
const require = createRequire(import.meta.url);
const CjsImapFlow: typeof ImapFlow = require("imapflow").ImapFlow;
const run = promisify(execFile);
const cleanups: (() => Promise<void>)[] = [];
async function packageFixture() {
  const root = await mkdtemp(join(tmpdir(), "imap-patch-")); cleanups.push(() => rm(root, { recursive: true, force: true }));
  const real = dirname(require.resolve("imapflow/package.json"));
  for (const file of ["package.json", "dist/cjs/commands/expunge.js", "dist/esm/commands/expunge.js"]) {
    const target = join(root, file); await mkdir(dirname(target), { recursive: true }); await writeFile(target, await readFile(join(real, file)));
  }
  return join(root, "package.json");
}
async function install(path: string, checkOnly = false) { const installer = await import(/* @vite-ignore */ pathToFileURL(join(process.cwd(), "scripts/applications-imap-patch.mjs")).href); return installer.installImapPatch(path, checkOnly); }
describe("checked patch installation", () => {
  it("exercises distinct CJS and ESM public entry points", () => { expect(CjsImapFlow).not.toBe(ImapFlow); });
  it.each(["unapplied", "altered", "missing"])("blocks actual adapter before transport for %s dependency", async scenario => {
    const root = await mkdtemp(join(tmpdir(), "imap-adapter-gate-")); cleanups.push(() => rm(root, { recursive: true, force: true }));
    await cp(join(process.cwd(), "services/applications/src"), join(root, "services/applications/src"), { recursive: true });
    await cp(join(process.cwd(), "patches"), join(root, "patches"), { recursive: true });
    await cp(join(process.cwd(), "lib"), join(root, "lib"), { recursive: true });
    const packageRoot = join(root, "node_modules/imapflow"); await cp(dirname(require.resolve("imapflow/package.json")), packageRoot, { recursive: true });
    const esm = join(packageRoot, manifest.files[1].path);
    if (scenario === "missing") await rm(esm);
    if (scenario === "altered") await writeFile(esm, (await readFile(esm, "utf8")) + "\n// altered fixture\n");
    if (scenario === "unapplied") for (const file of manifest.files) { const path = join(packageRoot, file.path); let bytes = await readFile(path, "utf8"); for (const { from, to } of [...file.replacements].reverse()) bytes = bytes.replace(to, from); await writeFile(path, bytes); }
    const other = { uid: 999, raw: Buffer.from("unrelated"), flags: new Set(["\\Deleted"]) }, folder = { path: "INBOX", messages: [other] };
    const server = await imapServer({ folders: [folder] }); cleanups.push(() => server.close());
    const code = `const {createMailbox,createMailboxRunBudget}=require(${JSON.stringify(join(root, "services/applications/src/imap.ts"))});
      const {createRequire}=require('node:module'); const {ImapFlow}=createRequire(${JSON.stringify(join(root, "package.json"))})('imapflow');
      const adapter=createMailbox({user:'synthetic',pass:'synthetic',keys:new Map(),budget:createMailboxRunBudget()},{createClient:options=>new ImapFlow({...options,host:'127.0.0.1',port:${server.port},secure:false,doSTARTTLS:false,tls:undefined})});
      const mail={id:'11111111-1111-4111-8111-111111111111',messageId:'<test@trinkgut-jammers.de>',keyId:'test',profile:'tj-mail-1',fingerprint:'a'.repeat(64),shape:{kind:'text',parts:1,attachments:[]}};
      (async()=>{const find=await adapter.findVerified(mail);const del=await adapter.deleteVerified({mailbox:'INBOX',uidValidity:'77',uid:123,fingerprint:mail.fingerprint},mail);await adapter.disconnect();process.stdout.write(JSON.stringify({find,del}));})().catch(()=>{process.exitCode=1});`;
    const result = await run(process.execPath, ["--import", require.resolve("tsx"), "-e", code], { cwd: process.cwd(), env: { ...process.env, NODE_ENV: "test", NODE_PATH: join(process.cwd(), "node_modules") }, timeout: 10000 });
    expect(JSON.parse(result.stdout)).toEqual({ find: { copies: [], complete: false, issues: ["DEPENDENCY_UNAVAILABLE"] }, del: { kind: "blocked", issue: "DEPENDENCY_UNAVAILABLE" } });
    expect(result.stderr).toBe(""); expect(server.commands).toHaveLength(0); expect(folder.messages).toEqual([other]);
  });
  it("rejects unapplied or partly applied known bytes at runtime, then applies both", async () => {
    const path = await packageFixture();
    for (const file of manifest.files) {
      const source = join(dirname(path), file.path); let original = await readFile(source, "utf8");
      for (const { from, to } of [...file.replacements].reverse()) original = original.replace(to, from);
      await writeFile(source, original);
      expect(() => assertImapDependency(path)).toThrow("IMAP_DEPENDENCY_UNAVAILABLE");
    }
    await expect(install(path, true)).rejects.toThrow("IMAP_DEPENDENCY_UNAVAILABLE");
    await install(path); expect(() => assertImapDependency(path)).not.toThrow();
  });
  it("installs both module formats idempotently and runtime accepts only patched bytes", async () => {
    const path = await packageFixture(); await install(path); expect(() => assertImapDependency(path)).not.toThrow();
    await install(path); await install(path, true); expect(() => assertImapDependency(path)).not.toThrow();
  });
  it.each(["version", "missing", "altered"])("rejects %s before touching either module", async change => {
    const path = await packageFixture(), cjs = join(dirname(path), "dist/cjs/commands/expunge.js"), esm = join(dirname(path), "dist/esm/commands/expunge.js");
    let original = await readFile(cjs, "utf8"); for (const { from, to } of [...manifest.files[0].replacements].reverse()) original = original.replace(to, from); await writeFile(cjs, original);
    const before = await readFile(cjs);
    if (change === "version") { const pkg = JSON.parse(await readFile(path, "utf8")); pkg.version = "2.3.1"; await writeFile(path, JSON.stringify(pkg)); }
    if (change === "missing") await rm(esm);
    if (change === "altered") await writeFile(esm, "altered");
    await expect(install(path)).rejects.toThrow("IMAP_DEPENDENCY_UNAVAILABLE");
    expect(() => assertImapDependency(path)).toThrow("IMAP_DEPENDENCY_UNAVAILABLE"); expect(await readFile(cjs)).toEqual(before);
  });
});
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });
describe.each([["ESM", ImapFlow], ["CJS", CjsImapFlow]] as const)("exact deletion dependency %s", (_format, Client) => {
  it.each(["absent", "untagged", "tagged", "normal"] as const)("keeps unrelated Deleted mail: %s", async scenario => {
    const other = { uid: 999, raw: Buffer.from("foreign"), flags: new Set(["\\Deleted"]) };
    const folder = { path: "INBOX", messages: [{ uid: 123, raw: Buffer.from("target"), flags: new Set<string>() }, other] };
    const server = await imapServer({ folders: [folder], uidplus: scenario !== "absent", withdrawal: scenario === "untagged" || scenario === "tagged" ? scenario : undefined });
    cleanups.push(() => server.close());
    const client = new Client({ host: "127.0.0.1", port: server.port, secure: false, doSTARTTLS: false, logger: false, disableAutoIdle: true });
    client.on("error", () => {}); cleanups.push(async () => { client.close(); });
    await client.connect(); await client.mailboxOpen("INBOX");
    expect(await client.messageDelete("123", { uid: true })).toBe(scenario === "normal");
    await client.logout();
    expect(folder.messages).toContainEqual(other);
    expect(server.commands.filter(c => ["EXPUNGE", "CLOSE", "UNSELECT"].includes(c.verb))).toEqual([]);
    expect(server.commands.filter(c => c.verb === "UID STORE")).toHaveLength(scenario === "absent" ? 0 : 1);
    expect(server.commands.filter(c => c.verb === "UID STORE").every(c => c.args === "123 +FLAGS (\\Deleted)")).toBe(true);
    expect(server.commands.filter(c => c.verb === "UID EXPUNGE").map(c => c.args)).toEqual(scenario === "normal" ? ["123"] : []);
  });
});
