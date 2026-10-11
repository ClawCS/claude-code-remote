import Link from "next/link";
import type { ReactNode } from "react";
import { MARKET } from "@/lib/cinematic/site";
import styles from "./LocalAnswers.module.css";

type Answer = { question: string; answer: ReactNode };
type Topic = "contact" | "rental" | "brands" | "nl";
const address = `${MARKET.street}, ${MARKET.postalCode} ${MARKET.city}`;
const answers: Record<Topic, readonly Answer[]> = {
  contact: [
    { question: "Wo ist Trinkgut Jammers?", answer: <>Du findest uns in der {address}. <a href={MARKET.phoneHref}>Ruf uns an</a>, wenn du Fragen zu deinem Besuch hast.</> },
    { question: "Wann ist der Markt geöffnet?", answer: <>{MARKET.openingHours}. {MARKET.openingHoursNote}.</> },
  ],
  rental: [
    { question: "Ist meine Mietauswahl schon reserviert?", answer: <>Nein. Termin, Verfügbarkeit und verbindliche Absprachen bestätigen wir persönlich. Eine Auswahl ist noch keine Reservierung.</> },
    { question: "Für welchen Zeitraum gilt der Mietpreis?", answer: <>Je Stück und angefangenem Block von drei Werktagen, inklusive MwSt. Die genaue Berechnung steht oben bei deinem Zeitraum.</> },
    { question: "Wie bekomme ich die Leihartikel?", answer: <>Nur Abholung im Markt. Deinen Abholtermin stimmen wir persönlich ab. <Link href="/agb">Weitere Hinweise zu Anfragen</Link>.</> },
  ],
  brands: [
    { question: "Wo kann ich die Jammers-Eigenmarken bekommen?", answer: <>Bei Trinkgut Jammers in der {address}. Die sechs Liköre und ihre Angaben findest du oben auf dieser Seite.</> },
    { question: "Ist mein Wunschlikör verfügbar?", answer: <>Frag unser Team vor deinem Besuch nach der aktuellen Verfügbarkeit. <Link href="/kontakt">Kontakt zum Markt</Link>.</> },
  ],
  nl: [
    { question: "Waar vind ik Trinkgut Jammers?", answer: <>{address}, Duitsland. Maandag t/m zaterdag 08:00–20:00 uur; gesloten op zon- en feestdagen in Noordrijn-Westfalen.</> },
    { question: "Wanneer gelden de aanbiedingen?", answer: <>Alleen binnen de geldigheidsperiode en volgens de voorwaarden op de originele folder. Let ook op verpakking en statiegeld. <a href="#handzettel">Bekijk de originele folders</a>.</> },
    { question: "Hoe werkt de verhuur?", answer: <>We bevestigen datum en beschikbaarheid persoonlijk; een aanvraag is nog geen reservering. De huurprijs geldt per stuk en per begonnen blok van drie werkdagen, inclusief btw. Voor de huur tellen maandag t/m zaterdag, behalve feestdagen in Noordrijn-Westfalen; afhaal- en retourdag tellen mee. Alleen afhalen in de winkel. <Link href="/vermietung" prefetch={false}>Verhuur en prijsberekening (Duits)</Link>.</> },
  ],
};

/** Plain visible answers; no FAQ rich-result claim or duplicate legal detail. */
export default function LocalAnswers({ topic }: { topic: Topic }) {
  const headingId = `local-answers-${topic}`;
  return (
    <section data-local-answers={topic} aria-labelledby={headingId} className={styles.section}>
      <h2 id={headingId}>{topic === "nl" ? "Kort antwoord op je vragen." : "Kurz beantwortet."}</h2>
      <dl className={styles.answers}>
        {answers[topic].map(({ question, answer }) => <div key={question}><dt>{question}</dt><dd>{answer}</dd></div>)}
      </dl>
    </section>
  );
}
