"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const [submitted, setSubmitted] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
  const [contact, setContact] = useState({
    vorname: "",
    nachname: "",
    email: "",
    telefon: "",
    strasse: "",
    plz: "",
    ort: "",
    anmerkungen: "",
  });

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContact((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-6xl mb-4">🎉</p>
        <h1 className="text-2xl font-bold text-secondary mb-2">Bestellung eingegangen!</h1>
        <p className="text-muted mb-6">
          Vielen Dank für deine Bestellung. Wir melden uns in Kürze bei dir.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
          >
            Zur&uuml;ck zum Shop
          </Link>
          <Link
            href="/bestellungen"
            className="inline-flex px-6 py-3 border-2 border-secondary text-secondary hover:bg-secondary hover:text-white font-bold rounded-lg transition-colors"
          >
            Meine Bestellungen
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-5xl mb-4">🛒</p>
        <h1 className="text-2xl font-bold text-secondary mb-2">Dein Warenkorb ist leer</h1>
        <Link href="/produkte" className="text-primary hover:underline">
          Produkte entdecken
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Save order to localStorage with contact data
    const order = {
      id: `order-${Date.now()}`,
      date: new Date().toISOString(),
      items: items.map((item) => ({
        product: item.product,
        quantity: item.quantity,
      })),
      totalPrice,
      deliveryMethod,
      contact: {
        vorname: contact.vorname,
        nachname: contact.nachname,
        email: contact.email,
        telefon: contact.telefon,
        ...(deliveryMethod === "delivery" ? {
          strasse: contact.strasse,
          plz: contact.plz,
          ort: contact.ort,
        } : {}),
        anmerkungen: contact.anmerkungen,
      },
    };

    try {
      const existing = localStorage.getItem("trinkgut-bestellungen");
      const orders = existing ? JSON.parse(existing) : [];
      orders.unshift(order);
      localStorage.setItem("trinkgut-bestellungen", JSON.stringify(orders));
    } catch {
      // ignore storage errors
    }

    // Open mailto with order details
    const itemLines = items.map((item) => `- ${item.quantity}x ${item.product.name} (${formatPrice(item.product.price * item.quantity)})`).join("\n");
    const subject = encodeURIComponent(`Neue Bestellung ${order.id} — ${contact.vorname} ${contact.nachname}`);
    const body = encodeURIComponent(
      `Neue Bestellung über die Website:\n\n` +
      `Bestellnr.: ${order.id}\n` +
      `Datum: ${new Date().toLocaleString("de-DE")}\n` +
      `Methode: ${deliveryMethod === "pickup" ? "Abholung" : "Lieferung"}\n\n` +
      `Kontakt:\n` +
      `Name: ${contact.vorname} ${contact.nachname}\n` +
      `E-Mail: ${contact.email}\n` +
      `Telefon: ${contact.telefon || "Nicht angegeben"}\n` +
      (deliveryMethod === "delivery" ? `Adresse: ${contact.strasse}, ${contact.plz} ${contact.ort}\n` : "") +
      (contact.anmerkungen ? `Anmerkungen: ${contact.anmerkungen}\n` : "") +
      `\nBestellung:\n${itemLines}\n\n` +
      `Gesamt: ${formatPrice(totalPrice)}\n` +
      `(zzgl. Pfand, inkl. MwSt.)`
    );
    window.open(`mailto:jammers-goch@trinkgut.de?subject=${subject}&body=${body}`, "_self");

    clearCart();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-secondary mb-8">Kasse</h1>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="md:col-span-3 space-y-6">
          {/* Delivery method */}
          <fieldset>
            <legend className="font-semibold text-secondary mb-3">Wie möchtest du bestellen?</legend>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeliveryMethod("pickup")}
                className={`flex-1 p-4 rounded-lg border-2 text-left transition-colors ${
                  deliveryMethod === "pickup"
                    ? "border-primary bg-red-50"
                    : "border-border hover:border-muted"
                }`}
              >
                <p className="font-medium">🏪 Abholung</p>
                <p className="text-sm text-muted">Im Markt abholen</p>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryMethod("delivery")}
                className={`flex-1 p-4 rounded-lg border-2 text-left transition-colors ${
                  deliveryMethod === "delivery"
                    ? "border-primary bg-red-50"
                    : "border-border hover:border-muted"
                }`}
              >
                <p className="font-medium">🚚 Lieferung</p>
                <p className="text-sm text-muted">Zu dir nach Hause</p>
              </button>
            </div>
          </fieldset>

          {/* Contact */}
          <fieldset className="space-y-4">
            <legend className="font-semibold text-secondary mb-3">Kontaktdaten</legend>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Vorname *</label>
                <input
                  required
                  type="text"
                  name="vorname"
                  value={contact.vorname}
                  onChange={handleContactChange}
                  autoComplete="given-name"
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Nachname *</label>
                <input
                  required
                  type="text"
                  name="nachname"
                  value={contact.nachname}
                  onChange={handleContactChange}
                  autoComplete="family-name"
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">E-Mail *</label>
              <input
                required
                type="email"
                name="email"
                value={contact.email}
                onChange={handleContactChange}
                autoComplete="email"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Telefon</label>
              <input
                type="tel"
                name="telefon"
                value={contact.telefon}
                onChange={handleContactChange}
                autoComplete="tel"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </fieldset>

          {/* Address (only for delivery) */}
          {deliveryMethod === "delivery" && (
            <fieldset className="space-y-4">
              <legend className="font-semibold text-secondary mb-3">Lieferadresse</legend>
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">Straße & Hausnr. *</label>
                <input
                  required
                  type="text"
                  name="strasse"
                  value={contact.strasse}
                  onChange={handleContactChange}
                  autoComplete="street-address"
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1">PLZ *</label>
                  <input
                    required
                    type="text"
                    name="plz"
                    value={contact.plz}
                    onChange={handleContactChange}
                    autoComplete="postal-code"
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-secondary mb-1">Ort *</label>
                  <input
                    required
                    type="text"
                    name="ort"
                    value={contact.ort}
                    onChange={handleContactChange}
                    autoComplete="address-level2"
                    className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </fieldset>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">Anmerkungen</label>
            <textarea
              rows={3}
              name="anmerkungen"
              value={contact.anmerkungen}
              onChange={handleContactChange}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
              placeholder="Wunschtermin, besondere Hinweise..."
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors text-lg"
          >
            Bestellung abschicken
          </button>
        </form>

        {/* Order Summary */}
        <div className="md:col-span-2">
          <div className="bg-light rounded-xl p-5 sticky top-24">
            <h2 className="font-semibold text-secondary mb-4">Bestellübersicht</h2>
            <ul className="space-y-3 mb-4">
              {items.map((item) => {
                const isRental = !!item.rental;
                const itemTotal = isRental
                  ? item.rental!.totalRentalPrice * item.quantity
                  : item.product.price * item.quantity;
                return (
                  <li key={item.product.id} className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted">
                        {item.quantity}x {item.product.name}
                      </span>
                      <span className="font-medium text-secondary">
                        {formatPrice(itemTotal)}
                      </span>
                    </div>
                    {isRental && (
                      <div className="mt-1 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                        <p>{new Date(item.rental!.startDate).toLocaleDateString("de-DE")} – {new Date(item.rental!.endDate).toLocaleDateString("de-DE")} ({item.rental!.workdays} Werktage)</p>
                        <p>{formatPrice(item.rental!.basePrice)} x {item.rental!.periods} Periode{item.rental!.periods > 1 ? "n" : ""}</p>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-border pt-3 flex justify-between items-center">
              <span className="font-semibold text-secondary">Gesamt:</span>
              <span className="text-xl font-bold text-primary">{formatPrice(totalPrice)}</span>
            </div>
            <p className="text-xs text-muted mt-2">zzgl. Pfand, inkl. MwSt.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
