"use client";

import { useState } from "react";
import ProductGrid from "@/components/ProductGrid";
import { type Product } from "@/lib/utils";
import productsData from "@/data/products.json";
import Link from "next/link";

const products = productsData as Product[];

type FinderType = "bier" | "wein" | "wasser" | null;

type Question = {
  question: string;
  options: { label: string; value: string }[];
};

const finderData: Record<string, { title: string; icon: string; questions: Question[] }> = {
  bier: {
    title: "Bierfinder",
    icon: "🍺",
    questions: [
      {
        question: "Welchen Biertyp bevorzugst du?",
        options: [
          { label: "Pils – herb & frisch", value: "pils" },
          { label: "Weizen – fruchtig & süffig", value: "weizen" },
          { label: "Alt – malzig & vollmundig", value: "alt" },
          { label: "Export / Lager – mild & süffig", value: "lager" },
        ],
      },
      {
        question: "Wie viel darf's kosten?",
        options: [
          { label: "Günstig (unter 12€)", value: "cheap" },
          { label: "Mittel (12-16€)", value: "mid" },
          { label: "Premium (ab 16€)", value: "premium" },
        ],
      },
      {
        question: "Für welchen Anlass?",
        options: [
          { label: "Feierabendbier", value: "casual" },
          { label: "Party / Grillabend", value: "party" },
          { label: "Besonderer Anlass", value: "special" },
        ],
      },
    ],
  },
  wein: {
    title: "Weinfinder",
    icon: "🍷",
    questions: [
      {
        question: "Rot, Weiß oder Prickelnd?",
        options: [
          { label: "Rotwein", value: "rot" },
          { label: "Weißwein", value: "weiss" },
          { label: "Rosé", value: "rose" },
          { label: "Sekt / Prosecco", value: "sekt" },
        ],
      },
      {
        question: "Wie schmeckt dir Wein am besten?",
        options: [
          { label: "Trocken", value: "trocken" },
          { label: "Halbtrocken", value: "halbtrocken" },
          { label: "Lieblich / Süß", value: "lieblich" },
        ],
      },
      {
        question: "Wozu trinkst du den Wein?",
        options: [
          { label: "Zum Essen", value: "essen" },
          { label: "Gemütlicher Abend", value: "abend" },
          { label: "Als Geschenk", value: "geschenk" },
          { label: "Party / Feier", value: "party" },
        ],
      },
    ],
  },
  wasser: {
    title: "Wasserfinder",
    icon: "💧",
    questions: [
      {
        question: "Mit oder ohne Kohlensäure?",
        options: [
          { label: "Sprudel (Classic)", value: "sprudel" },
          { label: "Medium", value: "medium" },
          { label: "Still / Naturell", value: "still" },
        ],
      },
      {
        question: "Glas- oder PET-Flasche?",
        options: [
          { label: "Glasflasche (Mehrweg)", value: "glas" },
          { label: "PET-Flasche (leichter)", value: "pet" },
          { label: "Egal", value: "egal" },
        ],
      },
      {
        question: "Wofür brauchst du das Wasser?",
        options: [
          { label: "Täglicher Bedarf", value: "daily" },
          { label: "Sport & Fitness", value: "sport" },
          { label: "Party / Event", value: "party" },
          { label: "Büro / Arbeit", value: "buero" },
        ],
      },
    ],
  },
};

export default function FinderPage() {
  const [activeFinder, setActiveFinder] = useState<FinderType>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSelect = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    const finder = finderData[activeFinder!];
    if (step + 1 >= finder.questions.length) {
      setShowResults(true);
    } else {
      setStep(step + 1);
    }
  };

  const getResults = (): Product[] => {
    if (!activeFinder) return [];

    // Step 1: Filter by category
    let filtered = products.filter((p) => {
      if (activeFinder === "bier") return p.categorySlug === "bier";
      if (activeFinder === "wein") return p.categorySlug === "wein" || p.categorySlug === "sekt";
      if (activeFinder === "wasser") return p.categorySlug === "alkoholfrei";
      return false;
    });

    // Step 2: Apply answer-based filtering
    if (activeFinder === "bier") {
      // Q1: Biertyp (pils, weizen, alt, lager)
      const biertyp = answers[0];
      if (biertyp) {
        const keywords: Record<string, string[]> = {
          pils: ["pils", "pilsener", "pilsner"],
          weizen: ["weizen", "weiss", "weissbier", "hefe"],
          alt: ["alt"],
          lager: ["export", "lager", "hell"],
        };
        const terms = keywords[biertyp] || [];
        if (terms.length > 0) {
          const matched = filtered.filter((p) => {
            const text = `${p.name} ${p.description}`.toLowerCase();
            return terms.some((t) => text.includes(t));
          });
          if (matched.length > 0) filtered = matched;
        }
      }
      // Q2: Preis (cheap, mid, premium)
      const preis = answers[1];
      if (preis) {
        const priceFiltered = filtered.filter((p) => {
          if (preis === "cheap") return p.price < 12;
          if (preis === "mid") return p.price >= 12 && p.price <= 16;
          if (preis === "premium") return p.price > 16;
          return true;
        });
        if (priceFiltered.length > 0) filtered = priceFiltered;
      }
    }

    if (activeFinder === "wein") {
      // Q1: Weinart (rot, weiss, rose, sekt)
      const weinart = answers[0];
      if (weinart) {
        if (weinart === "sekt") {
          const matched = filtered.filter((p) => p.categorySlug === "sekt" || ["sekt", "prosecco", "champagner", "cremant"].some((t) => `${p.name} ${p.description}`.toLowerCase().includes(t)));
          if (matched.length > 0) filtered = matched;
        } else {
          const keywords: Record<string, string[]> = {
            rot: ["rotwein", "rot", "cabernet", "merlot", "pinot noir", "tempranillo", "rioja", "chianti"],
            weiss: ["weisswein", "weißwein", "weiss", "riesling", "chardonnay", "sauvignon", "grauburgunder", "pinot grigio"],
            rose: ["rosé", "rose"],
          };
          const terms = keywords[weinart] || [];
          if (terms.length > 0) {
            const matched = filtered.filter((p) => {
              const text = `${p.name} ${p.description}`.toLowerCase();
              return terms.some((t) => text.includes(t));
            });
            if (matched.length > 0) filtered = matched;
          }
        }
      }
      // Q2: Geschmack (trocken, halbtrocken, lieblich)
      const geschmack = answers[1];
      if (geschmack) {
        const terms: Record<string, string[]> = {
          trocken: ["trocken", "dry", "brut", "sec"],
          halbtrocken: ["halbtrocken", "feinherb", "demi-sec"],
          lieblich: ["lieblich", "süß", "sweet", "dolce"],
        };
        const kw = terms[geschmack] || [];
        if (kw.length > 0) {
          const matched = filtered.filter((p) => {
            const text = `${p.name} ${p.description}`.toLowerCase();
            return kw.some((t) => text.includes(t));
          });
          if (matched.length > 0) filtered = matched;
        }
      }
    }

    if (activeFinder === "wasser") {
      // Q1: Kohlensäure (sprudel, medium, still)
      const kohlensaeure = answers[0];
      if (kohlensaeure) {
        const keywords: Record<string, string[]> = {
          sprudel: ["classic", "sprudel", "spritzig"],
          medium: ["medium"],
          still: ["still", "naturell"],
        };
        const terms = keywords[kohlensaeure] || [];
        if (terms.length > 0) {
          const matched = filtered.filter((p) => {
            const text = `${p.name} ${p.description}`.toLowerCase();
            return terms.some((t) => text.includes(t));
          });
          if (matched.length > 0) filtered = matched;
        }
      }
      // Q2: Flaschentyp (glas, pet, egal)
      const flasche = answers[1];
      if (flasche && flasche !== "egal") {
        const keywords: Record<string, string[]> = {
          glas: ["glas", "mehrweg"],
          pet: ["pet", "einweg"],
        };
        const terms = keywords[flasche] || [];
        if (terms.length > 0) {
          const matched = filtered.filter((p) => {
            const text = `${p.name} ${p.description}`.toLowerCase();
            return terms.some((t) => text.includes(t));
          });
          if (matched.length > 0) filtered = matched;
        }
      }
    }

    return filtered;
  };

  const reset = () => {
    setActiveFinder(null);
    setStep(0);
    setAnswers([]);
    setShowResults(false);
  };

  // Finder Selection
  if (!activeFinder) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-10">
          <span className="text-5xl mb-4 block">🔍</span>
          <h1 className="text-3xl font-bold text-secondary mb-2">Getränke-Finder</h1>
          <p className="text-muted max-w-lg mx-auto">
            Du weißt nicht genau was du suchst? Kein Problem! Beantworte ein paar Fragen und wir finden das perfekte Getränk für dich.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {(Object.entries(finderData) as [string, typeof finderData.bier][]).map(([key, finder]) => (
            <button
              key={key}
              onClick={() => setActiveFinder(key as FinderType)}
              className="group p-8 bg-white border-2 border-border rounded-xl hover:border-primary hover:shadow-lg transition-all text-center"
            >
              <span className="text-6xl block mb-4 group-hover:scale-110 transition-transform">{finder.icon}</span>
              <h2 className="text-xl font-bold text-secondary group-hover:text-primary transition-colors">{finder.title}</h2>
              <p className="text-sm text-muted mt-2">{finder.questions.length} Fragen</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const finder = finderData[activeFinder];

  // Results
  if (showResults) {
    const results = getResults();
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-10">
          <span className="text-5xl mb-4 block">🎯</span>
          <h2 className="text-3xl font-bold text-secondary mb-2">Unsere Empfehlungen für dich!</h2>
          <p className="text-muted">Basierend auf deinen Antworten haben wir folgende Produkte ausgewählt:</p>
        </div>

        <ProductGrid products={results} />

        <div className="text-center mt-8 flex gap-4 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 border border-border text-muted hover:border-primary hover:text-primary rounded-lg transition-colors font-medium"
          >
            Nochmal versuchen
          </button>
          <Link
            href="/produkte"
            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
          >
            Alle Produkte ansehen
          </Link>
        </div>
      </div>
    );
  }

  // Quiz
  const currentQuestion = finder.questions[step];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={reset} className="text-sm text-muted hover:text-primary mb-6 flex items-center gap-1">
        ← Zurück zur Auswahl
      </button>

      <div className="text-center mb-8">
        <span className="text-4xl mb-3 block">{finder.icon}</span>
        <h1 className="text-2xl font-bold text-secondary">{finder.title}</h1>
        <div className="flex gap-1 justify-center mt-4">
          {finder.questions.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-12 rounded-full ${i <= step ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>
      </div>

      <div className="bg-white border border-border rounded-xl p-8">
        <h2 className="text-xl font-bold text-secondary mb-6 text-center">
          {currentQuestion.question}
        </h2>
        <div className="space-y-3">
          {currentQuestion.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className="w-full p-4 text-left border-2 border-border rounded-lg hover:border-primary hover:bg-red-50 transition-all font-medium text-secondary"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
