import type { Metadata } from "next";
import { MARKET } from "@/lib/cinematic/site";

export const metadata: Metadata = {
  title: "Impressum",
};

export default function ImpressumPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-secondary mb-8">Impressum</h1>

      <div className="space-y-6 text-sm text-muted leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-secondary mb-1">Angaben gemäß § 5 DDG</h2>
          <p>
            Trinkgut Jammers<br />
            {MARKET.legalName}<br />
            Inhaber: Nikolaos Jammers<br />
            {MARKET.street}<br />
            {MARKET.postalCode} {MARKET.city}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary mb-1">Kontakt</h2>
          <p>
            Telefon: 02823-418707<br />
            E-Mail: jammers-goch@trinkgut.de
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary mb-1">Handelsregister</h2>
          <p>Registergericht: Kleve<br />Registernummer: HRA 5711</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary mb-1">Umsatzsteuer-ID</h2>
          <p>USt-IdNr. gemäß §27a UStG: DE369759343</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary mb-1">Inhaltlich Verantwortlicher</h2>
          <p>Nikolaos Jammers (Anschrift wie oben)</p>
        </section>

      </div>
    </div>
  );
}
