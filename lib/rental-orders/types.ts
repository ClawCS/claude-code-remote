import type { RentalQuote, RentalSelection } from "@/lib/rental-pricing";

export type RentalPaymentMethod = "online" | "cash";
export type RentalOrderStatus = "submitted" | "accepted" | "declined" | "handed_over" | "returned";
export type RentalPaymentStatus = "not_requested" | "pending" | "paid" | "failed" | "canceled" | "expired";
export type RentalMailEvent = "received" | "accepted" | "declined" | "paid" | "handed_over" | "returned";
export type RentalCustomer = {
  name: string; email: string; phone: string; street: string; postalCode: string;
  city: string; country: string; company?: string; notes?: string;
};
export type RentalIssuer = {
  name: string; address: string[]; taxNumber: string; vatRateBps: number; invoicePrefix: string;
};
export type RentalDocumentRecord = { number: string; issuedAt: string };
export type RentalOrder = {
  id: string; number: string; createdAt: string; updatedAt: string; version: number;
  status: RentalOrderStatus; paymentMethod: RentalPaymentMethod;
  payment: { status: RentalPaymentStatus; id?: string; url?: string; attempt: number };
  customer: RentalCustomer; quote: RentalQuote; termsVersion: string; termsText: string; privacyText: string; testMode: boolean;
  issuer: RentalIssuer; invoice?: RentalDocumentRecord; deliveryNote?: RentalDocumentRecord;
  events: { at: string; type: string; note?: string }[];
};
export type RentalSubmitInput = {
  items: RentalSelection[]; customer: RentalCustomer; paymentMethod: RentalPaymentMethod;
  expectedTotalCents: number; termsVersion: string; acceptedTerms: boolean;
};
export type RentalGatewayPayment = {
  id: string; url: string; status: RentalPaymentStatus; orderId: string;
  amountCents: number; currency: string;
};
export interface RentalPaymentGateway {
  createPayment(input: { orderId: string; orderNumber: string; amountCents: number;
    redirectUrl: string; webhookUrl: string; idempotencyKey: string }): Promise<RentalGatewayPayment>;
  getPayment(id: string): Promise<RentalGatewayPayment>;
}
export type RentalMailMessage = {
  to: string; subject: string; text: string; messageId: string;
  attachments: { filename: string; content: Uint8Array }[];
};
export interface RentalMailSender { send(message: RentalMailMessage): Promise<{ id: string }>; }
export type RentalOutboxJob = {
  id: string; orderId: string; event: RentalMailEvent; recipient: "customer" | "market";
  state: "pending" | "sending" | "sent"; attempts: number; createdAt: string;
  nextAttemptAt: string; leaseUntil?: string; sentAt?: string; error?: string;
};
export type RentalPublicConfig = {
  enabled: boolean; testMode: boolean; onlinePayment: boolean; termsVersion: string;
  termsText: string; privacyText: string; message: string;
};
