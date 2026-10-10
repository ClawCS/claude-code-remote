import { expect, it } from "vitest";
import * as client from "@/lib/applications-client";

const config = { enabled: true, mode: "enabled", limits: { maxFiles: 5, maxFileBytes: 5242880, maxTotalBytes: 10485760 }, jobs: [{ id: "sales-fulltime", label: "Verkauf Vollzeit (m/w/d)" }, { id: "sales-parttime", label: "Verkauf Teilzeit bis zu 150 Stunden/Monat (m/w/d)" }] };
it("rejects array-valued enums without string coercion", () => {
  for (const mode of ["disabled", "enabled", "pilot"]) expect(client.validateApplicationConfig({ ...config, mode: [mode] })).toBeNull();
  expect(client.validateApplicationConfig({ ...config, jobs: [{ ...config.jobs[0], id: ["sales-fulltime"] }, config.jobs[1]] })).toBeNull();
  for (const state of ["processing", "delivered", "needs_attention"]) expect(client.validateApplicationStatus({ reference: "TJ-" + "A".repeat(24), state: [state], acceptedAt: "2026-10-10T12:00:00.000Z" })).toBeNull();
  expect(client.validateApplicationAcceptance({ reference: "TJ-" + "A".repeat(24), state: ["processing"], statusToken: "A".repeat(43) })).toBeNull();
  for (const code of ["RATE_LIMITED", "CAPACITY_EXCEEDED"]) expect(client.applicationOutcome(429, { code: [code], error: "private" })).toBe("ambiguous");
});
it("validates exact operating shapes without promoting outage or unauthenticated pilot", () => {
  expect(client.validateApplicationConfig(config)).toEqual(config);
  expect(client.validateApplicationConfig({ ...config, mode: "disabled" })).toBeNull();
  expect(client.validateApplicationConfig({ ...config, enabled: false })).toMatchObject({ enabled: false, mode: "enabled" });
  expect(client.validateApplicationConfig({ ...config, secret: "canary" })).toBeNull();
  expect(client.validateApplicationConfig({ ...config, jobs: [config.jobs[0], config.jobs[0]] })).toBeNull();
  expect(client.validateApplicationConfig({ ...config, limits: { ...config.limits, maxFiles: 6 } })).toBeNull();
  expect(client.validateApplicationConfig({ ...config, jobs: [{ ...config.jobs[0], label: "x".repeat(161) }, config.jobs[1]] })).toBeNull();
});
it("accepts only a strict persisted processing receipt and exact proof token", () => {
  const value = { reference: "TJ-" + "A".repeat(24), state: "processing", statusToken: "A".repeat(43) };
  expect(client.validateApplicationAcceptance(value)).toEqual(value);
  expect(client.validateApplicationAcceptance({ ...value, state: "delivered" })).toBeNull();
  expect(client.validateApplicationAcceptance({ ...value, statusToken: "invalid" })).toBeNull();
  expect(client.validateApplicationAcceptance({ ...value, name: "CANARY" })).toBeNull();
  expect(client.validateApplicationStatus({ reference: value.reference, state: "delivered", acceptedAt: "2026-10-10T12:00:00.000Z" })).toMatchObject({ state: "delivered" });
  expect(client.validateApplicationStatus({ reference: value.reference, state: "delivered", acceptedAt: "yesterday" })).toBeNull();
});
it("keeps session framing strict and validates inclusive native-file budgets",()=>{
  const session={formToken:"A".repeat(80)+"."+"A".repeat(43)};
  expect(client.validateApplicationSession(session)).toEqual(session);
  expect(client.validateApplicationSession({...session,private:"CANARY"})).toBeNull();
  expect(client.validateApplicationSession({formToken:"A".repeat(2048)+"."+"A".repeat(43)})).toBeNull();
  const files=[new File([new Uint8Array(5242880)],"one.pdf",{type:"application/pdf"}),new File([new Uint8Array(5242880)],"two.pdf",{type:"application/pdf"})];
  expect(client.selectApplicationFiles([],files).files).toEqual(files);
  const small=Array.from({length:5},(_,index)=>new File(["x"],`${index}.png`,{type:"image/png"}));
  expect(client.selectApplicationFiles([],small).files).toEqual(small);
  const bad=client.selectApplicationFiles(small,[new File(["x"],"extra.png",{type:"image/png"})]);expect(bad.files).toBe(small);expect(bad.error).toBeDefined();
});
it("projects exact rejection combinations and treats malformed success or unknown errors as ambiguous", () => {
  expect(client.applicationOutcome(400, { code: "INVALID_REQUEST", error: "arbitrary canary" })).toBe("correctable");
  expect(client.applicationOutcome(413, { code: "PAYLOAD_TOO_LARGE", error: "private" })).toBe("correctable");
  expect(client.applicationOutcome(409, { code: "IDEMPOTENCY_CONFLICT", error: "private" })).toBe("conflict");
  expect(client.applicationOutcome(409, { code: "UPLOAD_IN_PROGRESS", error: "private" })).toBe("retry");
  expect(client.applicationOutcome(403, { code: "FORBIDDEN", error: "private" })).toBe("session");
  expect(client.applicationOutcome(400, { code: "WORKER_UNAVAILABLE", error: "private" })).toBe("ambiguous");
  expect(client.applicationOutcome(503, { code: "WORKER_UNAVAILABLE", error: "private" })).toBe("ambiguous");
  expect(client.applicationOutcome(202, { reference: "CANARY" })).toBe("ambiguous");
});
it("never shortens Retry-After and bounds same-attempt user retry count and horizon", () => {
  expect(client.applicationRetryDelay("3600")).toBe(3600000);
  for (const value of [null, "0", "-1", "1.5", "3601", "Infinity", "Fri, 10 Oct"]) expect(client.applicationRetryDelay(value)).toBe(60000);
  expect(client.mayRetryApplication({ firstAt: 0, submissions: 1, notBefore: 60000 }, 59999)).toBe(false);
  expect(client.mayRetryApplication({ firstAt: 0, submissions: 2, notBefore: 60000 }, 60000)).toBe(true);
  expect(client.mayRetryApplication({ firstAt: 0, submissions: 3, notBefore: 60000 }, 60000)).toBe(false);
  expect(client.mayRetryApplication({ firstAt: 0, submissions: 1, notBefore: 3600000 }, 3600000)).toBe(false);
});
it("validates bounded native File selection before retaining references and rejects only exact object duplicates", () => {
  const one = new File(["x"], "synthetic.pdf", { type: "application/pdf" });
  const sameMetadata = new File(["y"], "synthetic.pdf", { type: "application/pdf" });
  expect(client.selectApplicationFiles([one], [one]).error).toBeDefined();
  expect(client.selectApplicationFiles([one], [sameMetadata]).files).toEqual([one, sameMetadata]);
  expect(client.selectApplicationFiles([], [new File(["x"], "active.svg", { type: "image/svg+xml" })]).error).toBeDefined();
  expect(client.selectApplicationFiles([], Array.from({ length: 6 }, () => new File(["x"], "x.pdf", { type: "application/pdf" }))).error).toBeDefined();
  expect(client.selectApplicationFiles([], [new File([new Uint8Array(5242881)], "x.pdf", { type: "application/pdf" })]).error).toBeDefined();
  expect(client.selectApplicationFiles([], Array.from({ length: 3 }, () => new File([new Uint8Array(4000000)], "x.png", { type: "image/png" }))).error).toBeDefined();
});
it("bounds streamed JSON before parsing and rejects wrong types and redirects", async () => {
  expect(await client.readApplicationJson(new Response('{"enabled":false}', { headers: { "content-type": "application/json" } }))).toEqual({ enabled: false });
  await expect(client.readApplicationJson(new Response("x".repeat(8193), { headers: { "content-type": "application/json" } }))).rejects.toThrow("APPLICATION_RESPONSE_INVALID");
  await expect(client.readApplicationJson(new Response("{}", { headers: { "content-type": "text/html" } }))).rejects.toThrow("APPLICATION_RESPONSE_INVALID");
  await expect(client.readApplicationJson(new Response("{}", { status: 302, headers: { "content-type": "application/json" } }))).rejects.toThrow("APPLICATION_RESPONSE_INVALID");
  await expect(client.readApplicationJson(new Response(new Uint8Array([0xff]), { headers: { "content-type": "application/json" } }))).rejects.toThrow("APPLICATION_RESPONSE_INVALID");
});
