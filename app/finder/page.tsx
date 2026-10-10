"use client";

import { useEffect, useRef, useState } from "react";
import ProductGrid from "@/components/ProductGrid";
import { filterFinderProducts, type FinderType } from "@/lib/finder-products";
import { assortmentProducts as products } from "@/lib/catalog";
import Link from "next/link";
import PageIntro from "@/components/editorial/PageIntro";
import styles from "@/components/editorial/tools.module.css";
import editorial from "@/components/editorial/editorial.module.css";

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
      <div ref={node => { stateHeading.current = node?.querySelector("h1") ?? null; if (stateHeading.current) stateHeading.current.tabIndex = -1; }}>
        <PageIntro eyebrow="Dein Geschmack" title="Getränke-Finder" description="Beantworte ein paar Fragen für passende Sortimentsideen. Fehlen uns Angaben zu deiner Auswahl, berät dich unser Team gern persönlich." breadcrumbs={[{ label: "Start", href: "/" }, { label: "Getränke-Finder" }]} />
      </div>
      <div data-tool="finder" className={styles.body}>
        <div className={styles.choices}>
          {(Object.entries(finderData) as [string, typeof finderData.bier][]).map(([key, finder]) => (
            <button
              key={key}
              onClick={() => setActiveFinder(key as FinderType)}
              className={styles.choice}
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
      <>
        <div ref={node => { stateHeading.current = node?.querySelector("h1") ?? null; if (stateHeading.current) stateHeading.current.tabIndex = -1; }}>
          <PageIntro eyebrow={finder.title} title="Unsere Empfehlungen für dich!" description="Unverbindliche Sortimentsideen – aktuelle Preise und Verfügbarkeit bestätigen wir persönlich." />
        </div>
        <div data-tool="finder-results" className={styles.body}>
        {results.length ? <ProductGrid products={results} headingLevel={2} /> : <p role="status" className={editorial.emptyState}>Für diese Auswahl ist kein passendes Sortimentsbeispiel hinterlegt. Frag unser Team nach einer Empfehlung.</p>}

        <div className={styles.actions}>
          <button
            onClick={reset}
            className={editorial.secondaryLink}
          >
            Nochmal versuchen
          </button>
          <Link
            href="/produkte"
            className={editorial.primaryLink}
          >
            Alle Produkte ansehen
          </Link>
        </div>
      </div></>
    );
  }

  // Quiz
  const currentQuestion = finder.questions[step];

  return (
    <>
      <PageIntro eyebrow={`Frage ${step + 1} von ${finder.questions.length}`} title={finder.title} description="Wähle die Antwort, die am besten zu dir passt.">
        <button onClick={reset} className={editorial.secondaryLink}>Zurück zur Auswahl</button>
      </PageIntro>
      <div data-tool="finder-step" className={`${styles.body} ${styles.narrow}`}>
        <div className={styles.steps} aria-hidden="true">{finder.questions.map((_, i) => <span key={i} data-active={i <= step} />)}</div>
        <section className={styles.panel} aria-label="Deine Auswahl">
        <h2 ref={stateHeading} tabIndex={-1} className="text-xl font-bold text-secondary mb-6 text-center">
          {currentQuestion.question}
        </h2>
        <div className="space-y-3">
          {currentQuestion.options.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={styles.option}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>
    </div></>
  );
}
