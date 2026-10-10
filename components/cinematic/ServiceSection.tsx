import Link from "next/link";
import Image from "next/image";
import { USER_MARKET_PHOTOS } from "@/data/user-market-photos";

import styles from "./editorial.module.css";

export default function ServiceSection(): React.JSX.Element {
  return (
    <section
      className={styles.serviceSection}
      id="service"
      aria-labelledby="service-title"
    >
      <div className={styles.serviceFeature}>
        <div className={styles.servicePhoto}><Image {...USER_MARKET_PHOTOS.schneiderWeisse} alt={USER_MARKET_PHOTOS.schneiderWeisse.alt} sizes="(max-width: 47.999rem) 100vw, 55vw" /></div>
        <div className={styles.serviceIntro}>
          <p className={styles.eyebrow}>Dein Anlass. Unser Service.</p>
          <h2 id="service-title">Du hast<br />etwas vor.<br />Wir sind dabei.</h2>
          <p>Getränke, Gläser, Garnituren und Kühlung: Plane deine Mengen und frag die passenden Leihartikel für deine Feier an.</p>
          <Link href="/vermietung" prefetch={false}>Partyservice entdecken ↗</Link>
          <div className={styles.serviceLinks}>
            <Link href="/partyplaner" prefetch={false}>Getränkemengen planen ↗</Link>
            <Link href="/kontakt" prefetch={false}>Persönlich beraten lassen ↗</Link>
          </div>
          <p className={styles.serviceNote}>Wir beraten dich persönlich – vom ersten Plan bis zur passenden Ausstattung.</p>
          <p className={styles.serviceFineprint}>Eine Anfrage ist noch keine bestätigte Reservierung. Verfügbarkeit und Konditionen klären wir persönlich. Die Wochenangebote findest du im datierten Handzettel.</p>
        </div>
      </div>
    </section>
  );
}
