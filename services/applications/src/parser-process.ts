import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { decodeParserResult } from "./file-validation";
import type { ParserPort, ParserResult } from "./types";
import { decodeSourceInspectorResponse, type SourceInspectorPort } from "./reconstruction-types";

export function createLocalDiagnosticSourceInspector(qpdfPath: string, deadlineMs = PARSER_TIMEOUT_MS): SourceInspectorPort {
  if (process.env.NODE_ENV !== "test" || !isAbsolute(qpdfPath) || !Number.isSafeInteger(deadlineMs) || deadlineMs < 1 || deadlineMs > PARSER_TIMEOUT_MS) throw new Error("LOCAL_DIAGNOSTIC_ONLY");
  return {
    assurance: "local-test",
    async inspect(file, signal) {
      if (process.env.NODE_ENV !== "test") return { kind: "blocked", reason: "SANDBOX_UNAVAILABLE" };
      const result = await runLocalDiagnosticProcess(process.execPath, childArgs(), deadlineMs, 4096, Buffer.from(JSON.stringify({ version: 1, operation: "inspect-source", file, qpdfPath })), signal);
      if (result.failure) return { kind: "blocked", reason: result.failure };
      if (result.code !== 0) return { kind: "blocked", reason: "INVALID_FILE" };
      try { const decoded = decodeSourceInspectorResponse(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(result.output))); if (decoded) return decoded; } catch { /* No document diagnostics leave the child. */ }
      return { kind: "blocked", reason: "INVALID_FILE" };
    },
  };
}
function childArgs(): string[] {
  const compiled = join(__dirname, "parser-child.js"), source = join(__dirname, "parser-child.ts");
  return existsSync(compiled) ? [compiled] : ["--import", require.resolve("tsx"), source];
}

export const PARSER_TIMEOUT_MS = 30_000;
export const PINNED_QPDF_VERSION = "12.4.2";
export const parserReadiness = Object.freeze({ productionReady: false, reason: "LINUX_SANDBOX_NOT_IMPLEMENTED" });
export interface DiagnosticProcessResult { code: number | null; output: Buffer; failure?: "PARSER_TIMEOUT" | "PARSER_LIMIT" | "PARSER_UNAVAILABLE" }
// Local synthetic tests only. Process groups/output bounds are NOT an OS sandbox.
export async function runLocalDiagnosticProcess(executable: string, args: string[], timeoutMs = PARSER_TIMEOUT_MS, maxOutput = 4096, input: Buffer = Buffer.alloc(0), signal?: AbortSignal): Promise<DiagnosticProcessResult> {
  if (process.env.NODE_ENV !== "test" || !isAbsolute(executable) || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > PARSER_TIMEOUT_MS || !Number.isSafeInteger(maxOutput) || maxOutput < 1 || maxOutput > 16 * 1024 * 1024 || input.length > 16384) throw new Error("LOCAL_DIAGNOSTIC_ONLY");
  if (signal?.aborted) return { code: null, output: Buffer.alloc(0), failure: "PARSER_TIMEOUT" };
  return new Promise(resolve => {
    const child = spawn(executable, args, { detached: true, cwd: "/", env: { NODE_ENV: "test", TZ: "UTC", LANG: "C", LC_ALL: "C", PATH: "/usr/bin:/bin", UV_THREADPOOL_SIZE: "1" }, stdio: ["pipe", "pipe", "pipe"] });
    let failure: DiagnosticProcessResult["failure"], outputBytes = 0, errorBytes = 0; const chunks: Buffer[] = [];
    const kill = () => { if (child.pid) { try { process.kill(-child.pid, "SIGKILL"); } catch { /* Already gone. */ } } };
    const timer = setTimeout(() => { failure = "PARSER_TIMEOUT"; kill(); }, timeoutMs);
    const abort = () => { failure = "PARSER_TIMEOUT"; kill(); };
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) abort();
    child.stdout.on("data", (chunk: Buffer) => { outputBytes += chunk.length; if (outputBytes > maxOutput) { failure = "PARSER_LIMIT"; kill(); } else chunks.push(chunk); });
    child.stderr.on("data", (chunk: Buffer) => { errorBytes += chunk.length; if (errorBytes > 65536) { failure = "PARSER_LIMIT"; kill(); } });
    child.on("error", () => { failure = "PARSER_UNAVAILABLE"; });
    child.stdin.on("error", () => { failure = "PARSER_UNAVAILABLE"; kill(); });
    child.stdin.end(input);
    child.on("exit", kill); // Includes descendants that try to outlive the supervisor.
    child.on("close", code => { clearTimeout(timer); signal?.removeEventListener("abort", abort); resolve({ code, output: failure ? Buffer.alloc(0) : Buffer.concat(chunks), ...(failure ? { failure } : {}) }); });
  });
}
export function createLocalDiagnosticParser(qpdfPath: string, deadlineMs = PARSER_TIMEOUT_MS): ParserPort {
  if (process.env.NODE_ENV !== "test" || !isAbsolute(qpdfPath) || !Number.isFinite(deadlineMs) || deadlineMs < 1 || deadlineMs > PARSER_TIMEOUT_MS) throw new Error("LOCAL_DIAGNOSTIC_ONLY");
  return {
    assurance: "local-test",
    async parse(file): Promise<ParserResult> {
      if (process.env.NODE_ENV !== "test") return { kind: "blocked", reason: "SANDBOX_UNAVAILABLE" };
      // tsx is used only in source-tree tests. Compiled/pruned backend uses plain JS.
      const result = await runLocalDiagnosticProcess(process.execPath, childArgs(), deadlineMs, 4096, Buffer.from(JSON.stringify({ file, qpdfPath })));
      if (result.failure) return { kind: "blocked", reason: result.failure };
      if (result.code !== 0) return { kind: "blocked", reason: "INVALID_FILE" };
      try {
        const resultDto = decodeParserResult(JSON.parse(result.output.toString("utf8")));
        if (resultDto) return resultDto;
      } catch { /* No document diagnostics cross the process boundary. */ }
      return { kind: "blocked", reason: "INVALID_FILE" };
    },
  };
}
