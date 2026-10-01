import { describe, expect, it } from "vitest";
import { forgetRentalSubmission, rentalSubmissionKey } from "../rental-submission";

function storage() {
  const values = new Map<string, string>();
  return { values, getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}
describe("rental submission recovery", () => {
  it("reuses the submission key across component lifetimes without storing contact details", async () => {
    const saved = storage();
    const payload = JSON.stringify({ email: "person@example.invalid", street: "Teststraße 1", total: 15000 });
    const first = await rentalSubmissionKey(payload, saved);
    const afterReload = await rentalSubmissionKey(payload, saved);
    expect(afterReload).toEqual(first);
    expect([...saved.values.values()].join()).not.toMatch(/person|example|Teststraße|15000/);
  });
  it("distinguishes changed orders but still recognizes a previously uncertain submission", async () => {
    const saved = storage();
    const first = await rentalSubmissionKey("order one", saved);
    const second = await rentalSubmissionKey("order two", saved);
    expect(second.key).not.toBe(first.key);
    expect(await rentalSubmissionKey("order one", saved)).toEqual(first);
    forgetRentalSubmission(first, saved);
    expect((await rentalSubmissionKey("order one", saved)).key).not.toBe(first.key);
    expect(await rentalSubmissionKey("order two", saved)).toEqual(second);
  });
  it("fails safely before submission when browser storage cannot preserve the retry key", async () => {
    const saved = storage(); saved.setItem = () => { throw new Error("quota"); };
    await expect(rentalSubmissionKey("order", saved)).rejects.toThrow(/Browser/);
  });
  it("does not discard corrupt recovery state and silently generate a new order key", async () => {
    const saved = storage();
    const first = await rentalSubmissionKey("order", saved);
    for (const key of saved.values.keys()) saved.values.set(key, "broken");
    await expect(rentalSubmissionKey("order", saved)).rejects.toThrow(/Markt/);
    expect(() => forgetRentalSubmission(first, saved)).toThrow();
  });
  it("preserves uncertain submissions at the cap instead of evicting a retry key", async () => {
    const saved = storage();
    const first = await rentalSubmissionKey("order 0", saved);
    for (let i = 1; i < 10; i++) await rentalSubmissionKey(`order ${i}`, saved);
    await expect(rentalSubmissionKey("order 10", saved)).rejects.toThrow(/Markt/);
    expect(await rentalSubmissionKey("order 0", saved)).toEqual(first);
    forgetRentalSubmission(first, saved);
    await expect(rentalSubmissionKey("order 10", saved)).resolves.toHaveProperty("key");
  });
});
