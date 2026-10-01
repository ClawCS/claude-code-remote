type SubmissionStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;
type PendingSubmission = { fingerprint: string; key: string };
const STORAGE_KEY = "jammers-rental-pending-submissions-v1";
const RECOVERY_ERROR = "Die Bestellwiederholung kann im Browser nicht sicher gespeichert werden. Bitte den Markt kontaktieren, bevor du erneut bestellst.";

function readPending(storage: SubmissionStorage): Record<string, string> {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return {};
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
    const entries = Object.entries(value);
    if (entries.length > 10 || entries.some(([hash, key]) => !/^[a-f0-9]{64}$/.test(hash) || typeof key !== "string" || !/^[a-f0-9-]{36}$/.test(key))) throw new Error();
    return Object.fromEntries(entries);
  } catch { throw new Error(RECOVERY_ERROR); }
}

/** Tab-scoped retry protection. Never store the customer's address or request body. */
export async function rentalSubmissionKey(payload: string, storage: SubmissionStorage): Promise<PendingSubmission> {
  const fingerprint = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(payload))), byte => byte.toString(16).padStart(2, "0")).join("");
  const pending = readPending(storage);
  if (pending[fingerprint]) return { fingerprint, key: pending[fingerprint] };
  if (Object.keys(pending).length >= 10) throw new Error(RECOVERY_ERROR);
  const key = crypto.randomUUID();
  try { storage.setItem(STORAGE_KEY, JSON.stringify({ ...pending, [fingerprint]: key })); }
  catch { throw new Error(RECOVERY_ERROR); }
  return { fingerprint, key };
}

export function forgetRentalSubmission(submission: PendingSubmission, storage: SubmissionStorage): void {
  const pending = readPending(storage);
  if (pending[submission.fingerprint] !== submission.key) return;
  delete pending[submission.fingerprint];
  if (Object.keys(pending).length) storage.setItem(STORAGE_KEY, JSON.stringify(pending));
  else storage.removeItem(STORAGE_KEY);
}
