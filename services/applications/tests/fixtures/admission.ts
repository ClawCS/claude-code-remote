import { randomBytes } from "node:crypto";
import { digest } from "../../src/types";
// Unrelated capacity/custody regressions use independent local quota subjects.
// Application identity remains the original sessionHash/idempotencyKey.
export function testAdmission() {
  if (process.env.NODE_ENV !== "test") throw new Error("TEST_ONLY");
  return { abuse: { sessionKey: digest(randomBytes(32).toString("hex")), ipKey: digest(randomBytes(32).toString("hex")) }, submission: { kind: "application" as const } };
}
export const testReadiness = { getIntakeReadiness: () => ({ ready: true }) };
