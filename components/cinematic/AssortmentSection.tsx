import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import ArrowUpRight from "@/components/ArrowUpRight";
import { USER_MARKET_PHOTOS } from "@/data/user-market-photos";
import { GOOGLE_MARKET_PHOTOS } from "@/data/google-market-photos";
import styles from "./warm.module.css";
const categories = [
  { slug: "bier", title: "Bier & Fassbier", href: "/kategorie/bier", photo: USER_MARKET_PHOTOS.bueble, position: "50% 62%" },
  { slug: "alkoholfrei", title: "Alkoholfrei", href: "/kategorie/alkoholfrei", photo: USER_MARKET_PHOTOS.spezi, position: "48% 50%" },
  { slug: "wein", title: "Wein & Sekt", href: "/kategorie/wein", photo: USER_MARKET_PHOTOS.wineShelf, position: "46% 48%" },
  { slug: "spirituosen", title: "Spirituosen", href: "/kategorie/spirituosen", photo: GOOGLE_MARKET_PHOTOS.baileys, position: "38% 44%" },
];
export default function AssortmentSection() {
  return <section id="sortiment" className={styles.assortment} aria-labelledby="sortiment-title">
    <div className={styles.sectionHeading}>
      <div><p className={styles.eyebrow}>Was darf es sein?</p><h2 id="sortiment-title">Für jeden Geschmack.</h2></div>
      <Link href="/produkte" prefetch={false} className={styles.textLink}>Das Sortiment entdecken <ArrowUpRight /></Link>
    </div>
    <nav className={styles.categories} aria-label="Getränke entdecken">
      {categories.map(item => <Link key={item.href} href={item.href} prefetch={false} className={styles.categoryCard} data-category={item.slug} style={{ "--category-photo-position": item.position } as CSSProperties}>
        <span className={styles.categoryPhoto}><Image src={item.photo.src} width={item.photo.width} height={item.photo.height} alt={item.photo.alt} sizes="(max-width: 767px) 40vw, 22vw" /></span>
        <span className={styles.categoryMeta}><span className={styles.categoryTitle}>{item.title}</span><span className={styles.categoryArrow}><ArrowUpRight /></span></span>
      </Link>)}
    </nav>
    <p className={styles.rangeNote}>Einblicke aus unserem Markt. Fotopreise sind keine aktuelle Preis- oder Bestandszusage. Aktuelle Preise und Verfügbarkeit bestätigen wir persönlich.</p>
  </section>;
}
