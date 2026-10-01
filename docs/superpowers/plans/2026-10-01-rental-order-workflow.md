# Rental order workflow implementation plan

> **For agentic workers:** Use the agreed task boundaries below. The user explicitly approved this four-step workflow and requested implementation on 1 October 2026. Execute within this existing worktree; do not request another implementation approval.

**Goal:** Customers see complete rental prices and submit an order; the market accepts availability, then requests online payment or records cash at pickup; customer and market receive the appropriate invoice and delivery note.

**Architecture:** A shared date-only pricing module feeds the UI and server. A durable SQLite order store controls transitions, reservation conflicts and an independent mail outbox. Hosted payment and SMTP adapters connect only through configured server credentials; a loopback-only test mode exercises the full workflow without external delivery or charges.

**Tech Stack:** Next.js App Router, TypeScript, native node:sqlite (Node 22.13+), existing pdf-lib, Nodemailer, Mollie REST adapter, Vitest and Playwright.

**Spec:** docs/superpowers/specs/2026-09-30-rental-order-design.md, updated by the operator's explicit four-step implementation request on 1 October.

## Global constraints

- All amounts are integer EUR cents. Base prices include VAT and apply per started block of three workdays.
- Monday–Saturday count except NRW public holidays; pickup/return counted inclusively; date-only arithmetic independent of runtime timezone and DST.
- Unknown prices or mixed product/rental inquiries cannot produce a complete payable total.
- Contract only on explicit market acceptance. Payment never requested before acceptance. No paid status from a browser redirect.
- Invoices follow acceptance and retain one number; delivery notes follow actual handover. Customer and market get separate outbox jobs.
- Live configuration must explicitly provide issuer/tax details, approved terms, no-extra-charge/self-pickup policy for the supported initial flow, market inbox, sender, persistent storage, admin secrets and HTTPS origin. Missing settings keep actual ordering disabled; no unknown values become zero silently.
- Test mode is loopback-only, marked visibly, uses synthetic issuer data and captured mail. Live activation, real messages and financial transactions are outside this local implementation run.
- Original Canva/Instagram content and unrelated dirty screenshots remain untouched. Root handles commits and pushes.

## Review focus

- Four rental workdays must charge two full blocks; October DST, Easter, NRW holidays and same-day rentals need real behavioral tests.
- Same idempotency key cannot create two orders or accept changed payload; concurrent acceptance cannot overbook stock or shared furniture.
- Forged client prices, unauthorized admin actions and cross-origin writes must fail before mutation.
- Retried payment creation/webhooks/outbox sends must not create duplicate orders, invoices or known completed sends; unknown SMTP outcomes remain visible.
- Long customer/item text and multipage PDFs remain readable; invoice versus handover facts are correct.

## Task 1: Calendar and quote engine

Own `lib/rental-pricing.ts`, `lib/utils.ts` calendar helpers and relevant tests. Export `RentalSelection`, `RentalQuoteLine`, `RentalQuote` and `quoteRentals`. Interfaces are specified in the task brief; no UI/server store edits.

- [x] Red tests for DST, all NRW holidays, block boundaries, invalid dates, unpriced rows, cents, stock/furniture overlaps.
- [x] Implement date-only calendar and canonical server/client quote using the current rental catalog.
- [x] Run focused tests; preserve existing inquiry compatibility.

## Task 2: Durable orders and runtime configuration

Own `lib/rental-orders/config.ts`, `store.ts`, `service.ts` and tests. Use shared `types.ts` and pricing exports. Export a `RentalOrderService` with injected gateway/sender and a SQLite store. No route/UI/integration adapter edits.

- [x] Red tests for durable submit/idempotency, explicit acceptance, concurrent stock acceptance, transitions, invoice/delivery numbering and per-recipient retries.
- [x] Implement private SQLite storage, config validation, atomic transitions and outbox; fail closed when disabled.
- [x] Make adapters injected and test the full flow against a real temporary SQLite database with controlled external boundaries.

## Task 3: Payments, mail and PDF documents

Own `lib/rental-orders/integrations.ts`, `documents.ts`, adapter/document tests and any necessary licensed PDF font assets. Use shared order types. No store/service/routes/UI edits; ask root for dependency additions.

- [x] Red tests for payment amount/order matching, provider idempotency key, mail recipient isolation and invoice/handover document conditions.
- [x] Implement Mollie hosted payment adapter, verified fetch of payment state, SMTP adapter and status-specific messages with PDF attachments.
- [x] Render synthetic invoice/delivery note, inspect page layout and wrapping; report paths for root inspection.

## Task 4: Customer and market interfaces with API integration

Root owns shared types, route handlers, auth, customer rental/cart/checkout/status UI, protected market dashboard, environment template, deployment instructions and integration tests.

- [x] Add server quote/config/order routes, token-protected order status/document access and authenticated market actions with same-origin protection.
- [x] Show unit/line/total prices, method selection and contract distinction; preserve inquiry fallback for unsupported baskets/config.
- [x] Add market acceptance/decline, payment retry/status, cash receipt, handover and outbox inspection.
- [x] Run behavioral tests, full suite, TypeScript, lint/build and local browser paths for online and cash test orders.
- [x] Review security/concurrency and fix findings; update status/questions. Scoped Git synchronization follows final verification.

## Execution decisions

The explicit user instruction supplies implementation authorization despite earlier draft-only notes. Unknown business inputs remain configuration requirements for live operation. Parallel workers own disjoint files and share the written types; this overrides the skill's generic sequential-worker preference and follows the session's parallel-delegation instruction. SQLite requires one persistent Node host; ephemeral/serverless multi-instance deployment needs a supported shared database before activation. No such deployment is made here.
