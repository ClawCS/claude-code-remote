import Link from "next/link";
import Image from "next/image";
import { USER_MARKET_PHOTOS } from "@/data/user-market-photos";

import {
  RENTAL_HIGHLIGHTS,
  SERVICE_ITEMS,
} from "@/data/cinematic-editorial";

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
        </div>
      </div>
      <div className={styles.serviceDetails}>
      <p className={styles.serviceNote}>Wir beraten dich persönlich – vom ersten Plan bis zur passenden Ausstattung.</p>
      <ol className={styles.serviceWall} data-service-items>
        {SERVICE_ITEMS.map((service) => (
          <li className={styles.serviceRow} key={service.number}>
            <div className={styles.serviceCopy}>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
            </div>
            <Link href={service.href} prefetch={false}>
              Mehr erfahren
            </Link>
          </li>
        ))}
      </ol>
      <dl className={styles.rentalStrip} data-rental-highlights>
        {RENTAL_HIGHLIGHTS.map((rental) => (
          <div key={rental.name}>
            <dt>
              {rental.name}
            </dt>
            <dd><Link href="/vermietung" prefetch={false}>Termin &amp; Verfügbarkeit anfragen ↗</Link></dd>
            <dd className={styles.rentalReference}>{rental.price}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.rentalNote}>Referenzpreise je 3 Werktage. Verfügbarkeit und Konditionen klären wir persönlich. Die Wochenangebote findest du im datierten Handzettel.</p>
      </div>
    </section>
  );
}
