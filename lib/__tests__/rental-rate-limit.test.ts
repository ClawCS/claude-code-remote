import { beforeEach, describe, expect, it, vi } from "vitest";

let rateLimit: typeof import("@/lib/rental-orders/http")["rateLimit"];
const live = { mode: "live", trustedProxy: "single-proxy-x-real-ip" } as const;
const request = (ip: string, other: Record<string, string> = {}) => new Request("https://rentals.example.invalid", { headers: { "X-Real-IP": ip, ...other } });

beforeEach(async () => {
  vi.resetModules();
  ({ rateLimit } = await import("@/lib/rental-orders/http"));
});

describe("bounded rental request limits", () => {
  it("does not let blocked attempts from one client debit the separate overload cap", () => {
    for (let i = 0; i < 10; i++) rateLimit(request("192.0.2.1"), "rental-login", live, 1000);
    for (let i = 0; i < 100; i++) expect(() => rateLimit(request("192.0.2.1"), "rental-login", live, 1000)).toThrow(expect.objectContaining({ status: 429, retryAfterSeconds: 60 }));
    for (let i = 2; i <= 91; i++) expect(() => rateLimit(request(`192.0.2.${i}`), "rental-login", live, 1000)).not.toThrow();
    expect(() => rateLimit(request("192.0.2.92"), "rental-login", live, 1001)).toThrow(expect.objectContaining({ status: 429 }));
    expect(() => rateLimit(request("192.0.2.1"), "rental-login", live, 61_000)).not.toThrow();
    expect(() => rateLimit(request("192.0.2.92"), "rental-submit", live, 1001)).not.toThrow();
  });

  it("bounds active client storage without evicting existing clients and reclaims expired buckets", () => {
    for (let i = 0; i < 1024; i++) rateLimit(request(`2001:db8::${i.toString(16)}`), "rental-webhook", live, 1000);
    expect(() => rateLimit(request("2001:db8::ffff"), "rental-webhook", live, 1000)).toThrow(expect.objectContaining({ status: 503, retryAfterSeconds: 60 }));
    expect(() => rateLimit(request("2001:db8::1"), "rental-webhook", live, 1000)).not.toThrow();
    expect(() => rateLimit(request("2001:db8::ffff"), "rental-webhook", live, 61_000)).not.toThrow();
  });

  it.each(["", "unknown", "192.0.2.1, 192.0.2.2", "192.0.2.1:1234", "fe80::1%eth0"])("rejects missing or ambiguous proxy client addresses: %s", ip => {
    expect(() => rateLimit(request(ip, { "X-Forwarded-For": "192.0.2.100" }), "rental-login", live, 1000)).toThrow(expect.objectContaining({ status: 503 }));
  });

  it("never trusts client-supplied address headers without explicit live proxy configuration", () => {
    expect(() => rateLimit(request("192.0.2.1"), "rental-login", { mode: "live" }, 1000)).toThrow(expect.objectContaining({ status: 503 }));
    expect(() => rateLimit(request("192.0.2.1"), "rental-login", { mode: "disabled" }, 1000)).toThrow(expect.objectContaining({ status: 503 }));
  });

  it("ignores forwarded headers in loopback-only test mode", () => {
    for (let i = 0; i < 10; i++) rateLimit(new Request("http://localhost:3000", { headers: { "X-Real-IP": `192.0.2.${i}` } }), "rental-login", { mode: "test" }, 1000);
    expect(() => rateLimit(new Request("http://localhost:3000", { headers: { "X-Real-IP": "192.0.2.100" } }), "rental-login", { mode: "test" }, 1000)).toThrow(expect.objectContaining({ status: 429 }));
    expect(() => rateLimit(request("192.0.2.1"), "rental-login", { mode: "test" }, 1000)).toThrow(expect.objectContaining({ status: 403 }));
  });

  it.each([
    ["2001:db8::1", "2001:0DB8:0:0:0:0:0:1"],
    ["192.0.2.1", "::ffff:192.0.2.1"],
  ])("uses one bucket for equivalent addresses %s and %s", (first, equivalent) => {
    for (let i = 0; i < 10; i++) rateLimit(request(first), "rental-login", live, 1000);
    expect(() => rateLimit(request(equivalent), "rental-login", live, 1000)).toThrow(expect.objectContaining({ status: 429 }));
  });
});
