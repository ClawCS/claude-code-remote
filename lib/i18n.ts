"use client";

import { useState, useEffect, useCallback } from "react";

export type Lang = "de" | "en" | "nl";
export const LANG_KEY = "trinkgut-lang";
export const LANG_CHANGE_EVENT = "trinkgut-lang-change";

const translations = {
  de: {
    // Navigation
    "nav.sortiment": "Sortiment",
    "nav.angebote": "Angebote",
    "nav.services": "Services",
    "nav.erleben": "Erleben",
    "nav.akademie": "Akademie",
    "nav.wmtipp": "\u26BD WM Tipp",
    "nav.jobs": "Jobs",

    // Navigation dropdown items
    "nav.alleProdukte": "Alle Produkte",
    "nav.bier": "Bier",
    "nav.alkoholfrei": "Alkoholfreie Getr\u00e4nke",
    "nav.wein": "Wein",
    "nav.sekt": "Sekt & Co.",
    "nav.spirituosen": "Spirituosen",
    "nav.lebensmittel": "Lebensmittel & Mehr",
    "nav.aktuelleAngebote": "Aktuelle Angebote",
    "nav.handzettel": "Handzettel",
    "nav.handzettelDE": "🇩🇪 Handzettel Deutschland",
    "nav.handzettelNL": "🇳🇱 Folder Nederland",
    "nav.followerRabatt": "5\u20ac Follower-Rabatt",
    "nav.partyplaner": "Partyplaner",
    "nav.vermietung": "Vermietung & Leih",
    "nav.finder": "Getr\u00e4nke-Finder",
    "nav.cocktails": "65 Cocktail-Rezepte",
    "nav.galerie": "Fotogalerie",
    "nav.battle": "Getränke-Battle",
    "nav.gluecksrad": "Glücksrad",
    "nav.gewinnspiel": "Gewinnspiel",
    "nav.bestellungen": "Meine Bestellungen",
    "nav.leergut": "Leergut-Rechner",
    "nav.oekoTracker": "\u00d6ko-Tracker",
    "nav.bierkarte": "Bier-Weltkarte",
    "nav.kuehlschrank": "K\u00fchlschrank-Check",
    "nav.partyspiele": "Partyspiele",
    "nav.community": "Community",

    // Hero
    "hero.badge": "Trinkgut Jammers Goch",
    "hero.title1": "Dein Getr\u00e4nkemarkt.",
    "hero.title2": "Online entdecken.",
    "hero.subtitle": "\u00dcber 7.000 Artikel \u2014 von Bier \u00fcber Wein bis Spirituosen. Partyplanung, Vermietung und pers\u00f6nliche Beratung.",
    "hero.cta1": "Sortiment entdecken",
    "hero.cta2": "\ud83c\udf89 Party planen",

    // Buttons
    "btn.warenkorb": "+ Warenkorb",
    "btn.mehrErfahren": "Mehr erfahren",
    "btn.jetztEntdecken": "Jetzt entdecken",
    "btn.anmelden": "Anmelden",
    "btn.alleProdukte": "Alle Produkte",
    "btn.suchen": "Suchen",
    "btn.abbrechen": "Abbrechen",

    // Categories
    "cat.bier": "Bier",
    "cat.alkoholfrei": "Alkoholfreie Getr\u00e4nke",
    "cat.wein": "Wein",
    "cat.sekt": "Sekt & Co.",
    "cat.spirituosen": "Spirituosen",
    "cat.lebensmittel": "Lebensmittel & Mehr",

    // Home page sections
    "home.video.label": "Erleben",
    "home.video.title": "Trinkgut Jammers \u2014 Der Film",
    "home.video.play": "Dein Moment. Unser Markt.",
    "home.video.soon": "Video kommt bald \u2014 bleib gespannt!",
    "videoProduction": "Imagefilm in Produktion \u00b7 Folge uns auf Instagram f\u00fcr das Making-Of",
    "home.categories.label": "Sortiment",
    "home.categories.title": "Unsere Kategorien",
    "home.highlights.label": "Empfehlungen",
    "home.highlights.title": "Beliebte Produkte",
    "home.services.label": "Services",
    "home.services.title": "Mehr als nur ein Getr\u00e4nkemarkt",
    "home.service.partyplaner": "Partyplaner",
    "home.service.partyplaner.desc": "Mengen berechnen & direkt bestellen",
    "home.service.vermietung": "Vermietung",
    "home.service.vermietung.desc": "Zapfanlagen, Tische, Gl\u00e4ser & mehr",
    "home.service.finder": "Getr\u00e4nke-Finder",
    "home.service.finder.desc": "Finde dein perfektes Getr\u00e4nk",
    "home.service.cocktails": "65 Cocktail-Rezepte",
    "home.service.cocktails.desc": "Von Mojito bis Espresso Martini",
    "home.community.label": "Community",
    "home.community.title": "Folge uns auf Instagram",
    "home.community.text": "Gewinnspiele, exklusive Rabatte, neue Produkte und Behind-the-Scenes aus dem Markt. Werde Teil der Trinkgut Jammers Community!",
    "home.community.gewinnspiele": "\ud83c\udfc6 Gewinnspiele",
    "home.cta.label": "Jetzt starten",
    "home.cta.title": "Artikel warten auf dich",
    "home.cta.text": "Entdecke unser komplettes Sortiment und bestelle bequem online. Abholung oder Lieferung \u2014 du entscheidest.",

    // Footer
    "footer.brand": "Mit Leidenschaft f\u00fcr Getr\u00e4nke! \u00dcber 7.000 Artikel \u2013 von Bier \u00fcber Wein bis Spirituosen und Softdrinks.",
    "footer.quicklinks": "Schnelllinks",
    "footer.kontakt": "Kontakt",
    "footer.inhaber": "Inhaber: Nikolaos Jammers",
    "footer.scannen": "Scannen & folgen",
    "footer.impressum": "Impressum",
    "footer.datenschutz": "Datenschutz",
    "footer.oeffnung": "Mo\u2013Sa: 08:00\u201320:00 Uhr",

    // Newsletter
    "newsletter.label": "Newsletter",
    "newsletter.title": "Angebote direkt ins Postfach",
    "newsletter.text": "W\u00f6chentliche Angebote, exklusive Aktionen und Gewinnspiele. Kein Spam \u2014 nur das Beste aus deinem Getr\u00e4nkemarkt.",
    "newsletter.placeholder": "deine@email.de",
    "newsletter.privacy": "Mit der Anmeldung akzeptierst du unsere Datenschutzerkl\u00e4rung. Abmeldung jederzeit m\u00f6glich.",
    "newsletter.success": "Anmeldung erfolgreich!",
    "newsletter.successText": "Du erh\u00e4ltst ab jetzt unsere besten Angebote per E-Mail.",

    // Search
    "search.placeholder": "Produkt suchen...",
    "search.prefix": "Suche nach",

    // Mobile
    "mobile.oeffnung": "Mo\u2013Sa 08:00\u201320:00 Uhr",

    // ProductGrid
    "productGrid.empty": "Keine Produkte gefunden.",
  },

  en: {
    // Navigation
    "nav.sortiment": "Products",
    "nav.angebote": "Offers",
    "nav.services": "Services",
    "nav.erleben": "Experience",
    "nav.akademie": "Academy",
    "nav.wmtipp": "\u26BD World Cup Tips",
    "nav.jobs": "Jobs",

    // Navigation dropdown items
    "nav.alleProdukte": "All Products",
    "nav.bier": "Beer",
    "nav.alkoholfrei": "Non-Alcoholic Drinks",
    "nav.wein": "Wine",
    "nav.sekt": "Sparkling & Co.",
    "nav.spirituosen": "Spirits",
    "nav.lebensmittel": "Food & More",
    "nav.aktuelleAngebote": "Current Offers",
    "nav.handzettel": "Flyer",
    "nav.handzettelDE": "🇩🇪 Flyer Germany",
    "nav.handzettelNL": "🇳🇱 Folder Netherlands",
    "nav.followerRabatt": "\u20ac5 Follower Discount",
    "nav.partyplaner": "Party Planner",
    "nav.vermietung": "Rental & Loan",
    "nav.finder": "Beverage Finder",
    "nav.cocktails": "65 Cocktail Recipes",
    "nav.galerie": "Photo Gallery",
    "nav.battle": "Beverage Battle",
    "nav.gluecksrad": "Lucky Wheel",
    "nav.gewinnspiel": "Sweepstakes",
    "nav.bestellungen": "My Orders",
    "nav.leergut": "Deposit Calculator",
    "nav.oekoTracker": "Eco Tracker",
    "nav.bierkarte": "Beer World Map",
    "nav.kuehlschrank": "Fridge Check",
    "nav.partyspiele": "Party Games",
    "nav.community": "Community",

    // Hero
    "hero.badge": "Trinkgut Jammers Goch",
    "hero.title1": "Your Beverage Store.",
    "hero.title2": "Explore Online.",
    "hero.subtitle": "Over 7,000 items \u2014 from beer to wine to spirits. Party planning, rental services and personal advice.",
    "hero.cta1": "Explore Products",
    "hero.cta2": "\ud83c\udf89 Plan a Party",

    // Buttons
    "btn.warenkorb": "+ Cart",
    "btn.mehrErfahren": "Learn More",
    "btn.jetztEntdecken": "Discover Now",
    "btn.anmelden": "Subscribe",
    "btn.alleProdukte": "All Products",
    "btn.suchen": "Search",
    "btn.abbrechen": "Cancel",

    // Categories
    "cat.bier": "Beer",
    "cat.alkoholfrei": "Non-Alcoholic Drinks",
    "cat.wein": "Wine",
    "cat.sekt": "Sparkling & Co.",
    "cat.spirituosen": "Spirits",
    "cat.lebensmittel": "Food & More",

    // Home page sections
    "home.video.label": "Experience",
    "home.video.title": "Trinkgut Jammers \u2014 The Movie",
    "home.video.play": "Your Moment. Our Market.",
    "home.video.soon": "Video coming soon \u2014 stay tuned!",
    "videoProduction": "Image film in production \u00b7 Follow us on Instagram for the making-of",
    "home.categories.label": "Products",
    "home.categories.title": "Our Categories",
    "home.highlights.label": "Recommendations",
    "home.highlights.title": "Popular Products",
    "home.services.label": "Services",
    "home.services.title": "More Than Just a Beverage Store",
    "home.service.partyplaner": "Party Planner",
    "home.service.partyplaner.desc": "Calculate quantities & order directly",
    "home.service.vermietung": "Rental",
    "home.service.vermietung.desc": "Tap systems, tables, glasses & more",
    "home.service.finder": "Beverage Finder",
    "home.service.finder.desc": "Find your perfect drink",
    "home.service.cocktails": "65 Cocktail Recipes",
    "home.service.cocktails.desc": "From Mojito to Espresso Martini",
    "home.community.label": "Community",
    "home.community.title": "Follow Us on Instagram",
    "home.community.text": "Sweepstakes, exclusive discounts, new products and behind-the-scenes from the store. Become part of the Trinkgut Jammers Community!",
    "home.community.gewinnspiele": "\ud83c\udfc6 Sweepstakes",
    "home.cta.label": "Get Started",
    "home.cta.title": "items are waiting for you",
    "home.cta.text": "Discover our complete range and order conveniently online. Pickup or delivery \u2014 you decide.",

    // Footer
    "footer.brand": "Passionate about beverages! Over 7,000 items \u2013 from beer to wine to spirits and soft drinks.",
    "footer.quicklinks": "Quick Links",
    "footer.kontakt": "Contact",
    "footer.inhaber": "Owner: Nikolaos Jammers",
    "footer.scannen": "Scan & follow",
    "footer.impressum": "Legal Notice",
    "footer.datenschutz": "Privacy Policy",
    "footer.oeffnung": "Mon\u2013Sat: 08:00\u201320:00",

    // Newsletter
    "newsletter.label": "Newsletter",
    "newsletter.title": "Offers Straight to Your Inbox",
    "newsletter.text": "Weekly offers, exclusive promotions and sweepstakes. No spam \u2014 only the best from your beverage store.",
    "newsletter.placeholder": "your@email.com",
    "newsletter.privacy": "By subscribing you accept our privacy policy. Unsubscribe anytime.",
    "newsletter.success": "Successfully subscribed!",
    "newsletter.successText": "You will now receive our best offers by email.",

    // Search
    "search.placeholder": "Search products...",
    "search.prefix": "Search for",

    // Mobile
    "mobile.oeffnung": "Mon\u2013Sat 08:00\u201320:00",

    // ProductGrid
    "productGrid.empty": "No products found.",
  },

  nl: {
    // Navigation
    "nav.sortiment": "Assortiment",
    "nav.angebote": "Aanbiedingen",
    "nav.services": "Diensten",
    "nav.erleben": "Beleving",
    "nav.akademie": "Academie",
    "nav.wmtipp": "\u26BD WK Tips",
    "nav.jobs": "Vacatures",

    // Navigation dropdown items
    "nav.alleProdukte": "Alle Producten",
    "nav.bier": "Bier",
    "nav.alkoholfrei": "Alcoholvrije Dranken",
    "nav.wein": "Wijn",
    "nav.sekt": "Bubbels & Co.",
    "nav.spirituosen": "Sterke Drank",
    "nav.lebensmittel": "Levensmiddelen & Meer",
    "nav.aktuelleAngebote": "Huidige Aanbiedingen",
    "nav.handzettel": "Folder",
    "nav.handzettelDE": "🇩🇪 Folder Duitsland",
    "nav.handzettelNL": "🇳🇱 Folder Nederland",
    "nav.followerRabatt": "\u20ac5 Volger-Korting",
    "nav.partyplaner": "Feestplanner",
    "nav.vermietung": "Verhuur & Leen",
    "nav.finder": "Dranken-Finder",
    "nav.cocktails": "65 Cocktailrecepten",
    "nav.galerie": "Fotogalerij",
    "nav.battle": "Dranken-Battle",
    "nav.gluecksrad": "Geluksrad",
    "nav.gewinnspiel": "Winactie",
    "nav.bestellungen": "Mijn Bestellingen",
    "nav.leergut": "Statiegeld-Calculator",
    "nav.oekoTracker": "Eco-Tracker",
    "nav.bierkarte": "Bier-Wereldkaart",
    "nav.kuehlschrank": "Koelkast-Check",
    "nav.partyspiele": "Partyspellen",
    "nav.community": "Community",

    // Hero
    "hero.badge": "Trinkgut Jammers Goch",
    "hero.title1": "Jouw Drankenmarkt.",
    "hero.title2": "Online ontdekken.",
    "hero.subtitle": "Meer dan 7.000 artikelen \u2014 van bier tot wijn tot sterke drank. Feestplanning, verhuur en persoonlijk advies.",
    "hero.cta1": "Assortiment bekijken",
    "hero.cta2": "\ud83c\udf89 Feest plannen",

    // Buttons
    "btn.warenkorb": "+ Winkelwagen",
    "btn.mehrErfahren": "Meer informatie",
    "btn.jetztEntdecken": "Nu ontdekken",
    "btn.anmelden": "Aanmelden",
    "btn.alleProdukte": "Alle Producten",
    "btn.suchen": "Zoeken",
    "btn.abbrechen": "Annuleren",

    // Categories
    "cat.bier": "Bier",
    "cat.alkoholfrei": "Alcoholvrije Dranken",
    "cat.wein": "Wijn",
    "cat.sekt": "Bubbels & Co.",
    "cat.spirituosen": "Sterke Drank",
    "cat.lebensmittel": "Levensmiddelen & Meer",

    // Home page sections
    "home.video.label": "Beleving",
    "home.video.title": "Trinkgut Jammers \u2014 De Film",
    "home.video.play": "Jouw Moment. Onze Markt.",
    "home.video.soon": "Video komt binnenkort \u2014 blijf op de hoogte!",
    "videoProduction": "Imagefilm in productie \u00b7 Volg ons op Instagram voor de making-of",
    "home.categories.label": "Assortiment",
    "home.categories.title": "Onze Categorie\u00ebn",
    "home.highlights.label": "Aanbevelingen",
    "home.highlights.title": "Populaire Producten",
    "home.services.label": "Diensten",
    "home.services.title": "Meer Dan Alleen een Drankenmarkt",
    "home.service.partyplaner": "Feestplanner",
    "home.service.partyplaner.desc": "Hoeveelheden berekenen & direct bestellen",
    "home.service.vermietung": "Verhuur",
    "home.service.vermietung.desc": "Tapinstallaties, tafels, glazen & meer",
    "home.service.finder": "Dranken-Finder",
    "home.service.finder.desc": "Vind jouw perfecte drankje",
    "home.service.cocktails": "65 Cocktailrecepten",
    "home.service.cocktails.desc": "Van Mojito tot Espresso Martini",
    "home.community.label": "Community",
    "home.community.title": "Volg Ons op Instagram",
    "home.community.text": "Winacties, exclusieve kortingen, nieuwe producten en behind-the-scenes uit de winkel. Word deel van de Trinkgut Jammers Community!",
    "home.community.gewinnspiele": "\ud83c\udfc6 Winacties",
    "home.cta.label": "Nu beginnen",
    "home.cta.title": "artikelen wachten op je",
    "home.cta.text": "Ontdek ons complete assortiment en bestel gemakkelijk online. Ophalen of bezorgen \u2014 jij beslist.",

    // Footer
    "footer.brand": "Met passie voor dranken! Meer dan 7.000 artikelen \u2013 van bier tot wijn tot sterke drank en frisdrank.",
    "footer.quicklinks": "Snellinks",
    "footer.kontakt": "Contact",
    "footer.inhaber": "Eigenaar: Nikolaos Jammers",
    "footer.scannen": "Scannen & volgen",
    "footer.impressum": "Colofon",
    "footer.datenschutz": "Privacybeleid",
    "footer.oeffnung": "Ma\u2013Za: 08:00\u201320:00",

    // Newsletter
    "newsletter.label": "Nieuwsbrief",
    "newsletter.title": "Aanbiedingen Direct in je Inbox",
    "newsletter.text": "Wekelijkse aanbiedingen, exclusieve acties en winacties. Geen spam \u2014 alleen het beste van jouw drankenmarkt.",
    "newsletter.placeholder": "jouw@email.nl",
    "newsletter.privacy": "Door je aan te melden accepteer je ons privacybeleid. Afmelden kan altijd.",
    "newsletter.success": "Aanmelding gelukt!",
    "newsletter.successText": "Je ontvangt vanaf nu onze beste aanbiedingen per e-mail.",

    // Search
    "search.placeholder": "Producten zoeken...",
    "search.prefix": "Zoek naar",

    // Mobile
    "mobile.oeffnung": "Ma\u2013Za 08:00\u201320:00",

    // ProductGrid
    "productGrid.empty": "Geen producten gevonden.",
  },
} as const;

export type TranslationKey = keyof typeof translations.de;

export function getTranslation(lang: Lang, key: string): string {
  const dict = translations[lang] as Record<string, string>;
  const fallback = translations.de as Record<string, string>;
  return dict?.[key] ?? fallback[key] ?? key;
}

export function useTranslation() {
  const [lang, setLang] = useState<Lang>("de");

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY) as Lang | null;
    if (stored && (stored === "de" || stored === "en" || stored === "nl")) {
      setLang(stored);
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      const stored = localStorage.getItem(LANG_KEY) as Lang | null;
      if (stored && (stored === "de" || stored === "en" || stored === "nl")) {
        setLang(stored);
      }
    };
    window.addEventListener("storage", handler);
    window.addEventListener(LANG_CHANGE_EVENT, handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(LANG_CHANGE_EVENT, handler);
    };
  }, []);

  const t = useCallback(
    (key: string): string => getTranslation(lang, key),
    [lang]
  );

  return { t, lang };
}
