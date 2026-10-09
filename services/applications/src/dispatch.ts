import { sealContact } from "./contact-crypto";
import { takePrivateSnapshot, withPrivateFiles } from "./custody";
import { createMailboxRunBudget } from "./imap";
import { buildMail, verifyMail } from "./mail-manifest";
import { withReconstructedDocuments, type ReconstructedBundle } from "./reconstruction";
import { sendMail } from "./smtp";
import { utcInstant, type ArtifactKind, type CaseRecord, type DeliveryFailure, type DeliverySnapshot, type DispatchDependencies, type DispatchResult, type FindOnlyMailbox, type MailboxSearch } from "./types";

// One durable work claim, not a queue runner. Lifecycle scheduling owns the next call.
export async function runDispatchOnce(deps: DispatchDependencies): Promise<DispatchResult> {
  const repo = deps.repository, now = () => utcInstant(deps.clock.now().toISOString());
  const budget = createMailboxRunBudget();
  const claimed = repo.claimDispatchWork(deps.owner, now());
  if (!claimed) return { kind: "idle" };
  return repo.withCaseLock(claimed.case.id, async current => {
    let row: CaseRecord = current, delivery = repo.getDelivery(row.id);
    let failure: DeliveryFailure = { category: "operational", reason: "DEPENDENCY_UNAVAILABLE" };
    const authority = () => ({ id: row.id, version: row.version, token: claimed.case.claimToken });
    const update = (snapshot: DeliverySnapshot) => { row = snapshot.case; delivery = snapshot.delivery; };
    const refresh = () => repo.withCaseLock(row.id, async latest => { row = latest; delivery = repo.getDelivery(row.id); });
    const permission = (kind?: ArtifactKind) => {
      const time = now(), artifact = kind ? repo.getArtifact(row.id, kind) : null;
      if (time < row.acceptedAt || time >= row.payloadDeleteAfter || (artifact && time >= artifact.expiresAt)) {
        failure = { category: "operational", reason: "PROCESSING_EXPIRED" }; throw new Error("DELIVERY_EXPIRED");
      }
      if (kind && !artifact) { failure = { category: "operational", reason: "ARTIFACT_UNAVAILABLE" }; throw new Error("ARTIFACT_NOT_FOUND"); }
      if (claimed.case.claimKind !== "reconcile" && time >= delivery.manualRequiredAt) {
        failure = { category: "operational", reason: "MANUAL_REQUIRED" }; throw new Error("DELIVERY_EXPIRED");
      }
      return artifact;
    };
    const capture = async (email: string) => {
      permission(); failure = { category: "operational", reason: "CONTACT_UNAVAILABLE" };
      const envelope = sealContact(email, { caseId: row.id, acceptedAt: row.acceptedAt, version: 1 }, deps.keys.publicKey);
      update(await repo.storeContact(authority(), envelope, deps.keys.privateKey, now()));
    };
    const verifiedMime = async () => {
      failure = { category: "operational", reason: "ARTIFACT_UNAVAILABLE" };
      const artifact = permission("mime")!;
      if (!delivery.registered || !deps.verificationKeys.has(delivery.registered.keyId)) {
        failure = { category: "operational", reason: "VERIFICATION_FAILED" }; throw new Error("MAIL_KEY_UNAVAILABLE");
      }
      return deps.artifacts.withMime(row.id, async raw => {
        permission("mime");
        const verification = await verifyMail(raw, delivery.registered!, deps.verificationKeys);
        if (verification.kind !== "verified") { failure = { category: "operational", reason: "VERIFICATION_FAILED" }; throw new Error("MIME_VERIFICATION_REQUIRED"); }
        permission("mime"); return { artifact, verification };
      });
    };
    try {
      if (row.claimToken !== claimed.case.claimToken || row.claimKind !== claimed.case.claimKind) throw new Error("STALE_CLAIM");
      permission();
      if (claimed.case.claimKind === "prepare") {
        const compose = async (bundle: ReconstructedBundle) => {
          permission("bundle"); await capture(bundle.input.email);
          failure = { category: "operational", reason: "DEPENDENCY_UNAVAILABLE" };
          // A persisted key ID is authoritative even if the configured active key changed.
          const keyId = delivery.identity?.keyId ?? deps.signingKeyId, key = deps.signingKeys.get(keyId);
          if (!key || !deps.verificationKeys.has(keyId)) throw new Error("MAIL_KEY_UNAVAILABLE");
          update(await repo.stageDeliveryIdentity(authority(), keyId, now()));
          const prepared = await buildMail(bundle, delivery.identity!, key);
          update(await repo.stageRegisteredMail(authority(), prepared.registered, now()));
          permission("bundle"); failure = { category: "operational", reason: "ARTIFACT_UNAVAILABLE" };
          await deps.artifacts.adoptMime(row.id, prepared.raw, row.version); await refresh();
        };
        if (!repo.getArtifact(row.id, "mime")) {
          if (repo.getArtifact(row.id, "bundle")) {
            permission("bundle"); await deps.artifacts.withBundle(row.id, compose);
          } else {
            failure = { category: "operational", reason: "CONTACT_UNAVAILABLE" };
            const original = repo.getCommittedIntake(row.id);
            if (!original) throw new Error("ORIGINAL_UNAVAILABLE");
            permission(); const snapshot = await takePrivateSnapshot(original, deps.keys);
            permission(); await capture(snapshot.input.email);
            failure = { category: "operational", reason: "DEPENDENCY_UNAVAILABLE" };
            permission();
            await withPrivateFiles(snapshot, deps.keys, processing => withReconstructedDocuments(processing, deps.reconstruction, async bundle => {
              permission(); failure = { category: "operational", reason: "ARTIFACT_UNAVAILABLE" };
              await deps.artifacts.adoptBundle(bundle, row.version); await refresh();
              await compose(bundle);
            }));
          }
        }
        // Reopen adopted bytes; the composition result is never verification evidence.
        const checked = await verifiedMime();
        if (repo.getCommittedIntake(row.id)) {
          permission("bundle"); await repo.retireOriginal(row.id, row.version); await refresh();
        }
        update(await repo.bindVerifiedMime(authority(), checked.artifact, checked.verification, now()));
      } else if (claimed.case.claimKind === "send") {
        const checked = await verifiedMime();
        // A second authenticated open supplies a fresh source. Never reuse the
        // verifier's consumed iterable or let plaintext outlive withMime.
        permission("mime");
        await deps.artifacts.withMime(row.id, async raw => {
          permission("mime");
          update(await repo.beginSendAttempt(authority(), checked.artifact, checked.verification, now()));
          const transport = deps.createSmtp();
          try { permission("mime"); }
          catch (error) { try { transport.close(); } catch { /* Preserve the durable intent's uncertainty. */ } throw error; }
          const outcome = await sendMail({ registered: delivery.registered!, raw }, transport);
          update(await repo.finishSendAttempt(authority(), outcome, now()));
        });
      } else {
        await verifiedMime();
        let result: MailboxSearch = { complete: false, copies: [], issues: ["DEPENDENCY_UNAVAILABLE"] };
        let mailbox: FindOnlyMailbox | undefined;
        try { mailbox = deps.createMailbox(budget); result = await mailbox.findVerified(delivery.registered!); }
        catch { result = { complete: false, copies: [], issues: ["CONNECTION_FAILED"] }; }
        finally { try { await mailbox?.disconnect(); } catch { result = { complete: false, copies: [], issues: ["CONNECTION_FAILED"] }; } }
        permission("mime");
        try { update(await repo.recordMailboxCheck(authority(), delivery.registered!, result, now())); }
        catch (error) {
          if (!(error instanceof Error) || error.message !== "INVALID_DELIVERY_METADATA") throw error;
          // Malformed/conflicting candidate evidence consumes a slot, never resends.
          update(await repo.recordMailboxCheck(authority(), delivery.registered!, { complete: false, copies: [], issues: ["CONTENT_MISMATCH"] }, now()));
        }
      }
    } catch (error) {
      await refresh();
      if (row.claimToken !== claimed.case.claimToken) throw new Error("DISPATCH_STATE_UNAVAILABLE");
      if (row.deliveryState === "sending") {
        // Neither factory errors nor lost outcome writes prove an SMTP failure.
        update(await repo.releaseDeliveryClaim(authority(), now()));
      } else {
        const code = error instanceof Error ? error.message : "";
        if (claimed.case.claimKind === "prepare" && failure.reason === "DEPENDENCY_UNAVAILABLE") {
          if (code === "INFECTED") failure = { category: "invalid", reason: "MALICIOUS_INPUT" };
          else if (["IDENTITY_MISMATCH", "INVALID_FILE", "FILE_LIMIT", "ACTIVE_PDF", "ENCRYPTED_PDF", "UNSUPPORTED_PDF", "PAGE_LIMIT", "IMAGE_LIMIT", "INVALID_REPLY_TO", "INVALID_MAIL_TEXT"].includes(code)) failure = { category: "invalid", reason: "INVALID_INPUT" };
        }
        update(await repo.recordDeliveryFailure(authority(), failure, now()));
      }
    }
    const time = now(), terminal = row.deliveryState === "delivered" || row.deliveryState === "needs_attention";
    return { kind: "processed", id: row.id, work: claimed.case.claimKind, state: row.deliveryState, reason: delivery.reason,
      incidentDue: row.deliveryState !== "delivered" && time >= delivery.incidentAt,
      manualRequired: row.deliveryState !== "delivered" && time >= delivery.manualRequiredAt,
      nextDueAt: terminal ? null : delivery.sendDueAt ?? delivery.receiptSchedule[delivery.receiptCursor] ?? null };
  });
}
