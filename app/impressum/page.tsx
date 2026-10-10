import PageIntro from "@/components/editorial/PageIntro";
import styles from "@/components/editorial/transaction.module.css";
import type { Metadata } from "next";
import { MARKET } from "@/lib/cinematic/site";

export const metadata: Metadata = {
  title: "Impressum",
};

export default function ImpressumPage() {
  return (
    <>
      <PageIntro className={styles.legalIntro} title="Impressum" />
      <div className={styles.legal} data-service="legal">

      <div className="space-y-6">
        <section>
          <h2>Angaben gemäß § 5 DDG</h2>
          <p>
            Trinkgut Jammers<br />
            {MARKET.legalName}<br />
            Inhaber: Nikolaos Jammers<br />
            {MARKET.street}<br />
            {MARKET.postalCode} {MARKET.city}
          </p>
        </section>

        <section>
          <h2>Kontakt</h2>
          <p>
            Telefon: 02823-418707<br />
            E-Mail: jammers-goch@trinkgut.de
          </p>
        </section>

        <section>
          <h2>Handelsregister</h2>
          <p>Registergericht: Kleve<br />Registernummer: HRA 5711</p>
        </section>

        <section>
          <h2>Umsatzsteuer-ID</h2>
          <p>USt-IdNr. gemäß §27a UStG: DE369759343</p>
        </section>

        <section>
          <h2>Inhaltlich Verantwortlicher</h2>
          <p>Nikolaos Jammers (Anschrift wie oben)</p>
        </section>

      </div>
    </div></>
  );
}
