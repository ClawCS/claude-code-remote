import { createElement } from "react";
import { createHash } from "node:crypto";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CartItem } from "@/context/CartContext";
import type { Product } from "@/lib/utils";

const state = vi.hoisted(() => ({ items: [] as CartItem[], wishlist: [] as Product[], error: "", unpriced: false }));
vi.mock("@/context/CartContext", () => ({ useCart: () => ({ items: state.items, quantityError: state.error, isCartOpen: true, totalItems: state.items.length, addItem: vi.fn(), removeItem: vi.fn(), updateQuantity: vi.fn(), clearCart: vi.fn(), setIsCartOpen: vi.fn() }) }));
vi.mock("@/context/WishlistContext", () => ({ useWishlist: () => ({ items: state.wishlist, isWishlistOpen: true, isInWishlist: () => true, toggleItem: vi.fn(), removeItem: vi.fn(), clearWishlist: vi.fn(), setIsWishlistOpen: vi.fn() }) }));
// No browser effects run during SSR. Preserve real pricing except the explicitly
// synthetic dormant unpriced branch; today's canonical rental rows all have prices.
vi.mock("@/lib/rental-cart", async importOriginal => {
  const actual = await importOriginal<typeof import("@/lib/rental-cart")>();
  return { ...actual, rentalCartQuote: (items: CartItem[]) => {
    const value = actual.rentalCartQuote(items);
    if (state.unpriced && value.quote) return { ...value, quote: { ...value.quote, allPriced: false, totalCents: null, knownSubtotalCents: 0, lines: value.quote.lines.map(line => ({ ...line, unitPriceCents: null, lineTotalCents: null })) } };
    return value;
  } };
});
vi.mock("next/image", () => ({ default: ({ src, alt, className }: { src: string | { src: string }; alt: string; className?: string }) => createElement("img", { src: typeof src === "string" ? src : src.src, alt, className }) }));
import RentalPage from "@/app/vermietung/page";
import CartPage from "@/app/warenkorb/page";
import WishlistPage from "@/app/merkzettel/page";
import CareerPage from "@/app/bewerbung/page";
import HistoryPage from "@/app/bestellungen/page";
import ContactPage from "@/app/kontakt/page";
import ImprintPage from "@/app/impressum/page";
import PrivacyPage from "@/app/datenschutz/page";
import TermsPage from "@/app/agb/page";
import NotFound from "@/app/not-found";
import InquiryCheckout from "@/components/rentals/InquiryCheckout";
import RentalCheckout from "@/components/rentals/RentalCheckout";
import RentalOrderStatus from "@/components/rentals/RentalOrderStatus";
import CartDrawer from "@/components/CartDrawer";
import WishlistDrawer from "@/components/WishlistDrawer";
import { getRentalItem, rentalToProduct } from "@/data/rentals";

const product: Product = { id: 123, name: "Beispielgetränk", slug: "beispielgetraenk", price: 0, description: "Getränk", category: "Bier", categorySlug: "bier", unit: "Kiste", image: "", inStock: false };
const rental = (): CartItem => ({ product: rentalToProduct(getRentalItem(20001)!), quantity: 1, rental: { startDate: "2026-10-12", endDate: "2026-10-14", workdays: 3, periods: 0, basePrice: 0, totalRentalPrice: 0 } });
const render = (Component: () => React.ReactNode) => renderToStaticMarkup(<Component />);
const textHash = (html: string) => createHash("sha256").update(html.replace(/<[^>]+>/g, " ").replace(/[📍🕐📞💬✉️📸]/gu, "").replace(/\s+/g, " ").trim()).digest("hex");
beforeEach(() => { state.items = []; state.wishlist = []; state.error = ""; state.unpriced = false; vi.unstubAllEnvs(); vi.stubEnv("RENTAL_MODE", "disabled"); });

describe("editorial service pages", () => {
  it.each([
    ["rental", RentalPage], ["cart empty", CartPage], ["wishlist", WishlistPage], ["career", CareerPage], ["history", HistoryPage], ["contact", ContactPage], ["imprint", ImprintPage], ["privacy", PrivacyPage], ["terms", TermsPage], ["404", NotFound], ["inquiry empty", InquiryCheckout], ["checkout empty", RentalCheckout],
  ] as const)("%s has an editorial introduction and retains a single page heading", (_, Component) => {
    const html = render(Component);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toMatch(/<header[^>]*class="[^"]*intro/);
    expect(html).not.toContain("page-hero-banner");
    expect(html).not.toContain("card-hover-glow");
  });

  it("styles the actual rental catalogue, controls and source examples", () => {
    const html = render(RentalPage);
    expect(html.match(/data-rental-name=/g)).toHaveLength(19);
    expect(html.match(/Beispielbild · Modell und Ausführung können abweichen\./g)).toHaveLength(19);
    expect(html).not.toContain("KI-Beispielbild");
    expect(html).toContain("rentalGrid");
    expect(html).toContain("quantityControl");
    expect(html).toContain('aria-label="Menge für Kühlanhänger erhöhen"');
    expect(html).toContain('type="date"');
    expect(html).not.toMatch(/Physischer Bestand|Kaution|Entlüfter|Zapfhahn/);
  });

  it("keeps real priced, mixed, error and populated wishlist content inside the new presentation", () => {
    state.items = [rental()];
    const cart = render(CartPage);
    expect(cart).toContain("150,00");
    expect(cart).toContain("12.10.2026");
    expect(cart).toContain("Termin und Verfügbarkeit bestätigen wir persönlich.");
    expect(cart).toContain("quantityControl");
    state.items.push({ product, quantity: 2 });
    state.error = "Diese Menge ist nicht verfügbar. Bitte reduziere die Menge.";
    const mixed = render(CartPage);
    expect(mixed).toContain("kein Gesamtpreis der gemischten Liste");
    expect(mixed).toContain('href="/produkte/beispielgetraenk"');
    expect(mixed).toContain('role="alert"');
    state.wishlist = [product];
    const wishlist = render(WishlistPage);
    expect(wishlist).toContain("data-product-card");
    expect(wishlist).toContain("Beispielgetränk");
    expect(wishlist).toContain("Alle zur Anfrageliste (1)");
  });

  it("[synthetic] keeps an unpriced actual cart and drawer an inquiry with only a known subtotal", () => {
    state.items = [rental()]; state.unpriced = true;
    expect(render(CartPage)).toContain("Kein vollständiger Gesamtpreis: Mindestens ein Mietpreis ist offen.");
    expect(render(CartPage)).toContain("nur Teilsumme");
    expect(render(CartDrawer)).toContain("Gesamtpreis offen · unverbindliche Anfrage");
    expect(render(RentalCheckout)).toContain("Reservierung unverbindlich anfragen");
    expect(render(CartPage)).not.toContain("Zahlungspflichtig bestellen");
  });

  it("keeps the populated inquiry controls and disabled checkout loading state legible", () => {
    state.items = [rental()];
    const inquiry = render(InquiryCheckout);
    for (const attribute of ['id="inquiry-name"', 'autoComplete="name"', 'maxLength="100"', 'id="inquiry-method"', 'value="pickup"', 'value="delivery"', 'id="inquiry-notes"', 'maxLength="500"', 'name="channel"', 'value="email"', 'value="whatsapp"']) expect(inquiry).toContain(attribute);
    expect(inquiry).toContain("formLayout");
    expect(inquiry).toContain("Gewünschter Leihzeitraum: 2026-10-12 bis 2026-10-14");
    expect(render(RentalCheckout)).toContain("intro");
    expect(renderToStaticMarkup(<RentalOrderStatus id="invalid" token="" />)).toContain("intro");
  });

  it("gives both actual drawers shared accessible presentation without changing their actions", () => {
    state.items = [rental()]; state.wishlist = [product];
    for (const Component of [CartDrawer, WishlistDrawer]) {
      const html = render(Component);
      expect(html).toContain('role="dialog"'); expect(html).toContain('aria-modal="true"');
      expect(html).toContain("drawerPanel"); expect(html).toContain("drawerHeader");
    }
    expect(render(CartDrawer)).toContain("Unverbindlich anfragen");
    expect(render(WishlistDrawer)).toContain('href="/produkte/beispielgetraenk"');
  });
  it("makes the otherwise unreachable wishlist drawer available from its actual page", () => {
    expect(render(WishlistPage)).toMatch(/<button[^>]*>Merkzettel-Vorschau öffnen<\/button>/);
  });

  it("keeps all three career originals and the disabled email-only initial application gate", () => {
    const html = render(CareerPage);
    expect(html.match(/vollständige Anzeige öffnen/g)).toHaveLength(3);
    expect(html).toContain("jobGrid");
    expect(html).toContain("info@trinkgut-jammers.de");
    expect(html).toContain("Der Online-Upload ist zurzeit nicht verfügbar.");
    expect(html).toContain("Anzeigenmotive – keine Teamfotos.");
    expect(html).not.toContain("KI-generierte");
    expect(html).not.toContain('type="file"');
    expect(html).not.toContain('value="apprentice"');
  });

  // Freeze all visible legal/contact copy, excluding decorative contact emoji.
  // Privacy baseline includes only Niko's 10 Oct wording update: both recipient
  // labels now say "externe Analyseanbieter"; no processing or retention change.
  it.each([["contact", ContactPage, "18f3305473ed8239e2930b479b0e2bf10faf15ed63b41b01052ca681a1d2cf91"], ["imprint", ImprintPage, "abedc4922657d2edfad795bb48ad4c6ee9898d5209bfdcccf562a2bb4d8b9936"], ["privacy", PrivacyPage, "2de4d09b1534b61e6e75278e379d8d686aab3d895651e7e7f797bbf4c5198d06"], ["terms", TermsPage, "a8e42c6360a058831a6fc9fab429e8b69e6603e24020704dbc8e4c1c2d97238c"]] as const)("retains exact %s text", (_, Component, hash) => {
    expect(textHash(render(Component))).toBe(hash);
  });
  it.each([["privacy", PrivacyPage, "5598b790ba15d02b4b5cce4c93df386d0a22c7346e7a93d43c53060b1a1dde9b"], ["terms", TermsPage, "2e77ba25a96571893f62935f6e8ec60b834cbd29f0d97c3d85e05ccdd8b25cfe"]] as const)("[synthetic] retains exact enabled %s text", (_, Component, hash) => {
    vi.stubEnv("RENTAL_MODE", "test"); vi.stubEnv("RENTAL_DATA_DIR", "/tmp/jammers-privacy-test-fixture"); vi.stubEnv("RENTAL_PUBLIC_ORIGIN", "http://127.0.0.1:3104");
    expect(textHash(render(Component))).toBe(hash);
  });
});
