import Link from "next/link";
import Image from "next/image";
import ArrowUpRight from "@/components/ArrowUpRight";
import { PARTY_SCENE } from "@/data/party-scene";
import styles from "./atmosphere.module.css";

export default function ServiceSection(): React.JSX.Element {
  return (
    <section
      className={styles.service}
      id="service"
      aria-labelledby="service-title"
    >
      <div className={styles.serviceFrame}>
        <div className={styles.servicePhoto}>
          <Image {...PARTY_SCENE} alt={PARTY_SCENE.alt} sizes="(max-width: 1312px) 100vw, 1312px" />
        </div>
        <div className={styles.serviceCopy}>
          <div>
            <p className={styles.eyebrow}>Dein Anlass. Unser Service.</p>
            <h2 id="service-title">Deine Feier.<br />Unsere Ausstattung.</h2>
          </div>
          <div className={styles.serviceActions}>
            <p>Zapfanlagen, Gläser, Garnituren und Kühlung.</p>
            <Link className={styles.servicePrimary} href="/vermietung" prefetch={false}>
              Leihsortiment ansehen <ArrowUpRight />
            </Link>
            <Link className={styles.serviceSecondary} href="/partyplaner" prefetch={false}>
              Getränkemengen planen <ArrowUpRight />
            </Link>
            <small>
              <Link className={styles.serviceAdvice} href="/kontakt" prefetch={false}>
                Verfügbarkeit und Konditionen klären wir persönlich.
              </Link>
              <span>Eine Anfrage ist noch keine bestätigte Reservierung.</span>
            </small>
          </div>
        </div>
      </div>
    </section>
  );
}
