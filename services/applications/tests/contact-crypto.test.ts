import { describe, expect, it } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import { sealContact, openContact } from "../src/contact-crypto";
import { applicationId, utcInstant } from "../src/types";
import { sealName } from "../src/crypto";

const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
const otherKeys = generateKeyPairSync("rsa", { modulusLength: 2048 });
const binding = { caseId: applicationId("00000000-0000-4000-8000-000000000001"), acceptedAt: utcInstant("2026-10-09T10:00:00.000Z"), version: 1 as const };
describe("minimized case-bound contact", () => {
  it("authenticates the email independently of randomized ciphertext", () => {
    const a = sealContact("synthetic@example.test", binding, keys.publicKey);
    const b = sealContact("synthetic@example.test", binding, keys.publicKey);
    expect(a).not.toBe(b);
    expect(openContact(a, binding, keys.privateKey)).toBe("synthetic@example.test");
    expect(openContact(b, binding, keys.privateKey)).toBe("synthetic@example.test");
    expect(a).not.toContain("synthetic"); expect(a.length).toBeLessThanOrEqual(2752);
  });
  it("rejects different case, acceptance, key, version, tampering and name envelopes", () => {
    const value = sealContact("synthetic@example.test", binding, keys.publicKey);
    const changed = Buffer.from(value, "base64"); changed[changed.length - 1] ^= 1;
    for (const [envelope, identity, key] of [
      [value, { ...binding, caseId: applicationId("00000000-0000-4000-8000-000000000002") }, keys.privateKey],
      [value, { ...binding, acceptedAt: utcInstant("2026-10-09T10:00:00.001Z") }, keys.privateKey],
      [value, binding, otherKeys.privateKey],
      [value, { ...binding, version: 2 }, keys.privateKey],
      [changed.toString("base64"), binding, keys.privateKey],
      [sealName("Synthetic", keys.publicKey), binding, keys.privateKey],
      ["A".repeat(2756), binding, keys.privateKey], [value + "\n", binding, keys.privateKey],
    ] as const) expect(() => openContact(envelope, identity, key)).toThrow("CONTACT_AUTHENTICATION_FAILED");
  });
  it.each(["", "Display <a@example.test>", "a@example.test,b@example.test", "a@example.test\r\nBcc:x@example.test", "a..b@example.test", ".a@example.test", "a.@example.test", "ü@example.test", "a".repeat(65) + "@example.test", "a@" + "b".repeat(64) + ".test", "a@localhost", "a".repeat(255)])("fails closed for malformed or oversized email %j", email => {
    expect(() => sealContact(email, binding, keys.publicKey)).toThrow("INVALID_CONTACT");
  });
});
