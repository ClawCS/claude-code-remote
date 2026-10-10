import Link from "next/link";
import styles from "./warm.module.css";
import MarketDiscoveries from "./MarketDiscoveries";
import AcademyEntry from "@/components/AcademyEntry";
const categories = [
  { title: "Bier & Fassbier", href: "/kategorie/bier" },
  { title: "Alkoholfrei", href: "/kategorie/alkoholfrei" },
  { title: "Wein & Sekt", href: "/kategorie/wein" },
  { title: "Spirituosen", href: "/kategorie/spirituosen" },
];
export default function AssortmentSection() {
  return <section id="sortiment" className={styles.assortment} aria-labelledby="sortiment-title">
    <div className={styles.sectionHeading}>
      <div><p className={styles.eyebrow}>Was darf es sein?</p><h2 id="sortiment-title">Für jeden Geschmack.</h2></div>
      <Link href="/produkte" prefetch={false} className={styles.textLink}>Das Sortiment entdecken ↗</Link>
    </div>
    <nav className={styles.categories} aria-label="Getränke entdecken">
      {categories.map(item => <Link key={item.href} href={item.href} prefetch={false}><span>{item.title}</span><span aria-hidden="true">↗</span></Link>)}
    </nav>
    <p className={styles.rangeNote}>Eine Auswahl aus unserem Markt. Aktuelle Preise und Verfügbarkeit bestätigen wir persönlich.</p>
    <MarketDiscoveries />
    <div className={styles.knowledge}>
      <AcademyEntry />
      <Link href="/cocktails" prefetch={false} className={styles.textLink}>Neue Lieblingscocktails entdecken ↗</Link>
    </div>
  </section>;
}
