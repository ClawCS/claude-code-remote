import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import type { ParserPort, ParserResult, ValidationFailure } from "./types";

export const PARSER_TIMEOUT_MS = 30_000;
export const PINNED_QPDF_VERSION = "12.4.2";
export const parserReadiness = Object.freeze({ productionReady: false, reason: "LINUX_SANDBOX_NOT_IMPLEMENTED" });
export interface DiagnosticProcessResult { code: number | null; output: Buffer; failure?: "PARSER_TIMEOUT" | "PARSER_LIMIT" | "PARSER_UNAVAILABLE" }
// Local synthetic tests only. Process groups/output bounds are NOT an OS sandbox.
export async function runLocalDiagnosticProcess(executable: string, args: string[], timeoutMs = PARSER_TIMEOUT_MS, maxOutput = 4096, input: Buffer = Buffer.alloc(0)): Promise<DiagnosticProcessResult> {
  if (process.env.NODE_ENV !== "test" || !isAbsolute(executable) || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > PARSER_TIMEOUT_MS || !Number.isSafeInteger(maxOutput) || maxOutput < 1 || maxOutput > 16 * 1024 * 1024 || input.length > 16384) throw new Error("LOCAL_DIAGNOSTIC_ONLY");
  return new Promise(resolve => {
    const child = spawn(executable, args, { detached: true, cwd: "/", env: { NODE_ENV: "test", TZ: "UTC", LANG: "C", LC_ALL: "C", PATH: "/usr/bin:/bin", UV_THREADPOOL_SIZE: "1" }, stdio: ["pipe", "pipe", "pipe"] });
    let failure: DiagnosticProcessResult["failure"], outputBytes = 0, errorBytes = 0; const chunks: Buffer[] = [];
    const kill = () => { if (child.pid) { try { process.kill(-child.pid, "SIGKILL"); } catch { /* Already gone. */ } } };
    const timer = setTimeout(() => { failure = "PARSER_TIMEOUT"; kill(); }, timeoutMs);
    child.stdout.on("data", (chunk: Buffer) => { outputBytes += chunk.length; if (outputBytes > maxOutput) { failure = "PARSER_LIMIT"; kill(); } else chunks.push(chunk); });
    child.stderr.on("data", (chunk: Buffer) => { errorBytes += chunk.length; if (errorBytes > 65536) { failure = "PARSER_LIMIT"; kill(); } });
    child.on("error", () => { failure = "PARSER_UNAVAILABLE"; });
    child.stdin.on("error", () => { failure = "PARSER_UNAVAILABLE"; kill(); });
    child.stdin.end(input);
    child.on("exit", kill); // Includes descendants that try to outlive the supervisor.
    child.on("close", code => { clearTimeout(timer); resolve({ code, output: failure ? Buffer.alloc(0) : Buffer.concat(chunks), ...(failure ? { failure } : {}) }); });
  });
}
const failures: ValidationFailure[] = ["IDENTITY_MISMATCH", "DIGEST_MISMATCH", "INVALID_FILE", "FILE_LIMIT", "ACTIVE_PDF", "ENCRYPTED_PDF", "UNSUPPORTED_PDF", "PAGE_LIMIT", "IMAGE_LIMIT", "PARSER_TIMEOUT", "PARSER_LIMIT", "PARSER_UNAVAILABLE", "SANDBOX_UNAVAILABLE"];
export function createLocalDiagnosticParser(qpdfPath: string, deadlineMs = PARSER_TIMEOUT_MS): ParserPort {
  if (process.env.NODE_ENV !== "test" || !isAbsolute(qpdfPath) || !Number.isFinite(deadlineMs) || deadlineMs < 1 || deadlineMs > PARSER_TIMEOUT_MS) throw new Error("LOCAL_DIAGNOSTIC_ONLY");
  return {
    assurance: "local-test",
    async parse(file): Promise<ParserResult> {
      if (process.env.NODE_ENV !== "test") return { kind: "blocked", reason: "SANDBOX_UNAVAILABLE" };
      const compiled = join(__dirname, "parser-child.js"), source = join(__dirname, "parser-child.ts");
      // tsx is used only in source-tree tests. Compiled/pruned backend uses plain JS.
      const args = existsSync(compiled) ? [compiled] : ["--import", require.resolve("tsx"), source];
      const result = await runLocalDiagnosticProcess(process.execPath, args, deadlineMs, 4096, Buffer.from(JSON.stringify({ file, qpdfPath })));
      if (result.failure) return { kind: "blocked", reason: result.failure };
      if (result.code !== 0) return { kind: "blocked", reason: "INVALID_FILE" };
      try {
        const value: unknown = JSON.parse(result.output.toString("utf8"));
        if (!value || typeof value !== "object") throw new Error();
        const dto = value as Record<string, unknown>;
        if (Object.keys(dto).length !== 2) throw new Error();
        if (dto.kind === "parsed" && ["pdf", "jpeg", "png"].includes(String(dto.format))) return dto as ParserResult;
        if (dto.kind === "blocked" && failures.includes(dto.reason as ValidationFailure)) return dto as ParserResult;
      } catch { /* No document diagnostics cross the process boundary. */ }
      return { kind: "blocked", reason: "INVALID_FILE" };
    },
  };
}
