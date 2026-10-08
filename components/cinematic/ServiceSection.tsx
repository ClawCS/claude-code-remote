import Link from "next/link";

import {
  RENTAL_HIGHLIGHTS,
  RENTAL_SOURCES,
  SERVICE_ITEMS,
} from "@/data/cinematic-editorial";

import styles from "./editorial.module.css";

export default function ServiceSection(): React.JSX.Element {
  return (
    <section
      className={styles.section}
      id="service"
      aria-labelledby="service-title"
    >
      <div className={styles.sectionHeading}>
        <p className={styles.eyebrow}>
          Feiern beginnt mit einem guten Plan.
        </p>
        <h2 id="service-title">Deine Party. Unser Service.</h2>
      </div>
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
            <dd className={styles.rentalReference}>{rental.price} · Bestand laut Liste: {rental.stock}</dd>
          </div>
        ))}
      </dl>
      <p className={styles.rentalNote}>Bestandsstand {RENTAL_SOURCES.inventory.asOf}. Referenzpreise je 3 Werktage. Verfügbarkeit und Konditionen klären wir persönlich.</p>
    </section>
  );
}
