"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import { formatPrice, calculateWorkdays, calculateRentalPrice, calculateRentalPeriods, type Product } from "@/lib/utils";
import type { RentalInfo } from "@/context/CartContext";
import ShimmerParticles from "@/components/ShimmerParticles";

/* ─── SVG Icon Components ─── */

function ZapfanlageIcon() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="20" width="30" height="30" rx="4" fill="#DC2626" opacity="0.12" stroke="#DC2626" strokeWidth="2" />
      <rect x="27" y="8" width="6" height="16" rx="3" fill="#DC2626" />
      <circle cx="30" cy="8" r="4" fill="#DC2626" />
      <path d="M30 36 L30 42 L26 46" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 46 L26 46 L27 54 L21 54 Z" fill="#DC2626" opacity="0.2" stroke="#DC2626" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="26" cy="43" r="1" fill="#DC2626" />
      <circle cx="30" cy="32" r="4" stroke="#DC2626" strokeWidth="1.5" fill="none" />
      <path d="M30 30 L31.5 33" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function KuehltruhIcon() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="14" width="44" height="34" rx="4" fill="#DC2626" opacity="0.12" stroke="#DC2626" strokeWidth="2" />
      <path d="M8 18 Q8 14 12 14 L48 14 Q52 14 52 18 L52 22 L8 22 Z" fill="#DC2626" opacity="0.25" stroke="#DC2626" strokeWidth="2" />
      <rect x="22" y="16" width="16" height="3" rx="1.5" fill="#DC2626" />
      <line x1="30" y1="28" x2="30" y2="42" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="23" y1="35" x2="37" y2="35" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="25" y1="30" x2="35" y2="40" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="35" y1="30" x2="25" y2="40" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="12" y="48" width="4" height="4" rx="1" fill="#DC2626" />
      <rect x="44" y="48" width="4" height="4" rx="1" fill="#DC2626" />
    </svg>
  );
}

function ThekeIcon() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="18" width="48" height="6" rx="2" fill="#DC2626" />
      <rect x="8" y="24" width="44" height="24" rx="2" fill="#DC2626" opacity="0.12" stroke="#DC2626" strokeWidth="2" />
      <line x1="12" y1="36" x2="48" y2="36" stroke="#DC2626" strokeWidth="1" opacity="0.4" />
      <rect x="10" y="48" width="3" height="6" rx="1" fill="#DC2626" />
      <rect x="47" y="48" width="3" height="6" rx="1" fill="#DC2626" />
      <rect x="16" y="10" width="4" height="8" rx="2" fill="#DC2626" opacity="0.3" />
      <rect x="23" y="12" width="4" height="6" rx="2" fill="#DC2626" opacity="0.2" />
      <rect x="38" y="11" width="4" height="7" rx="2" fill="#DC2626" opacity="0.25" />
    </svg>
  );
}

function NassthekeIcon() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="18" width="48" height="6" rx="2" fill="#DC2626" />
      <rect x="8" y="24" width="44" height="24" rx="2" fill="#DC2626" opacity="0.12" stroke="#DC2626" strokeWidth="2" />
      <path d="M18 20 L18 26 Q18 30 22 30 L38 30 Q42 30 42 26 L42 20" fill="none" stroke="#DC2626" strokeWidth="2" />
      <path d="M30 12 L30 18" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M30 12 L35 12 L35 15" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="35" cy="18" r="1" fill="#DC2626" opacity="0.5" />
      <circle cx="35" cy="21" r="0.8" fill="#DC2626" opacity="0.3" />
      <circle cx="30" cy="28" r="1.5" fill="#DC2626" opacity="0.4" />
      <rect x="10" y="48" width="3" height="6" rx="1" fill="#DC2626" />
      <rect x="47" y="48" width="3" height="6" rx="1" fill="#DC2626" />
    </svg>
  );
}

function KuehlwagenIcon() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="14" width="40" height="28" rx="3" fill="#DC2626" opacity="0.12" stroke="#DC2626" strokeWidth="2" />
      <path d="M44 24 L52 24 Q56 24 56 28 L56 42 L44 42 Z" fill="#DC2626" opacity="0.2" stroke="#DC2626" strokeWidth="2" />
      <rect x="47" y="27" width="6" height="5" rx="1" fill="white" stroke="#DC2626" strokeWidth="1" />
      <line x1="24" y1="22" x2="24" y2="34" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18" y1="28" x2="30" y2="28" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="24" x2="28" y2="32" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28" y1="24" x2="20" y2="32" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="46" r="5" fill="#DC2626" opacity="0.3" stroke="#DC2626" strokeWidth="2" />
      <circle cx="16" cy="46" r="2" fill="white" />
      <circle cx="48" cy="46" r="5" fill="#DC2626" opacity="0.3" stroke="#DC2626" strokeWidth="2" />
      <circle cx="48" cy="46" r="2" fill="white" />
    </svg>
  );
}

function WeinglaserIcon() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 10 Q20 28 30 32 Q40 28 40 10 Z" fill="#DC2626" opacity="0.1" stroke="#DC2626" strokeWidth="2" strokeLinejoin="round" />
      <path d="M22 18 Q22 26 30 30 Q38 26 38 18 Z" fill="#DC2626" opacity="0.25" />
      <line x1="30" y1="32" x2="30" y2="46" stroke="#DC2626" strokeWidth="2" />
      <ellipse cx="30" cy="48" rx="10" ry="3" fill="#DC2626" opacity="0.15" stroke="#DC2626" strokeWidth="2" />
      <path d="M24 14 Q24 12 26 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block mr-1">
      <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="1" y1="7" x2="15" y2="7" stroke="currentColor" strokeWidth="1.5" />
      <line x1="5" y1="1" x2="5" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="1" x2="11" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block mr-1">
      <path d="M3 1.5 C3 1.5 4 1 5 2 L6.5 4 C7 4.8 6.5 5.5 6 6 C6 6 5.5 6.5 6.5 8 C7.5 9.5 8 9 8 9 C8.5 8.5 9.2 8 10 8.5 L12 10 C13 11 12.5 12 12.5 12 C11.5 14 9 14 7 12 C5 10 3.5 7 2.5 5 C1.5 3 3 1.5 3 1.5Z" fill="currentColor" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block mr-1">
      <path d="M8 1C4.13 1 1 4.13 1 8C1 9.37 1.4 10.64 2.1 11.72L1 15L4.38 13.94C5.42 14.56 6.67 14.93 8 14.93C11.87 14.93 15 11.8 15 7.93C15 4.13 11.87 1 8 1Z" fill="currentColor" />
      <path d="M11.2 9.6C11 9.5 10.1 9.05 9.9 9C9.7 8.9 9.5 8.9 9.4 9.1C9.2 9.3 8.9 9.7 8.7 9.9C8.6 10 8.5 10 8.3 9.9C7.5 9.6 6.9 9.2 6.4 8.4C6.2 8.2 6.5 8.2 6.7 7.7C6.8 7.6 6.7 7.5 6.7 7.4C6.7 7.3 6.3 6.4 6.2 6.1C6 5.8 5.9 5.8 5.8 5.8H5.5C5.4 5.8 5.2 5.9 5 6.1C4.8 6.3 4.4 6.7 4.4 7.5C4.4 8.3 5 9.1 5.1 9.2C5.2 9.3 6.3 11 8.1 11.6C9.5 12.1 9.9 11.9 10.3 11.8C10.7 11.8 11.4 11.4 11.5 11C11.6 10.6 11.6 10.3 11.6 10.2C11.5 9.8 11.4 9.7 11.2 9.6Z" fill="white" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block mr-1 flex-shrink-0">
      <path d="M7 1L13 12H1L7 1Z" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="7" y1="5" x2="7" y2="8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="7" cy="10.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

/* ─── Icon map ─── */

const iconComponents: Record<string, () => React.JSX.Element> = {
  zapfanlage: ZapfanlageIcon,
  kuehltruhe: KuehltruhIcon,
  theke: ThekeIcon,
  nasstheke: NassthekeIcon,
  kuehlwagen: KuehlwagenIcon,
  weinglaeser: WeinglaserIcon,
};

/* ─── Types ─── */

type RentalItem = {
  id: number;
  name: string;
  slug: string;
  image: string;
  description: string;
  price: number;
  unit: string;
  category: string;
  maxQty: number;
};

/* ─── Rental Items ─── */

const rentalItems: RentalItem[] = [
  { id: 1001, name: "Zapfanlage", slug: "zapfanlage", image: "https://images.unsplash.com/photo-1580021574625-5fb31fe78df3?w=400&h=300&fit=crop", description: "Kühlt und zapft ein Fass. Inkl. CO2 und Reinigung. Für kleine bis große Feiern.", price: 25, unit: "pro 3 Werktage", category: "Kühlung & Zapf", maxQty: 10 },
  { id: 1002, name: "Kühltruhe", slug: "kuehltruhe", image: "https://images.unsplash.com/photo-1576398289164-c48dc021b4e1?w=400&h=300&fit=crop", description: "Mobile Kühltruhe für Flaschen, Dosen und Fässer. Hält alles den ganzen Tag kalt.", price: 30, unit: "pro 3 Werktage", category: "Kühlung & Zapf", maxQty: 10 },
  { id: 1003, name: "Kühlwagen (mit Getränken)", slug: "kuehlwagen-mit", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop", description: "Mobiler Kühlwagen für Events. Preis bei Buchung mit Getränken von uns.", price: 130, unit: "pro 3 Werktage", category: "Kühlung & Zapf", maxQty: 2 },
  { id: 1004, name: "Kühlwagen (ohne Getränke)", slug: "kuehlwagen-ohne", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=300&fit=crop", description: "Mobiler Kühlwagen für Events. Preis ohne Getränkebestellung.", price: 200, unit: "pro 3 Werktage", category: "Kühlung & Zapf", maxQty: 2 },
  { id: 1005, name: "Theke", slug: "theke", image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop", description: "Mobile Theke für den professionellen Look auf deiner Feier.", price: 35, unit: "pro 3 Werktage", category: "Mobiliar", maxQty: 5 },
  { id: 1006, name: "Nasstheke mit Becken", slug: "nasstheke", image: "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=400&h=300&fit=crop", description: "Nasstheke mit integriertem Becken — perfekt für Cocktails und Ausschank.", price: 50, unit: "pro 3 Werktage", category: "Mobiliar", maxQty: 3 },
  { id: 1007, name: "Weingläser", slug: "weinglaeser", image: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=400&h=300&fit=crop", description: "Weingläser für stilvolle Anlässe. Verschiedene Größen verfügbar.", price: 0.40, unit: "pro Stück / 3 Werktage", category: "Gläser", maxQty: 500 },
  { id: 1008, name: "Sektgläser", slug: "sektglaeser", image: "https://images.unsplash.com/photo-1551751299-1b51cab2694c?w=400&h=300&fit=crop", description: "Elegante Sektgläser für Empfänge, Hochzeiten und Feiern.", price: 0.40, unit: "pro Stück / 3 Werktage", category: "Gläser", maxQty: 500 },
  { id: 1009, name: "Schnapsgläser", slug: "schnapsglaeser", image: "https://images.unsplash.com/photo-1589927986089-35812388d1f4?w=400&h=300&fit=crop", description: "Schnapsgläser für Shots und Digestifs.", price: 0.40, unit: "pro Stück / 3 Werktage", category: "Gläser", maxQty: 500 },
  { id: 1010, name: "Biergläser", slug: "bierglaeser", image: "https://images.unsplash.com/photo-1600877920581-a26cc2721cfb?w=400&h=300&fit=crop", description: "Biergläser 0,3L — für den perfekten Biergenuss auf deiner Feier.", price: 0.20, unit: "pro Stück / 3 Werktage", category: "Gläser", maxQty: 500 },
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

  const workdays = useMemo(() => calculateWorkdays(dateFrom, dateTo), [dateFrom, dateTo]);
  const periods = useMemo(() => calculateRentalPeriods(workdays), [workdays]);

  const updateBooking = (item: RentalItem, qty: number) => {
    setBookings(prev => {
      if (qty <= 0) return prev.filter(b => b.item.id !== item.id);
      const existing = prev.find(b => b.item.id === item.id);
      if (existing) return prev.map(b => b.item.id === item.id ? { ...b, quantity: Math.min(qty, item.maxQty) } : b);
      return [...prev, { item, quantity: Math.min(qty, item.maxQty) }];
    });
  };

  const getQty = (id: number) => bookings.find(b => b.item.id === id)?.quantity || 0;

  const getItemRentalPrice = (item: RentalItem) => {
    if (!dateFrom || !dateTo || workdays <= 0) return item.price;
    return calculateRentalPrice(item.price, workdays);
  };

  const totalPrice = bookings.reduce((sum, b) => sum + getItemRentalPrice(b.item) * b.quantity, 0);

  const handleAddAllToCart = () => {
    if (!dateFrom || !dateTo || workdays <= 0) return;

    bookings.forEach(b => {
      const rentalPrice = calculateRentalPrice(b.item.price, workdays);
      const rental: RentalInfo = {
        startDate: dateFrom,
        endDate: dateTo,
        workdays,
        periods,
        basePrice: b.item.price,
        totalRentalPrice: rentalPrice,
      };

      const product: Product = {
        id: b.item.id,
        name: b.item.name,
        slug: b.item.slug,
        price: b.item.price,
        category: "Vermietung",
        categorySlug: "vermietung",
        description: b.item.description,
        image: "https://www.trinkgut.de/media/1c/e7/ec/1687794978/trinkgut-logo.svg",
        unit: b.item.unit,
        inStock: true,
      };
      addItem(product, b.quantity, rental);
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

  // Nur Sonntag ist Wochenende/kein Werktag. Samstag zählt als Werktag!
  const isWeekend = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.getDay() === 0; // Nur Sonntag
  };

  const RentalIcon = ({ iconKey }: { iconKey: string }) => {
    const IconComponent = iconComponents[iconKey];
    if (!IconComponent) return null;
    return <IconComponent />;
  };

  return (
    <>
    {/* Red Hero Banner */}
    <div className="page-hero-banner py-16 md:py-24">
      <ShimmerParticles />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <nav className="text-sm text-white/60 mb-4"><a href="/" className="hover:text-white">Home</a> <span className="mx-1">/</span> <span className="text-white">Vermietung</span></nav>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-3">Vermietung & Leihsortiment</h1>
        <p className="text-white/80 max-w-xl mx-auto text-lg">
          Zapfanlagen, Kühlwagen, Theken, Gläser und mehr — alles für deine Feier. Wähle Artikel, Menge und Zeitraum.
        </p>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      {/* Rental Info Box */}
      <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 mb-8">
        <div className="flex items-start gap-3">
          <span className="text-amber-600 mt-0.5"><WarningIcon /></span>
          <div>
            <h3 className="font-bold text-amber-900 mb-1">Leihgebühr-Information</h3>
            <p className="text-sm text-amber-800">
              Die Leihgebühr gilt jeweils für <strong>3 Werktage</strong> (Mo–Sa). Ab dem 4. Werktag wird die Leihgebühr erneut berechnet.
              Nur Sonntag wird nicht mitgezählt.
            </p>
            <p className="text-sm text-amber-800 mt-1">
              <strong>Beispiel:</strong> Zapfanlage {formatPrice(25)} für 3 Werktage. Bei 5 Werktagen = {formatPrice(50)} (2 Perioden). Bei 7 Werktagen = {formatPrice(75)} (3 Perioden).
            </p>
            <p className="text-xs text-amber-700 mt-2 font-medium">
              Formel: Anzahl Perioden (aufgerundet: Werktage / 3) x Grundgebühr
            </p>
          </div>
        </div>
      </div>

      {/* Date Picker */}
      <div className="bg-white border border-border rounded-2xl p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-secondary mb-1">Abholdatum</label>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); if (dateTo && e.target.value > dateTo) setDateTo(""); }} min={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-secondary mb-1">Rückgabedatum</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} min={dateFrom || new Date().toISOString().split("T")[0]} className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
          </div>
          <button onClick={() => setShowCalendar(!showCalendar)} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center ${showCalendar ? "bg-primary text-white" : "border border-border text-muted hover:border-primary hover:text-primary"}`}>
            <CalendarIcon /> {showCalendar ? "Schließen" : "Kalender"}
          </button>
        </div>

        {/* Live Calculation Display */}
        {dateFrom && dateTo && workdays > 0 && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div>
                <span className="text-amber-700">Zeitraum:</span>{" "}
                <strong className="text-amber-900">
                  {new Date(dateFrom).toLocaleDateString("de-DE")} – {new Date(dateTo).toLocaleDateString("de-DE")}
                </strong>
              </div>
              <div>
                <span className="text-amber-700">Werktage (Mo–Fr):</span>{" "}
                <strong className="text-amber-900">{workdays}</strong>
              </div>
              <div>
                <span className="text-amber-700">Leihperioden:</span>{" "}
                <strong className="text-amber-900">{periods}x</strong>
                <span className="text-amber-600 text-xs ml-1">(je 3 Werktage)</span>
              </div>
            </div>
            {periods > 1 && (
              <p className="text-xs text-amber-700 mt-2">
                Die Grundgebühr wird <strong>{periods}-fach</strong> berechnet, da der Leihzeitraum {workdays} Werktage umfasst.
              </p>
            )}
          </div>
        )}

        {dateFrom && dateTo && workdays === 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-700">Der gewählte Zeitraum enthält keine Werktage. Bitte wähle einen Zeitraum mit mindestens einem Werktag (Mo–Fr).</p>
          </div>
        )}

        {showCalendar && (
          <div className="mt-6 border-t border-border pt-6">
            <div className="grid md:grid-cols-3 gap-6">
              {calendarMonths().map((month) => (
                <div key={month.name}>
                  <h4 className="font-medium text-secondary text-sm mb-2 text-center">{month.name}</h4>
                  <div className="grid grid-cols-7 gap-0.5 text-center text-xs">
                    {["Mo","Di","Mi","Do","Fr","Sa","So"].map(d => <div key={d} className={`font-medium py-1 ${d === "Sa" || d === "So" ? "text-amber-500" : "text-muted"}`}>{d}</div>)}
                    {month.days.map((day, i) => {
                      if (day === null) return <div key={`e-${i}`} />;
                      const ds = `${month.year}-${String(month.month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                      const past = new Date(ds) < new Date(new Date().toDateString());
                      const weekend = isWeekend(ds);
                      const sel = ds >= dateFrom && ds <= dateTo && dateFrom && dateTo;
                      const isEdge = ds === dateFrom || ds === dateTo;
                      return (
                        <div
                          key={ds}
                          onClick={() => {
                            if (past) return;
                            if (!dateFrom || (dateFrom && dateTo)) {
                              setDateFrom(ds);
                              setDateTo("");
                            } else {
                              if (ds > dateFrom) setDateTo(ds);
                              else { setDateTo(dateFrom); setDateFrom(ds); }
                            }
                          }}
                          className={`py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                            past ? "text-gray-300 cursor-not-allowed" :
                            isEdge ? "bg-primary text-white font-bold" :
                            sel && weekend ? "bg-amber-100 text-amber-500 line-through" :
                            sel ? "bg-primary/10 text-primary" :
                            weekend ? "text-amber-400" :
                            "hover:bg-light text-secondary"
                          }`}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted text-center mt-3">Wochenenden sind <span className="text-amber-500 font-medium">orange</span> markiert und werden nicht als Werktage gezählt.</p>
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
          const rentalPrice = getItemRentalPrice(item);
          const showMultiplier = dateFrom && dateTo && workdays > 0 && periods > 1;
          return (
            <div key={item.id} className="bg-white border border-border rounded-2xl overflow-hidden card-hover">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-3 right-3">
                  <h3 className="font-bold text-white text-lg drop-shadow-lg">{item.name}</h3>
                </div>
              </div>
              <div className="p-5">
                <p className="text-xs text-muted mb-3">{item.description}</p>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                <div>
                  {showMultiplier ? (
                    <>
                      <span className="text-xl font-extrabold text-primary">{formatPrice(rentalPrice)}</span>
                      <span className="text-xs text-muted block">{formatPrice(item.price)} x {periods} Perioden</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl font-extrabold text-primary">{formatPrice(item.price)}</span>
                      <span className="text-xs text-muted block">{item.unit}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {qty > 0 && <button onClick={() => updateBooking(item, qty - 1)} className="w-8 h-8 rounded-lg bg-light border border-border text-sm font-bold hover:border-primary transition-colors">-</button>}
                  {qty > 0 && <span className="w-8 text-center font-bold text-sm">{qty}</span>}
                  <button onClick={() => updateBooking(item, qty + 1)} disabled={qty >= item.maxQty} className={`${qty === 0 ? "px-3 py-1.5" : "w-8 h-8"} rounded-lg text-sm font-bold transition-colors ${qty >= item.maxQty ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-primary hover:bg-primary-dark text-white"}`}>{qty === 0 ? "+ Buchen" : "+"}</button>
                </div>
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
          {dateFrom && dateTo && workdays > 0 && (
            <div className="text-sm text-muted mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="flex items-center"><CalendarIcon /> {new Date(dateFrom).toLocaleDateString("de-DE")} – {new Date(dateTo).toLocaleDateString("de-DE")}</p>
              <p className="mt-1 font-medium text-amber-800">{workdays} Werktage (Mo–Fr) = {periods} Leihperiode{periods > 1 ? "n" : ""} (je 3 Werktage)</p>
            </div>
          )}
          <div className="space-y-2 mb-4">
            {bookings.map(b => {
              const rentalPrice = getItemRentalPrice(b.item);
              return (
                <div key={b.item.id} className="flex justify-between text-sm">
                  <span className="text-muted">
                    {b.quantity}x {b.item.name}
                    {dateFrom && dateTo && workdays > 0 && periods > 1 && (
                      <span className="text-xs text-amber-600 ml-1">({formatPrice(b.item.price)} x {periods} Perioden)</span>
                    )}
                  </span>
                  <span className="font-medium text-secondary">{formatPrice(rentalPrice * b.quantity)}</span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-border pt-3 flex items-center justify-between">
            <div>
              <span className="text-sm text-muted">Gesamt:</span>
              <span className="text-2xl font-extrabold text-primary ml-2">{formatPrice(totalPrice)}</span>
            </div>
            <button onClick={handleAddAllToCart} disabled={!dateFrom || !dateTo || workdays <= 0} className={`px-6 py-3 font-bold rounded-xl transition-colors btn-hover ${!dateFrom || !dateTo || workdays <= 0 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-primary hover:bg-primary-dark text-white"}`}>In den Warenkorb</button>
          </div>
          {(!dateFrom || !dateTo) && <p className="text-xs text-amber-600 mt-2 flex items-center"><WarningIcon /> Bitte Abhol- und Rückgabedatum wählen, um fortzufahren.</p>}
          {dateFrom && dateTo && workdays <= 0 && <p className="text-xs text-red-600 mt-2 font-medium">Der gewählte Zeitraum enthält keine Werktage.</p>}
        </div>
      )}

      {/* CTA */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-8 text-white text-center">
        <h2 className="text-2xl font-bold mb-2">Individuelle Beratung?</h2>
        <p className="text-white/70 mb-4">Für größere Events beraten wir dich gerne persönlich.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a href="tel:02823418707" className="px-6 py-3 bg-accent hover:bg-accent-dark text-secondary font-bold rounded-xl transition-colors flex items-center"><PhoneIcon /> 02823-418707</a>
          <a href="https://wa.me/491752492386" target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors flex items-center"><WhatsAppIcon /> WhatsApp</a>
        </div>
      </div>
    </div>
    </>
  );
}
