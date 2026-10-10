import Link from "next/link";
import PageIntro from "@/components/editorial/PageIntro";
import styles from "@/components/editorial/learning.module.css";
import editorial from "@/components/editorial/editorial.module.css";
import type { Metadata } from "next";
import { academyCertificates as zertifikatskurse } from "@/data/academy-certificates";

export const metadata: Metadata = {
  title: "Professionelle Zertifikatskurse | Getränkeakademie",
  description: `${zertifikatskurse.length} Weiterbildungshinweise zu IHK, WSET und Sommelier-Qualifikationen. Termine, Preise und Anmeldung bitte beim jeweiligen Anbieter prüfen.`,
  alternates: { canonical: "/akademie/zertifikate" },
};

const kategorien = [
  { key: "wein" as const, label: "Wein", icon: "\uD83C\uDF77", color: "from-purple-600 to-purple-800" },
  { key: "bier" as const, label: "Bier", icon: "\uD83C\uDF7A", color: "from-amber-500 to-amber-700" },
  { key: "spirituosen" as const, label: "Spirituosen", icon: "\uD83E\uDD43", color: "from-amber-700 to-amber-900" },
  { key: "allgemein" as const, label: "Allgemein / Handel", icon: "\uD83C\uDF93", color: "from-gray-600 to-gray-800" },
];

export default function ZertifikatePage() {
  return (
    <>
      <PageIntro eyebrow="Weiterführendes Wissen" title="Professionelle Zertifikatskurse" description={`${zertifikatskurse.length} Weiterbildungshinweise — von der IHK über Doemens bis zum WSET. Informationen zu Qualifikationen und Kursen; aktuelle Termine, Preise und Anmeldung bitte beim jeweiligen Anbieter prüfen.`} breadcrumbs={[{ label: "Start", href: "/" }, { label: "Akademie", href: "/akademie" }, { label: "Zertifikatskurse" }]} />
      <div data-learning="certificates" className={styles.body}>
      {/* Kategorien */}
      {kategorien.map((kat) => {
        const kurse = zertifikatskurse.filter((k) => k.kategorie === kat.key);
        return (
          <section key={kat.key} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-secondary">{kat.label}</h2>
              <span className="text-sm text-muted">({kurse.length} Kurse)</span>
            </div>

            <div className="grid gap-4">
              {kurse.map((kurs) => (
                <div
                  key={kurs.titel}
                  className={styles.certificate}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-secondary text-lg">{kurs.titel}</h3>
                        {kurs.highlight && (
                          <span className="text-xs text-secondary border border-border px-2 py-1 font-semibold">Top-Empfehlung</span>
                        )}
                      </div>
                      <p className="text-muted text-sm mb-3">{kurs.beschreibung}</p>
                      <div className={styles.certificateMeta}>
                        <span >Abschluss: {kurs.abschluss}</span>
                        <span >Anbieter: {kurs.anbieter}</span>
                        <span >Dauer: {kurs.dauer}</span>
                        <span >Kosten: {kurs.kosten}</span>
                      </div>
                    </div>
                    <a
                      href={kurs.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={editorial.secondaryLink}
                    >
                      Informationen beim Anbieter &rarr;
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* Karrierepfad */}
      <section className={styles.related}>
        <h2 className="text-2xl font-bold text-secondary mb-6 text-center">Empfohlene Karrierepfade</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <h3 className="font-bold text-secondary mb-2">Wein-Karriere</h3>
            <div className="text-sm text-muted space-y-1">
              <p>1. WSET Level 1</p>
              <p className="text-primary">&darr;</p>
              <p>2. WSET Level 2</p>
              <p className="text-primary">&darr;</p>
              <p>3. Weinberater (IHK)</p>
              <p className="text-primary">&darr;</p>
              <p>4. WSET Level 3</p>
              <p className="text-primary">&darr;</p>
              <p className="font-bold text-secondary">5. Gepr. Sommelier (IHK)</p>
            </div>
          </div>
          <div className="text-center">
            <h3 className="font-bold text-secondary mb-2">Bier-Karriere</h3>
            <div className="text-sm text-muted space-y-1">
              <p>1. Certified Beer Server</p>
              <p className="text-primary">&darr;</p>
              <p>2. Bier-Botschafter (IHK)</p>
              <p className="text-primary">&darr;</p>
              <p>3. Biersommelier (Doemens)</p>
              <p className="text-primary">&darr;</p>
              <p className="font-bold text-secondary">4. Certified Cicerone</p>
            </div>
          </div>
          <div className="text-center">
            <h3 className="font-bold text-secondary mb-2">Spirituosen-Karriere</h3>
            <div className="text-sm text-muted space-y-1">
              <p>1. WSET Level 2 Spirits</p>
              <p className="text-primary">&darr;</p>
              <p>2. Barkeeper (IHK)</p>
              <p className="text-primary">&darr;</p>
              <p>3. Destillat-Sommelier (Doemens)</p>
              <p className="text-primary">&darr;</p>
              <p className="font-bold text-secondary">4. WSET Level 3 Spirits</p>
            </div>
          </div>
        </div>
      </section>

      {/* Zurück zur Akademie */}
      <div className="text-center">
        <Link href="/akademie" className={editorial.primaryLink}>
          Zurück zur Akademie
        </Link>
      </div>
    </div></>
  );
}
