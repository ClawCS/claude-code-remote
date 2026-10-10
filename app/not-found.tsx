import Link from "next/link";
import type { Metadata } from "next";
import PageIntro from "@/components/editorial/PageIntro";
import editorial from "@/components/editorial/editorial.module.css";
import styles from "@/components/editorial/transaction.module.css";
export const metadata: Metadata = { title: "Seite nicht gefunden — 404", description: "Die gesuchte Seite existiert nicht. Zurück zur Startseite oder Sortiment durchsuchen." };
export default function NotFound() {
  return <><PageIntro eyebrow="Fehler 404" title="Seite nicht gefunden" description="Die gesuchte Seite existiert nicht oder wurde verschoben. Vielleicht ein Tippfehler in der URL?" />
    <div className={styles.body} data-service="recovery"><p>Was möchtest du als Nächstes tun?</p>
      <nav aria-label="Weiter nach einer nicht gefundenen Seite" className={styles.recoveryLinks}>
        <Link href="/" className={editorial.primaryLink}>Zur Startseite</Link>
        <Link href="/produkte" className={editorial.secondaryLink}>Sortiment</Link>
        <Link href="/handzettel" className={editorial.secondaryLink}>Handzettel</Link>
        <Link href="/kontakt" className={editorial.secondaryLink}>Kontakt</Link>
      </nav>
      <p>Oder ruf uns direkt an: <a href="tel:02823418707" className={styles.textLink}>02823-418707</a></p>
    </div></>;
}
