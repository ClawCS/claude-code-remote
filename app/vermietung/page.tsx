"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatPrice, type Product } from "@/lib/utils";

type RentalItem = {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
  price: number;
  priceWithout?: number;
  unit: string;
  category: string;
  maxQty: number;
};

const rentalItems: RentalItem[] = [
  { id: 1001, name: "Zapfanlage", slug: "zapfanlage", icon: "🍺", description: "Kühlt und zapft ein Fass. Inkl. CO2 und Reinigung. Für kleine bis große Feiern.", price: 25, unit: "pro Wochenende", category: "Zapfanlagen", maxQty: 10 },
  { id: 1002, name: "Kühltruhe", slug: "kuehltruhe", icon: "❄️", description: "Mobile Kühltruhe für Flaschen, Dosen und Fässer. Hält alles den ganzen Tag kalt.", price: 30, unit: "pro Wochenende", category: "Zapfanlagen", maxQty: 10 },
  { id: 1003, name: "Kühlwagen (mit Getränken)", slug: "kuehlwagen-mit", icon: "🚛", description: "Mobiler Kühlwagen für Events. Preis bei Buchung mit Getränken von uns.", price: 130, unit: "pro Wochenende", category: "Zapfanlagen", maxQty: 2 },
  { id: 1004, name: "Kühlwagen (ohne Getränke)", slug: "kuehlwagen-ohne", icon: "🚛", description: "Mobiler Kühlwagen für Events. Preis ohne Getränkebestellung.", price: 200, unit: "pro Wochenende", category: "Zapfanlagen", maxQty: 2 },
  { id: 1005, name: "Stehtisch", slug: "stehtisch", icon: "🪑", description: "Praktischer Stehtisch für Empfänge, Grillpartys und Firmenfeiern. Höhe ca. 110cm.", price: 8, unit: "pro Stück / Wochenende", category: "Mobiliar", maxQty: 100 },
  { id: 1006, name: "Bierzeltgarnitur", slug: "bierzeltgarnitur", icon: "🏕️", description: "Klassische Bierzeltgarnitur mit Tisch und zwei Bänken. Platz für 6–8 Personen.", price: 15, unit: "pro Garnitur / Wochenende", category: "Mobiliar", maxQty: 100 },
  { id: 1007, name: "Theke", slug: "theke", icon: "🍸", description: "Mobile Theke für den professionellen Look auf deiner Feier.", price: 35, unit: "pro Wochenende", category: "Mobiliar", maxQty: 5 },
  { id: 1008, name: "Nasstheke mit Becken", slug: "nasstheke", icon: "🚰", description: "Nasstheke mit integriertem Becken — perfekt für Cocktails und Ausschank.", price: 50, unit: "pro Wochenende", category: "Mobiliar", maxQty: 3 },
  { id: 1009, name: "Biergläser 50er Set", slug: "bierglaeser-50er", icon: "🍺", description: "50 Biergläser (0,3l oder 0,5l). Gespült und einsatzbereit.", price: 15, unit: "pro 50 Stück", category: "Gläser", maxQty: 100 },
  { id: 1010, name: "Weingläser", slug: "weinglaeser", icon: "🍷", description: "Weingläser für stilvolle Anlässe. Verschiedene Größen verfügbar.", price: 0.40, unit: "pro Stück", category: "Gläser", maxQty: 100 },
  { id: 1011, name: "Sektgläser 50er Set", slug: "sektglaeser-50er", icon: "🥂", description: "50 Sektgläser für Empfänge und Feiern. Perfekt zum Anstoßen.", price: 15, unit: "pro 50 Stück", category: "Gläser", maxQty: 100 },
];

const rentalCategories = [...new Set(rentalItems.map(i => i.category))];

type BookingItem = { item: RentalItem; quantity: number };

export default function VermietungPage() {
  const { addItem } = useCart();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const filtered = activeCategory ? rentalItems.filter(i => i.category === activeCategory) : rentalItems;

  const updateBooking = (item: RentalItem, qty: number) => {
    setBookings(prev => {
      if (qty <= 0) return prev.filter(b => b.item.id !== item.id);
      const existing = prev.find(b => b.item.id === item.id);
      if (existing) return prev.map(b => b.item.id === item.id ? { ...b, quantity: Math.min(qty, item.maxQty) } : b);
      return [...prev, { item, quantity: Math.min(qty, item.maxQty) }];
    });
  };

  const getQty = (id: number) => bookings.find(b => b.item.id === id)?.quantity || 0;
  const totalPrice = bookings.reduce((sum, b) => sum + b.item.price * b.quantity, 0);

  const handleAddAllToCart = () => {
    bookings.forEach(b => {
      const product: Product = {
        id: b.item.id,
        name: `${b.item.name} (Miete${dateFrom ? ` ${new Date(dateFrom).toLocaleDateString("de-DE")}` : ""}${dateTo ? ` – ${new Date(dateTo).toLocaleDateString("de-DE")}` : ""})`,
        slug: b.item.slug, price: b.item.price, category: "Vermietung", categorySlug: "vermietung",
        description: b.item.description, image: "https://www.trinkgut.de/media/1c/e7/ec/1687794978/trinkgut-logo.svg",
        unit: b.item.unit, inStock: true,
      };
      addItem(product, b.quantity);
    });
    setBookings([]);
  };

  const calendarMonths = () => {
    const months = [];
    const now = new Date();
    for (let m = 0; m < 3; m++) {
      const date = new Date(now.getFullYear(), now.getMonth() + m, 1);
      const monthName = date.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
      const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
      const firstDay = (date.getDay() + 6) % 7;
      const days: (number | null)[] = Array(firstDay).fill(null);
      for (let d = 1; d <= daysInMonth; d++) days.push(d);
      months.push({ name: monthName, days, year: date.getFullYear(), month: date.getMonth() });
    }
    return months;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-10 animate-fade-in-up">
        <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-2">Partyservice</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-secondary mb-3">Vermietung & Leihsortiment</h1>
        <p className="text-muted max-w-xl mx-auto">
          Zapfanlagen, Stehtische, Gläser und mehr — alles für deine Feier. Wähle Artikel, Menge und Zeitraum.
        </p>
      </div>

      {/* Date Picker */}
      <div className="bg-white border border-border rounded-2xl p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-secondary mb-1">Abholdatum</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-secondary mb-1">Rückgabedatum</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} min={dateFrom || new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <button onClick={() => setShowCalendar(!showCalendar)} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${showCalendar ? "bg-primary text-white" : "border border-border text-muted hover:border-primary hover:text-primary"}`}>
            📅 {showCalendar ? "Schließen" : "Kalender"}
          </button>
        </div>
        {showCalendar && (
          <div className="mt-6 border-t border-border pt-6">
            <div className="grid md:grid-cols-3 gap-6">
              {calendarMonths().map((month) => (
                <div key={month.name}>
                  <h4 className="font-medium text-secondary text-sm mb-2 text-center">{month.name}</h4>
                  <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
                    {["Mo","Di","Mi","Do","Fr","Sa","So"].map(d => <div key={d} className="text-muted font-medium py-1">{d}</div>)}
                    {month.days.map((day, i) => {
                      if (day === null) return <div key={`e-${i}`} />;
                      const ds = `${month.year}-${String(month.month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                      const past = new Date(ds) < new Date(new Date().toDateString());
                      const sel = ds >= dateFrom && ds <= dateTo && dateFrom && dateTo;
                      const isEdge = ds === dateFrom || ds === dateTo;
                      return <div key={ds} onClick={() => { if (past) return; if (!dateFrom || (dateFrom && dateTo)) { setDateFrom(ds); setDateTo(""); } else { if (ds > dateFrom) setDateTo(ds); else { setDateTo(dateFrom); setDateFrom(ds); } } }} className={`py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${past ? "text-gray-300 cursor-not-allowed" : isEdge ? "bg-primary text-white font-bold" : sel ? "bg-primary/10 text-primary" : "hover:bg-light text-secondary"}`}>{day}</div>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        <button onClick={() => setActiveCategory(null)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!activeCategory ? "bg-primary text-white" : "bg-light text-muted hover:bg-border"}`}>Alle ({rentalItems.length})</button>
        {rentalCategories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === cat ? "bg-primary text-white" : "bg-light text-muted hover:bg-border"}`}>{cat}</button>
        ))}
      </div>

      {/* Items */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {filtered.map((item) => {
          const qty = getQty(item.id);
          return (
            <div key={item.id} className="bg-white border border-border rounded-2xl p-5 card-hover">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl">{item.icon}</span>
                <div className="flex-1">
                  <h3 className="font-bold text-secondary">{item.name}</h3>
                  <p className="text-xs text-muted mt-0.5">{item.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <div>
                  <span className="text-xl font-extrabold text-primary">{formatPrice(item.price)}</span>
                  <span className="text-xs text-muted block">{item.unit}</span>
                </div>
                <div className="flex items-center gap-2">
                  {qty > 0 && <button onClick={() => updateBooking(item, qty - 1)} className="w-8 h-8 rounded-lg bg-light border border-border text-sm font-bold hover:border-primary transition-colors">-</button>}
                  {qty > 0 && <span className="w-8 text-center font-bold text-sm">{qty}</span>}
                  <button onClick={() => updateBooking(item, qty + 1)} disabled={qty >= item.maxQty} className={`${qty === 0 ? "px-3 py-1.5" : "w-8 h-8"} rounded-lg text-sm font-bold transition-colors ${qty >= item.maxQty ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-primary hover:bg-primary-dark text-white"}`}>{qty === 0 ? "+ Buchen" : "+"}</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Summary */}
      {bookings.length > 0 && (
        <div className="bg-white border-2 border-primary rounded-2xl p-6 mb-8 sticky bottom-20 z-30 shadow-xl">
          <h3 className="font-bold text-secondary mb-3">Deine Buchung</h3>
          {dateFrom && dateTo && <p className="text-sm text-muted mb-3">📅 {new Date(dateFrom).toLocaleDateString("de-DE")} – {new Date(dateTo).toLocaleDateString("de-DE")}</p>}
          <div className="space-y-2 mb-4">
            {bookings.map(b => (
              <div key={b.item.id} className="flex justify-between text-sm">
                <span className="text-muted">{b.quantity}x {b.item.name}</span>
                <span className="font-medium text-secondary">{formatPrice(b.item.price * b.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-3 flex items-center justify-between">
            <div>
              <span className="text-sm text-muted">Gesamt:</span>
              <span className="text-2xl font-extrabold text-primary ml-2">{formatPrice(totalPrice)}</span>
            </div>
            <button onClick={handleAddAllToCart} className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors btn-hover">In den Warenkorb</button>
          </div>
          {(!dateFrom || !dateTo) && <p className="text-xs text-amber-600 mt-2">⚠️ Bitte Zeitraum wählen</p>}
        </div>
      )}

      {/* CTA */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Individuelle Beratung?</h2>
        <p className="text-white/70 mb-4">Für größere Events beraten wir dich gerne persönlich.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a href="tel:02823418707" className="px-6 py-3 bg-accent hover:bg-accent-dark text-secondary font-bold rounded-xl transition-colors">📞 02823-418707</a>
          <a href="https://wa.me/4917663228597" target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors">💬 WhatsApp</a>
        </div>
      </div>
    </div>
  );
}
