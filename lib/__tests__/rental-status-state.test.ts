import { describe, expect, it } from "vitest";
import * as status from "@/components/rentals/RentalOrderStatus";
import type { RentalOrder } from "@/lib/rental-orders/types";

const snapshot = (version: number, paymentStatus: "pending" | "paid", id = "test-order") => ({
  id, version, payment: { status: paymentStatus },
}) as RentalOrder;

describe("monotonic order status snapshots", () => {
  it("does not let an older polling response revert a paid mutation", () => {
    expect(status.chooseRentalOrderSnapshot).toBeTypeOf("function");
    const current = snapshot(4, "paid");
    expect(status.chooseRentalOrderSnapshot(current, snapshot(3, "pending"))).toBe(current);
  });
  it("retains the same-version authoritative snapshot", () => {
    expect(status.chooseRentalOrderSnapshot).toBeTypeOf("function");
    const current = snapshot(4, "paid");
    expect(status.chooseRentalOrderSnapshot(current, snapshot(4, "pending"))).toBe(current);
  });
  it("accepts a newer version for the same order", () => {
    expect(status.chooseRentalOrderSnapshot).toBeTypeOf("function");
    const next = snapshot(5, "paid");
    expect(status.chooseRentalOrderSnapshot(snapshot(4, "pending"), next)).toBe(next);
  });
  it("does not compare version counters across different order identities", () => {
    expect(status.chooseRentalOrderSnapshot).toBeTypeOf("function");
    const next = snapshot(1, "pending", "second-order");
    expect(status.chooseRentalOrderSnapshot(snapshot(20, "paid"), next)).toBe(next);
    expect(status.chooseRentalOrderSnapshot(null, next)).toBe(next);
  });
});
