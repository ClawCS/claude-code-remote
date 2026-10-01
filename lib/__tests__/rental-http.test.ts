import { describe, expect, it } from "vitest";
import { adminSession, validAdminSession, customerToken, validCustomerToken, assertSameOrigin, readBoundedJson, credentialMatches } from "@/lib/rental-orders/http";

const secret = "this-is-a-synthetic-test-secret-of-at-least-32-characters";

describe("rental request security", () => {
  it("expires sessions and refuses tampering or another signing key", () => {
    const token = adminSession(secret, 1000);
    expect(validAdminSession(token, secret, 2000)).toBe(true);
    expect(validAdminSession(token, secret, 1000 + 6 * 60 * 60 * 1000)).toBe(false);
    expect(validAdminSession(token + "a", secret, 2000)).toBe(false);
    expect(validAdminSession(token, secret + "other", 2000)).toBe(false);
  });
  it("binds customer access to one order and requires an exact token", () => {
    const token = customerToken("order-a", secret);
    expect(validCustomerToken("order-a", token, secret)).toBe(true);
    expect(validCustomerToken("order-b", token, secret)).toBe(false);
    expect(validCustomerToken("order-a", "", secret)).toBe(false);
    expect(credentialMatches(secret, secret)).toBe(true);
    expect(credentialMatches("", "")).toBe(false);
  });
  it("rejects missing and cross-site origins before state-changing requests", () => {
    const url = "https://market.example/api/rentals/orders";
    expect(() => assertSameOrigin(new Request(url, { headers: { Origin: "https://market.example" } }), "https://market.example")).not.toThrow();
    expect(() => assertSameOrigin(new Request(url), "https://market.example")).toThrow();
    expect(() => assertSameOrigin(new Request(url, { headers: { Origin: "https://evil.example" } }), "https://market.example")).toThrow();
  });
  it("limits streamed JSON even when content-length is absent", async () => {
    const input = new Request("https://market.example", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "a".repeat(100) }) });
    await expect(readBoundedJson(input, 30)).rejects.toThrow();
    const valid = new Request("https://market.example", { method: "POST", headers: { "Content-Type": "application/json" }, body: '{"name":"Niko"}' });
    await expect(readBoundedJson(valid)).resolves.toEqual({ name: "Niko" });
  });
});
