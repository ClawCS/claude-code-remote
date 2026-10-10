import Link from "next/link";
import Image from "next/image";
import { eigenmarken } from "@/data/eigenmarken";
import styles from "./editorial/collection.module.css";
import editorial from "./editorial/editorial.module.css";

export default function EigenmarkenShowcase() {
  return <section className={`${styles.body} ${styles.section}`} aria-labelledby="brand-showcase-title" data-collection="brand-showcase">
    <p className={styles.meta}>Exklusiv bei uns</p>
    <h2 id="brand-showcase-title">Unsere Eigenmarken</h2>
    <p>Sechs Liköre — nur bei Trinkgut Jammers erhältlich</p>
    <div className={styles.showcase}>
      {eigenmarken.map(likoer => <Link key={likoer.slug} href={`/eigenmarke#${likoer.slug}`}>
        <Image src={likoer.image} alt={`${likoer.name} — ${likoer.flavor}`} width={707} height={1000} sizes="(max-width:752px) 45vw, 30vw" unoptimized />
        <span>{likoer.name}</span>
      </Link>)}
    </div>
    <Link href="/eigenmarke" className={editorial.secondaryLink}>Alle Eigenmarken entdecken</Link>
  </section>;
}
