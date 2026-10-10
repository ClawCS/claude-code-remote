import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { admissionScopeAccepts, copyAssociation, registrationAssociation, sameDeletionScope, snapshotAdmissionScope, snapshotDeletionScope } from "../src/deletion-association";
import { applicationId, digest, type RegisteredMail, type VerifiedCopy } from "../src/types";

const epoch = "4".repeat(32), at = "2026-10-10T12:00:00.000Z";
const admission = [epoch, "synthetic", "pilot-1", "2026-10-01T00:00:00.000Z", "2026-11-01T00:00:00.000Z"];
function scope() { return { ledgerId: "1".repeat(32), historyEpoch: "2".repeat(32), associationKeyId: "association-key", associationKey: Buffer.alloc(32, 9), approvedScopes: [[...admission]] }; }
function mail(): RegisteredMail { return { id: applicationId("11111111-1111-4111-8111-111111111111"), messageId: "<synthetic@trinkgut-jammers.de>", keyId: "mime-key", profile: "tj-mail-1", fingerprint: digest("5".repeat(64)), shape: { kind: "text", parts: 1, attachments: [] } }; }
function copy(mailbox = "INBOX"): VerifiedCopy { return { mailbox, uidValidity: "1", uid: 2, fingerprint: digest("5".repeat(64)) }; }
const expectedRegistration = '["11111111111111111111111111111111","22222222222222222222222222222222","association-key","44444444444444444444444444444444","11111111-1111-4111-8111-111111111111","<synthetic@trinkgut-jammers.de>","mime-key","tj-mail-1","5555555555555555555555555555555555555555555555555555555555555555","text","1","0"]';

describe("bounded deletion association and independent scopes", () => {
  it("uses the exact domain and ordered flat registration preimage with a dedicated key", () => {
    const context = snapshotDeletionScope(scope());
    const expected = createHmac("sha256", Buffer.alloc(32, 9)).update("tj-deletion-registration-v1\n" + expectedRegistration).digest("hex");
    expect(registrationAssociation(context, epoch, mail())).toBe(expected);
    expect(registrationAssociation(snapshotDeletionScope({ ...scope(), associationKey: Buffer.alloc(32, 8) }), epoch, mail())).not.toBe(expected);
    expect(registrationAssociation(context, epoch, { ...mail(), keyId: "other-key" })).not.toBe(expected);
  });
  it("uses the exact copy preimage without mailbox normalization or exposing the route", () => {
    const context = snapshotDeletionScope(scope()), registration = "6".repeat(64);
    const preimage = '["6666666666666666666666666666666666666666666666666666666666666666","canary@example.invalid/\\\"Archive\\\\","1","2","5555555555555555555555555555555555555555555555555555555555555555"]';
    const actual = copyAssociation(context, registration, copy('canary@example.invalid/"Archive\\'));
    expect(actual).toBe(createHmac("sha256", Buffer.alloc(32, 9)).update("tj-deletion-copy-v1\n" + preimage).digest("hex"));
    expect(actual).toMatch(/^[a-f0-9]{64}$/);
    expect(copyAssociation(context, registration, copy("é"))).not.toBe(copyAssociation(context, registration, copy("e\u0301")));
    expect(copyAssociation(context, registration, copy("Inbox"))).not.toBe(copyAssociation(context, registration, copy("INBOX")));
  });
  it("accepts valid Unicode and exact canonical unsigned 32-bit copy coordinates", () => {
    const context = snapshotDeletionScope(scope());
    for (const mailbox of ["界".repeat(4096), "😀".repeat(2048), '"\\', "INBOX"]) {
      expect(copyAssociation(context, "6".repeat(64), { ...copy(mailbox), uidValidity: "4294967295", uid: 4294967295 })).toMatch(/^[a-f0-9]{64}$/);
    }
    const preimage = "tj-deletion-copy-v1\n" + JSON.stringify(["6".repeat(64), "界".repeat(4096), "4294967295", "4294967295", "5".repeat(64)]);
    expect(Buffer.byteLength(preimage)).toBe(12472);
    expect(copyAssociation(context, "6".repeat(64), { ...copy("界".repeat(4096)), uidValidity: "4294967295", uid: 4294967295 })).toBe(createHmac("sha256", Buffer.alloc(32, 9)).update(preimage).digest("hex"));
  });
  it.each([
    { mailbox: "" }, { mailbox: "x".repeat(4097) }, { mailbox: "\ud800" }, { mailbox: "\udc00" }, { mailbox: "a\u0000b" }, { mailbox: "a\u007fb" },
    { uidValidity: "01" }, { uidValidity: "0" }, { uidValidity: "4294967296" }, { uidValidity: 1 }, { uid: 0 }, { uid: 4294967296 }, { uid: 1.5 }, { fingerprint: "not-a-digest" }, { extra: true },
  ])("rejects invalid copy before creating an association: %j", patch => {
    expect(() => copyAssociation(snapshotDeletionScope(scope()), "6".repeat(64), { ...copy(), ...patch } as unknown as VerifiedCopy)).toThrow("DELETION_ASSOCIATION_INVALID");
  });
  it("binds every ordered attachment field and accepts the maximum current registration profile", () => {
    const source = { ...scope(), associationKeyId: "a".repeat(32) }, context = snapshotDeletionScope(source);
    const files = Array.from({ length: 5 }, (_, i) => ({ name: `document-${i + 1}.pdf`, mediaType: "application/pdf", digest: digest(String(i).repeat(64)), bytes: 1000000 }));
    const full: RegisteredMail = { ...mail(), messageId: `<${"m".repeat(120)}@trinkgut-jammers.de>`, keyId: "k".repeat(64), shape: { kind: "mixed", parts: 7, attachments: files } };
    const preimage = "tj-deletion-registration-v1\n" + JSON.stringify([source.ledgerId, source.historyEpoch, source.associationKeyId, epoch, full.id, full.messageId, full.keyId, "tj-mail-1", full.fingerprint, "mixed", "7", "5", ...files.flatMap(f => [f.name, f.mediaType, f.digest, "1000000"])]);
    expect(Buffer.byteLength(preimage)).toBe(1075);
    const original = registrationAssociation(context, epoch, full);
    expect(original).toBe(createHmac("sha256", Buffer.alloc(32, 9)).update(preimage).digest("hex"));
    for (const patch of [{ bytes: 999999 }, { digest: digest("f".repeat(64)) }, { name: "document-1.png", mediaType: "image/png" }]) {
      expect(registrationAssociation(context, epoch, { ...full, shape: { ...full.shape, attachments: [{ ...files[0], ...patch }, ...files.slice(1)] } })).not.toBe(original);
    }
  });
  it.each([
    { profile: "other" }, { id: "bad" }, { messageId: "<foreign@example.invalid>" }, { keyId: "k".repeat(65) }, { fingerprint: "bad" }, { extra: true },
    { shape: { kind: "text", parts: 2, attachments: [] } }, { shape: { kind: "mixed", parts: 2, attachments: [] } },
    { shape: { kind: "text", parts: 1, attachments: [], extra: true } },
    ...[0, 5242881, 1.5].map(bytes => ({ shape: { kind: "mixed", parts: 3, attachments: [{ name: "document-1.pdf", mediaType: "application/pdf", digest: "a".repeat(64), bytes }] } })),
    ...["not-generated.pdf", "document-2.pdf"].map(name => ({ shape: { kind: "mixed", parts: 3, attachments: [{ name, mediaType: "application/pdf", digest: "a".repeat(64), bytes: 1 }] } })),
  ])("rejects incomplete or altered registration profile: %j", patch => {
    expect(() => registrationAssociation(snapshotDeletionScope(scope()), epoch, { ...mail(), ...patch } as RegisteredMail)).toThrow("DELETION_ASSOCIATION_INVALID");
  });
  it("rejects count/aggregate overflow and never serializes hostile oversized DTOs", () => {
    const context = snapshotDeletionScope(scope()); let serialized = false;
    const hostile = { ...mail(), toJSON() { serialized = true; return {}; } };
    expect(() => registrationAssociation(context, epoch, hostile)).toThrow(); expect(serialized).toBe(false);
    for (const bytes of [[5242880, 5242880, 1], [1, 1, 1, 1, 1, 1]]) {
      const attachments = bytes.map((value, i) => ({ name: `document-${i + 1}.pdf`, mediaType: "application/pdf", digest: digest("a".repeat(64)), bytes: value }));
      expect(() => registrationAssociation(context, epoch, { ...mail(), shape: { kind: "mixed", parts: attachments.length + 2, attachments } })).toThrow();
    }
    expect(registrationAssociation(context, epoch, { ...mail(), shape: { kind: "mixed", parts: 4, attachments: [1, 2].map(i => ({ name: `document-${i}.pdf`, mediaType: "application/pdf", digest: digest("a".repeat(64)), bytes: 5242880 })) } })).toMatch(/^[a-f0-9]{64}$/);
  });
  it("checks half-open scope intervals, exact submission and independent deletion approval", () => {
    const approved = snapshotAdmissionScope(admission);
    expect(admissionScopeAccepts(approved, { kind: "synthetic", pilotRunId: "pilot-1" }, "2026-10-01T00:00:00.000Z")).toBe(true);
    expect(admissionScopeAccepts(approved, { kind: "synthetic", pilotRunId: "pilot-1" }, "2026-11-01T00:00:00.000Z")).toBe(false);
    expect(admissionScopeAccepts(approved, { kind: "synthetic", pilotRunId: "pilot-2" }, at)).toBe(false);
    expect(admissionScopeAccepts(approved, { kind: "application" }, at)).toBe(false);
    expect(() => registrationAssociation(snapshotDeletionScope(scope()), "9".repeat(32), mail())).toThrow();
  });
  it.each([
    null, [], [...admission, "extra"], [epoch, "application", "pilot", admission[3], null], [epoch, "synthetic", null, admission[3], null],
    [epoch, "synthetic", "bad pilot", admission[3], null], [epoch, "synthetic", "pilot-1", at, at],
    [epoch, "synthetic", "pilot-1", "2026-10-01T00:00:00Z", null], [epoch, "synthetic", "pilot-1", at, admission[3]],
  ])("rejects malformed admission scope %j", input => expect(() => snapshotAdmissionScope(input)).toThrow());
  it.each([
    { associationKey: Buffer.alloc(31) }, { associationKey: Buffer.alloc(33) }, { associationKey: "not-a-key" }, { associationKeyId: "A" }, { ledgerId: "wrong" }, { historyEpoch: "wrong" },
    { approvedScopes: [] }, { approvedScopes: new Array(1) }, { approvedScopes: [admission, admission] }, { approvedScopes: Array(17).fill(admission) }, { extra: true },
  ])("rejects unavailable/malformed independent deletion context %j", patch => expect(() => snapshotDeletionScope({ ...scope(), ...patch })).toThrow());
  it("deep-copies key and scope primitives and detects every security-relevant change", () => {
    const source = scope(), first = snapshotDeletionScope(source), second = snapshotDeletionScope(source);
    expect(sameDeletionScope(first, second)).toBe(true);
    source.associationKey[0] = 3; source.approvedScopes[0][2] = "pilot-other";
    expect(first.associationKey[0]).toBe(9); expect(first.approvedScopes[0][2]).toBe("pilot-1");
    for (const patch of [{ associationKey: Buffer.alloc(32, 8) }, { associationKeyId: "other" }, { ledgerId: "7".repeat(32) }, { historyEpoch: "8".repeat(32) }, { approvedScopes: [[...admission.slice(0, 2), "pilot-other", ...admission.slice(3)]] }]) {
      expect(sameDeletionScope(first, snapshotDeletionScope({ ...scope(), ...patch }))).toBe(false);
    }
  });
});
