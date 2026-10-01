"use client";

import { useEffect, useRef, useState } from "react";
import ProductGrid from "@/components/ProductGrid";
import { filterFinderProducts, type FinderType } from "@/lib/finder-products";
import { assortmentProducts as products } from "@/lib/catalog";
import Link from "next/link";

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
        question: "Wie möchtest du dein Bier genießen?",
        options: [
          { label: "Alkoholfrei", value: "alcohol-free" },
          { label: "Klassisch", value: "classic" },
          { label: "Keine Präferenz", value: "any" },
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
  const stateHeading = useRef<HTMLHeadingElement>(null);
  const hasInteracted = useRef(false);

  useEffect(() => {
    if (!activeFinder && !hasInteracted.current) return;
    hasInteracted.current = true;
    stateHeading.current?.focus();
  }, [activeFinder, step, showResults]);

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

  const getResults = () => filterFinderProducts(products, activeFinder, answers);

  const reset = () => {
    setActiveFinder(null);
    setStep(0);
    setAnswers([]);
    setShowResults(false);
  };

  // Finder Selection
  if (!activeFinder) {
    return (
      <>
      <div className="page-hero-banner py-16 md:py-24">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <nav className="text-sm text-white/60 mb-4"><Link href="/" className="hover:text-white">Home</Link> <span className="mx-1">/</span> <span className="text-white">Getränke-Finder</span></nav>
          <h1 ref={stateHeading} tabIndex={-1} className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-3">Getränke-Finder</h1>
          <p className="text-white/80 max-w-xl mx-auto text-lg">
            Beantworte ein paar Fragen für passende Sortimentsideen. Fehlen uns Angaben zu deiner Auswahl, berät dich unser Team gern persönlich.
          </p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        <div className="grid sm:grid-cols-3 gap-6">
          {(Object.entries(finderData) as [string, typeof finderData.bier][]).map(([key, finder]) => (
            <button
              key={key}
              onClick={() => setActiveFinder(key as FinderType)}
              className="group p-8 bg-white border-2 border-border rounded-xl hover:border-primary hover:shadow-lg transition-all text-center"
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-primary block mb-4">Persönlicher Geschmack</span>
              <h2 className="text-xl font-bold text-secondary group-hover:text-primary transition-colors">{finder.title}</h2>
              <p className="text-sm text-muted mt-2">{finder.questions.length} Fragen</p>
            </button>
          ))}
        </div>
      </div>
      </>
    );
  }

  const finder = finderData[activeFinder];

  // Results
  if (showResults) {
    const results = getResults();
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-10">
          <h1 ref={stateHeading} tabIndex={-1} className="text-3xl font-bold text-secondary mb-2">Unsere Empfehlungen für dich!</h1>
          <p className="text-muted">Unverbindliche Sortimentsideen – aktuelle Preise und Verfügbarkeit bestätigen wir persönlich.</p>
        </div>

        {results.length ? <ProductGrid products={results} headingLevel={2} /> : <p className="text-center text-muted">Für diese Auswahl ist kein passendes Sortimentsbeispiel hinterlegt. Frag unser Team nach einer Empfehlung.</p>}

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
        <h2 ref={stateHeading} tabIndex={-1} className="text-xl font-bold text-secondary mb-6 text-center">
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
