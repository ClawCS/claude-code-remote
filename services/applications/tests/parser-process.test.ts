import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createLocalDiagnosticParser, parserReadiness, runLocalDiagnosticProcess } from "../src/parser-process";
import { fixture, staticPdf, requireQpdfTestExecutable } from "./fixtures/synthetic";

afterEach(() => vi.unstubAllEnvs());
describe("local supervisor: deadlines and output limits, not Linux sandbox proof", () => {
  it.each(["", "relative/qpdf", "/missing/synthetic-qpdf"])("requires an explicit usable QPDF fixture executable: %s", path => {
    expect(() => requireQpdfTestExecutable(path)).toThrow("QPDF_TEST_PREREQUISITE");
  });
  it("transports private parser metadata on stdin, not argv or environment", async () => {
    const code = "let bytes=0;process.stdin.on('data',b=>bytes+=b.length);process.stdin.on('end',()=>process.stdout.write(JSON.stringify({bytes,args:process.argv.slice(1)})));";
    const result = await runLocalDiagnosticProcess(process.execPath, ["-e", code], 1000, 4096, Buffer.from("synthetic-private-name"));
    expect(result.output.toString()).toBe('{"bytes":22,"args":[]}');
  });
  it("does not inherit worker secrets or environment-based Node injection", async () => {
    vi.stubEnv("APPLICATIONS_PRIVATE_KEY", "synthetic-secret"); vi.stubEnv("NODE_OPTIONS", "--invalid-synthetic-option");
    const result = await runLocalDiagnosticProcess(process.execPath, ["-e", "process.stdout.write(JSON.stringify({secret:process.env.APPLICATIONS_PRIVATE_KEY,node:process.env.NODE_OPTIONS,tz:process.env.TZ}))"]);
    expect(result).toEqual({ code: 0, output: Buffer.from('{"tz":"UTC"}') });
    expect(parserReadiness.productionReady).toBe(false);
  });
  it.each(["setInterval(()=>{},1000)", "while(true){}"])("kills a hung or CPU-bound child %s", async program => {
    const result = await runLocalDiagnosticProcess(process.execPath, ["-e", program], 150);
    expect(result.failure).toBe("PARSER_TIMEOUT"); expect(result.code).not.toBe(0);
  });
  it.each(["process.stdout.write(Buffer.alloc(100000))", "process.stderr.write(Buffer.alloc(100000))"])("bounds output before buffering %s", async program => {
    const result = await runLocalDiagnosticProcess(process.execPath, ["-e", program], 1000, 1024);
    expect(result.failure).toBe("PARSER_LIMIT"); expect(result.output.length).toBe(0);
  });
  it("distinguishes crash and missing executable from successful parsing", async () => {
    expect((await runLocalDiagnosticProcess(process.execPath, ["-e", "process.abort()"])).code).not.toBe(0);
    expect((await runLocalDiagnosticProcess("/missing/synthetic-parser", [])).failure).toBe("PARSER_UNAVAILABLE");
  });
  it("kills descendants before returning a timeout", async () => {
    const root = await mkdtemp(join(tmpdir(), "parser-descendant-")), path = join(root, "pid");
    try {
      const program = `const c=require('node:child_process').spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});require('node:fs').writeFileSync(${JSON.stringify(path)},String(c.pid));setInterval(()=>{},1000);`;
      expect((await runLocalDiagnosticProcess(process.execPath, ["-e", program], 300)).failure).toBe("PARSER_TIMEOUT");
      const pid = Number(await readFile(path, "utf8"));
      let running = true;
      for (let n = 0; n < 20 && running; n++) { try { process.kill(pid, 0); await new Promise(resolve => setTimeout(resolve, 10)); } catch { running = false; } }
      expect(running).toBe(false);
    } finally { await rm(root, { recursive: true, force: true }); }
  });
  it("cannot construct or run diagnostics outside test mode", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(() => createLocalDiagnosticParser("/usr/bin/qpdf")).toThrow("LOCAL_DIAGNOSTIC_ONLY");
    await expect(runLocalDiagnosticProcess(process.execPath, [])).rejects.toThrow("LOCAL_DIAGNOSTIC_ONLY");
  });
  it("uses one total deadline across the supervisor and all QPDF subprocesses", async () => {
    const root = await mkdtemp(join(tmpdir(), "parser-deadline-"));
    try {
      const path = join(root, "qpdf-stub");
      const graph = { version: 2, parameters: { decodelevel: "generalized" }, qpdf: [{ jsonversion: 2, pdfversion: "1.7", calledgetallpages: false, pushedinheritedpageresources: false, maxobjectid: 3 }, { "obj:1 0 R": { value: { "/Type": "/Catalog", "/Pages": "2 0 R" } }, "obj:2 0 R": { value: { "/Type": "/Pages", "/Kids": ["3 0 R"], "/Count": 1 } }, "obj:3 0 R": { value: { "/Type": "/Page", "/Parent": "2 0 R" } }, trailer: { value: { "/Root": "1 0 R" } } }] };
      await writeFile(path, `#!${process.execPath}\nsetTimeout(()=>{const a=process.argv;if(a.includes('--version'))process.stdout.write('qpdf version 12.4.2\\n');else if(a.includes('--is-encrypted'))process.exitCode=2;else if(a.includes('--json=2'))process.stdout.write(${JSON.stringify(JSON.stringify(graph))});},100);`, { mode: 0o700 });
      const result = await createLocalDiagnosticParser(path, 300).parse(await fixture(root, staticPdf()));
      expect(result).toEqual({ kind: "blocked", reason: "PARSER_TIMEOUT" });
    } finally { await rm(root, { recursive: true, force: true }); }
  });
});
