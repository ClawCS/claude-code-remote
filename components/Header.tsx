"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useTranslation, LANG_KEY, LANG_CHANGE_EVENT, type Lang } from "@/lib/i18n";

type DropdownItem = { href: string; labelKey: string; icon: string };

type NavItem = {
  labelKey: string;
  href?: string;
  children?: DropdownItem[];
};

const navItems: NavItem[] = [
  {
    labelKey: "nav.sortiment",
    children: [
      { href: "/produkte", labelKey: "nav.alleProdukte", icon: "\u{1F6D2}" },
      { href: "/kategorie/bier", labelKey: "nav.bier", icon: "\u{1F37A}" },
      { href: "/kategorie/alkoholfrei", labelKey: "nav.alkoholfrei", icon: "\u{1F964}" },
      { href: "/kategorie/wein", labelKey: "nav.wein", icon: "\u{1F377}" },
      { href: "/kategorie/sekt", labelKey: "nav.sekt", icon: "\u{1F942}" },
      { href: "/kategorie/spirituosen", labelKey: "nav.spirituosen", icon: "\u{1F943}" },
      { href: "/kategorie/lebensmittel", labelKey: "nav.lebensmittel", icon: "\u{1F6D2}" },
    ],
  },
  {
    labelKey: "nav.services",
    children: [
      { href: "/partyplaner", labelKey: "nav.partyplaner", icon: "\u{1F389}" },
      { href: "/vermietung", labelKey: "nav.vermietung", icon: "\u{1F3AA}" },
      { href: "/finder", labelKey: "nav.finder", icon: "\u{1F50D}" },
      { href: "/leergut", labelKey: "nav.leergut", icon: "\u267B\uFE0F" },
      { href: "/follower-rabatt", labelKey: "nav.followerRabatt", icon: "\u{1F4F1}" },
    ],
  },
  {
    labelKey: "nav.erleben",
    children: [
      { href: "/cocktails", labelKey: "nav.cocktails", icon: "\u{1F378}" },
      { href: "/partyspiele", labelKey: "nav.partyspiele", icon: "\u{1F3B2}" },
      { href: "/galerie", labelKey: "nav.galerie", icon: "\u{1F4F8}" },
      { href: "/battle", labelKey: "nav.battle", icon: "\u{1F94A}" },
      { href: "/gluecksrad", labelKey: "nav.gluecksrad", icon: "\u{1F3B0}" },
      { href: "/oeko-tracker", labelKey: "nav.oekoTracker", icon: "\u{1F30D}" },
      { href: "/bierkarte", labelKey: "nav.bierkarte", icon: "\u{1F5FA}\uFE0F" },
      { href: "/kuehlschrank", labelKey: "nav.kuehlschrank", icon: "\u{1F9CA}" },
    ],
  },
  {
    labelKey: "nav.handzettel",
    children: [
      { href: "/handzettel", labelKey: "nav.handzettelDE", icon: "\u{1F1E9}\u{1F1EA}" },
      { href: "/handzettel", labelKey: "nav.handzettelNL", icon: "\u{1F1F3}\u{1F1F1}" },
    ],
  },
  { labelKey: "nav.akademie", href: "/akademie" },
  { labelKey: "nav.community", href: "/community" },
  { labelKey: "nav.jobs", href: "/bewerbung" },
];

const langLabels: Record<Lang, string> = {
  de: "DE",
  en: "EN",
  nl: "NL",
};

const langFlags: Record<Lang, React.ReactNode> = {
  de: (
    <svg className="w-5 h-3.5 rounded-sm" viewBox="0 0 20 14">
      <rect width="20" height="4.67" fill="#000" />
      <rect y="4.67" width="20" height="4.67" fill="#DD0000" />
      <rect y="9.33" width="20" height="4.67" fill="#FFCC00" />
    </svg>
  ),
  en: (
    <svg className="w-5 h-3.5 rounded-sm" viewBox="0 0 20 14">
      <rect width="20" height="14" fill="#012169" />
      <path d="M0,0 L20,14 M20,0 L0,14" stroke="#fff" strokeWidth="2.5" />
      <path d="M0,0 L20,14 M20,0 L0,14" stroke="#C8102E" strokeWidth="1.5" />
      <path d="M10,0 V14 M0,7 H20" stroke="#fff" strokeWidth="4" />
      <path d="M10,0 V14 M0,7 H20" stroke="#C8102E" strokeWidth="2.5" />
    </svg>
  ),
  nl: (
    <svg className="w-5 h-3.5 rounded-sm" viewBox="0 0 20 14">
      <rect width="20" height="4.67" fill="#AE1C28" />
      <rect y="4.67" width="20" height="4.67" fill="#FFF" />
      <rect y="9.33" width="20" height="4.67" fill="#21468B" />
    </svg>
  ),
};

function DesktopDropdown({ item, open, onToggle, t }: { item: NavItem; open: boolean; onToggle: () => void; t: (key: string) => string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onToggle();
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onToggle]);

  if (!item.children) {
    return (
      <Link href={item.href!} className="text-sm font-medium text-muted hover:text-primary transition-colors px-3 py-2">
        {t(item.labelKey)}
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        className={`text-sm font-medium px-3 py-2 transition-colors flex items-center gap-1 ${open ? "text-primary" : "text-muted hover:text-primary"}`}
      >
        {t(item.labelKey)}
        <svg className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-border rounded-xl shadow-xl py-2 min-w-[220px] z-50 border-t-2 border-t-primary">
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={onToggle}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-secondary hover:bg-light hover:text-primary transition-colors"
            >
              <span className="text-lg">{child.icon}</span>
              {t(child.labelKey)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function WmTrophyIcon() {
  return (
    <Link
      href="/tippkick"
      className="relative flex flex-col items-center gap-0.5 group"
      title="🏆 WM 2026 Tippspiel — Hier teilnehmen!"
    >
      {/* Animated glow ring */}
      <span className="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-400/30 via-yellow-300/20 to-amber-400/30 blur-sm animate-pulse group-hover:from-amber-400/50 group-hover:via-yellow-300/40 group-hover:to-amber-400/50 transition-all" />
      {/* Star burst behind */}
      <svg className="absolute -inset-1 h-12 w-12" viewBox="0 0 48 48" fill="none">
        {[0,45,90,135,180,225,270,315].map((r) => (
          <line key={r} x1="24" y1="24" x2="24" y2="4" stroke="#FFD700" strokeWidth="0.5" opacity="0.3" transform={`rotate(${r} 24 24)`} />
        ))}
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="relative h-9 w-9 wm-trophy-icon drop-shadow-[0_0_6px_rgba(255,215,0,0.5)]"
        aria-label="WM 2026 Tippspiel"
      >
        <defs>
          <linearGradient id="trophyGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="50%" stopColor="#FFC107" />
            <stop offset="100%" stopColor="#FF8F00" />
          </linearGradient>
          <linearGradient id="trophyShine" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF9C4" />
            <stop offset="100%" stopColor="#FFD700" />
          </linearGradient>
        </defs>
        {/* Cup body */}
        <path
          d="M5 3h14v2c0 4.418-3.134 8-7 8S5 9.418 5 5V3z"
          fill="url(#trophyGold)"
          stroke="#B8860B"
          strokeWidth="0.5"
        />
        {/* Left handle */}
        <path
          d="M5 5H3c0 2.5 1.5 4 3 4"
          fill="none"
          stroke="url(#trophyGold)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Right handle */}
        <path
          d="M19 5h2c0 2.5-1.5 4-3 4"
          fill="none"
          stroke="url(#trophyGold)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Stem */}
        <rect x="10.5" y="13" width="3" height="3" rx="0.5" fill="url(#trophyGold)" />
        {/* Base */}
        <rect x="8" y="16" width="8" height="2" rx="1" fill="url(#trophyGold)" stroke="#B8860B" strokeWidth="0.3" />
        {/* Star on cup */}
        <path
          d="M12 5.5l1 2 2.2.3-1.6 1.5.4 2.2L12 10.3 10 11.5l.4-2.2L8.8 7.8 11 7.5z"
          fill="url(#trophyShine)"
        />
      </svg>
      {/* Permanent label */}
      <span className="text-[9px] font-bold leading-none text-amber-600 tracking-tight whitespace-nowrap">WM 2026</span>
    </Link>
  );
}

function GewinnspielIcon() {
  return (
    <Link
      href="/gewinnspiel"
      className="relative flex flex-col items-center gap-0.5 group"
      title="🎁 Monatsgewinnspiel — Jetzt mitmachen!"
    >
      {/* Animated glow ring */}
      <span className="absolute -inset-2 rounded-full bg-gradient-to-r from-red-400/30 via-pink-300/20 to-red-400/30 blur-sm animate-pulse group-hover:from-red-400/50 group-hover:via-pink-300/40 group-hover:to-red-400/50 transition-all" />
      {/* Sparkles */}
      <svg className="absolute -inset-1 h-12 w-12" viewBox="0 0 48 48" fill="none">
        <circle cx="8" cy="12" r="1.5" fill="#FFD700" opacity="0.6" className="animate-ping" style={{animationDuration: "2s"}} />
        <circle cx="40" cy="14" r="1" fill="#FFD700" opacity="0.5" className="animate-ping" style={{animationDuration: "2.5s"}} />
        <circle cx="38" cy="38" r="1.2" fill="#FFD700" opacity="0.4" className="animate-ping" style={{animationDuration: "3s"}} />
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="relative h-9 w-9 gewinnspiel-icon drop-shadow-[0_0_6px_rgba(196,30,58,0.4)]" aria-label="Gewinnspiel">
        <defs>
          <linearGradient id="giftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C41E3A" />
            <stop offset="100%" stopColor="#FF6B6B" />
          </linearGradient>
        </defs>
        {/* Box */}
        <rect x="3" y="10" width="18" height="10" rx="2" fill="url(#giftGrad)" />
        {/* Lid */}
        <rect x="2" y="7" width="20" height="4" rx="1.5" fill="url(#giftGrad)" stroke="#A01030" strokeWidth="0.3" />
        {/* Ribbon vertical */}
        <rect x="10.5" y="7" width="3" height="13" fill="#FFD700" />
        {/* Ribbon horizontal */}
        <rect x="2" y="8" width="20" height="2" fill="#FFD700" opacity="0.7" />
        {/* Bow left */}
        <ellipse cx="10" cy="6" rx="3" ry="2.5" fill="#FFD700" stroke="#B8860B" strokeWidth="0.3" />
        {/* Bow right */}
        <ellipse cx="14" cy="6" rx="3" ry="2.5" fill="#FFD700" stroke="#B8860B" strokeWidth="0.3" />
        {/* Bow center */}
        <circle cx="12" cy="6.5" r="1.5" fill="#C41E3A" />
      </svg>
      <span className="text-[9px] font-bold leading-none text-primary tracking-tight whitespace-nowrap">Gewinnspiel</span>
    </Link>
  );
}

function LanguageSwitcher({ className }: { className?: string }) {
  const [lang, setLang] = useState<Lang>("de");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY) as Lang | null;
    if (stored && langLabels[stored]) setLang(stored);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const selectLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem(LANG_KEY, l);
    setOpen(false);
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event(LANG_CHANGE_EVENT));
  };

  return (
    <div ref={ref} className={`relative ${className || ""}`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-secondary hover:text-primary rounded-md hover:bg-light transition-colors"
        aria-label="Sprache wechseln"
      >
        {langFlags[lang]}
        <span className="font-semibold">{langLabels[lang]}</span>
        <svg className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 bg-white border border-border rounded-lg shadow-xl py-1 min-w-[100px] z-50">
          {(Object.keys(langLabels) as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => selectLang(l)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                lang === l ? "text-primary bg-red-50 font-semibold" : "text-secondary hover:bg-light"
              }`}
            >
              {langFlags[l]}
              {langLabels[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { totalItems, setIsCartOpen } = useCart();
  const { totalItems: wishlistTotal, setIsWishlistOpen } = useWishlist();
  const router = useRouter();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    if (mobileSearchOpen && mobileSearchInputRef.current) {
      mobileSearchInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/produkte?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleMobileSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mobileSearchQuery.trim()) {
      router.push(`/produkte?search=${encodeURIComponent(mobileSearchQuery.trim())}`);
      setMobileSearchOpen(false);
      setMobileSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 glass-header shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image
              src="/images/logo-trinkgut-jammers.png"
              alt="Trinkgut Jammers"
              width={160}
              height={63}
              className="h-11 w-auto"
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center">
            {navItems.map((item) => (
              <DesktopDropdown
                key={item.labelKey}
                item={item}
                open={openDropdown === item.labelKey}
                onToggle={() => setOpenDropdown(openDropdown === item.labelKey ? null : item.labelKey)}
                t={t}
              />
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* WM 2026 Trophy Icon - always visible */}
            <WmTrophyIcon />
            {/* Gewinnspiel Icon */}
            <GewinnspielIcon />

            {/* Language Switcher */}
            <LanguageSwitcher className="hidden lg:block" />

            {/* Search toggle - Desktop */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="hidden lg:flex p-2 text-secondary hover:text-primary transition-colors"
              aria-label="Suche"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Search toggle - Mobile */}
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="lg:hidden p-2 text-secondary hover:text-primary transition-colors"
              aria-label="Suche"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Wishlist */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="relative p-2 text-secondary hover:text-primary transition-colors"
              aria-label="Merkzettel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {wishlistTotal > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {wishlistTotal}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-secondary hover:text-primary transition-colors"
              aria-label="Warenkorb \u00f6ffnen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-secondary"
              aria-label="Men\u00fc"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop Search Bar - slides down */}
        {searchOpen && (
          <div className="hidden lg:block pb-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t("search.placeholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-20 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="submit"
                  className="px-3 py-1 bg-primary text-white text-xs font-medium rounded-md hover:bg-primary-dark transition-colors"
                >
                  {t("btn.suchen")}
                </button>
                <button
                  type="button"
                  onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                  className="p-1 text-muted hover:text-secondary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Mobile fullscreen search overlay */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 bg-white z-[60] lg:hidden">
          <div className="flex items-center gap-2 p-4 border-b border-border">
            <form onSubmit={handleMobileSearchSubmit} className="flex-1 relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={mobileSearchInputRef}
                type="text"
                placeholder={t("search.placeholder")}
                value={mobileSearchQuery}
                onChange={(e) => setMobileSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </form>
            <button
              onClick={() => { setMobileSearchOpen(false); setMobileSearchQuery(""); }}
              className="p-2 text-muted hover:text-secondary"
            >
              {t("btn.abbrechen")}
            </button>
          </div>
          {mobileSearchQuery.trim() && (
            <div className="p-4">
              <button
                onClick={() => {
                  router.push(`/produkte?search=${encodeURIComponent(mobileSearchQuery.trim())}`);
                  setMobileSearchOpen(false);
                  setMobileSearchQuery("");
                }}
                className="w-full text-left px-4 py-3 bg-light rounded-lg text-sm text-secondary hover:bg-border transition-colors"
              >
                {t("search.prefix")} &ldquo;{mobileSearchQuery.trim()}&rdquo;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed right-0 top-0 h-full w-[280px] bg-white z-50 shadow-2xl lg:hidden overflow-y-auto">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#C41E3A] to-[#9B1B30]">
              <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
                <Image src="/images/logo-trinkgut-jammers.png" alt="Trinkgut Jammers" width={130} height={51} className="h-9 w-auto" />
              </Link>
              <button onClick={() => setMobileOpen(false)} className="p-1 text-white/80 hover:text-white" aria-label="Schlie\u00dfen">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile Language Switcher */}
            <div className="flex gap-2 px-4 pt-3 pb-1">
              <LanguageSwitcher className="" />
            </div>

            {/* Mobile Nav */}
            <nav className="p-4">
              {navItems.map((item) => (
                <div key={item.labelKey} className="mb-1">
                  {item.children ? (
                    <>
                      <button
                        onClick={() => setMobileExpanded(mobileExpanded === item.labelKey ? null : item.labelKey)}
                        className="w-full flex items-center justify-between py-2.5 text-sm font-semibold text-secondary"
                      >
                        {t(item.labelKey)}
                        <svg className={`h-4 w-4 text-muted transition-transform ${mobileExpanded === item.labelKey ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {mobileExpanded === item.labelKey && (
                        <div className="pl-2 pb-2 space-y-0.5">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center gap-2.5 py-2 px-3 text-sm text-muted hover:text-primary hover:bg-light rounded-lg transition-colors"
                            >
                              <span>{child.icon}</span>
                              {t(child.labelKey)}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href!}
                      onClick={() => setMobileOpen(false)}
                      className="block py-2.5 text-sm font-semibold text-secondary hover:text-primary transition-colors"
                    >
                      {t(item.labelKey)}
                    </Link>
                  )}
                </div>
              ))}

              {/* Bestellhistorie link in mobile drawer */}
              <div className="mt-2 pt-2 border-t border-border">
                <Link
                  href="/bestellungen"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2.5 py-2.5 text-sm font-semibold text-secondary hover:text-primary transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {t("nav.bestellungen")}
                </Link>
              </div>
            </nav>

            {/* Mobile CTA */}
            <div className="p-4 border-t border-border">
              <a
                href="tel:02823418707"
                className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors mb-2"
              >
                {"\u{1F4DE}"} 02823-418707
              </a>
              <p className="text-xs text-muted">{t("mobile.oeffnung")}</p>
            </div>
          </div>
        </>
      )}
    </header>
  );
}

function MobileLangButton({ lang }: { lang: Lang }) {
  const [activeLang, setActiveLang] = useState<Lang>("de");

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY) as Lang | null;
    if (stored && langLabels[stored]) setActiveLang(stored);
  }, []);

  const handleClick = () => {
    setActiveLang(lang);
    localStorage.setItem(LANG_KEY, lang);
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event(LANG_CHANGE_EVENT));
  };

  useEffect(() => {
    const handler = () => {
      const stored = localStorage.getItem(LANG_KEY) as Lang | null;
      if (stored && langLabels[stored]) setActiveLang(stored);
    };
    window.addEventListener("storage", handler);
    window.addEventListener(LANG_CHANGE_EVENT, handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(LANG_CHANGE_EVENT, handler);
    };
  }, []);

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
        activeLang === lang
          ? "bg-primary/10 text-primary border border-primary/30"
          : "bg-light text-muted hover:bg-border"
      }`}
    >
      {langFlags[lang]}
      {langLabels[lang]}
    </button>
  );
}
