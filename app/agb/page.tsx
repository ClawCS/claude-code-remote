import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AGB — Allgemeine Geschäftsbedingungen | Trinkgut Jammers",
  description: "Allgemeine Geschäftsbedingungen für Trinkgut Jammers Goch. Bestellprozess, Lieferung, Widerrufsrecht, Zahlung und Haftung.",
};

export default function AGBPage() {
  return (
    <>
      <div className="page-hero-banner py-12 md:py-16">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <nav className="text-sm text-white/60 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-1">/</span>
            <span className="text-white">AGB</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg">Allgemeine Geschäftsbedingungen</h1>
          <p className="text-white/70 mt-2">Stand: Mai 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 prose prose-sm">
        <section className="mb-8">
          <h2 className="text-xl font-bold text-secondary mb-3">§ 1 Geltungsbereich</h2>
          <p className="text-muted leading-relaxed">
            Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Bestellungen und Reservierungen, die über die Website
            <strong> trinkgut-jammers.de</strong> beim Anbieter abgegeben werden:
          </p>
          <p className="text-muted mt-3">
            <strong>Trinkgut Jammers Goch e.K.</strong><br />
            Inhaber: Nikolaos Jammers<br />
            Jurgenstr. 20, 47574 Goch<br />
            Tel.: 02823-418707<br />
            E-Mail: jammers-goch@trinkgut.de<br />
            HRA 5711 (Amtsgericht Kleve) · USt-ID DE369759343
          </p>
          <p className="text-muted mt-3">
            Abweichende Geschäftsbedingungen des Kunden werden nicht anerkannt, es sei denn, der Anbieter stimmt ihrer Geltung ausdrücklich schriftlich zu.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-secondary mb-3">§ 2 Vertragsschluss</h2>
          <p className="text-muted leading-relaxed">
            Die Darstellung von Produkten und Angeboten auf unserer Website stellt kein rechtlich bindendes Angebot, sondern eine
            unverbindliche Aufforderung zur Bestellung dar. Mit dem Absenden einer Bestellung über das Bestellformular oder per
            E-Mail gibt der Kunde eine verbindliche Bestellung ab. Der Vertrag kommt mit unserer Auftragsbestätigung per E-Mail
            oder mit der Lieferung/Übergabe der Ware zustande.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-secondary mb-3">§ 3 Preise und Zahlung</h2>
          <p className="text-muted leading-relaxed">
            Alle ausgewiesenen Preise sind Endpreise inklusive der gesetzlichen Mehrwertsteuer. Pfand wird gesondert ausgewiesen
            und dem Kaufpreis hinzugerechnet. Die Zahlung erfolgt — je nach gewählter Option — bei Abholung im Markt in bar, per
            EC-Karte oder bei Lieferung gegen Rechnung bzw. Vorkasse.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-secondary mb-3">§ 4 Lieferung und Abholung</h2>
          <p className="text-muted leading-relaxed">
            <strong>Abholung:</strong> Reservierte Ware wird zum vereinbarten Termin im Markt zur Abholung bereitgestellt
            (Jurgenstr. 20, 47574 Goch).<br /><br />
            <strong>Lieferung:</strong> Wir liefern in Goch und im Umkreis von 15 km (Niederrhein, Grenzregion zu den
            Niederlanden). Lieferkosten und -termine werden im Bestellprozess transparent angezeigt. Mindestbestellwert für
            kostenlose Lieferung: 50 € innerhalb Goch.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-secondary mb-3">§ 5 Widerrufsrecht für Verbraucher</h2>
          <div className="bg-[#FFF8F6] border border-[#F0D5CF] rounded-xl p-5 mb-3">
            <p className="font-bold text-secondary mb-2">Widerrufsbelehrung</p>
            <p className="text-muted text-sm leading-relaxed">
              Sie haben das Recht, binnen <strong>vierzehn Tagen</strong> ohne Angabe von Gründen diesen Vertrag zu widerrufen.
              Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht
              der Beförderer ist, die Waren in Besitz genommen haben bzw. hat.
            </p>
            <p className="text-muted text-sm leading-relaxed mt-2">
              Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (Trinkgut Jammers Goch, Jurgenstr. 20, 47574 Goch, Tel:
              02823-418707, E-Mail: jammers-goch@trinkgut.de) mittels einer eindeutigen Erklärung (z. B. ein mit der Post
              versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.
            </p>
            <p className="text-muted text-sm leading-relaxed mt-2">
              <strong>Folgen des Widerrufs:</strong> Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen,
              die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich
              daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung
              gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung
              über Ihren Widerruf dieses Vertrags bei uns eingegangen ist.
            </p>
          </div>
          <p className="text-muted leading-relaxed">
            <strong>Ausschluss des Widerrufsrechts:</strong> Das Widerrufsrecht besteht nicht bei Lieferung versiegelter Waren,
            die aus Gründen des Gesundheitsschutzes oder der Hygiene nach Lieferung entsiegelt wurden, sowie bei verderblichen
            Waren oder solchen, deren Verfallsdatum schnell überschritten würde.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-secondary mb-3">§ 6 Eigentumsvorbehalt</h2>
          <p className="text-muted leading-relaxed">
            Die gelieferte Ware bleibt bis zur vollständigen Bezahlung Eigentum des Anbieters.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-secondary mb-3">§ 7 Gewährleistung</h2>
          <p className="text-muted leading-relaxed">
            Es gelten die gesetzlichen Gewährleistungsbestimmungen. Reklamationen sind unverzüglich nach Erhalt der Ware
            anzuzeigen. Bei berechtigten Mängeln erfolgt nach unserer Wahl Nachbesserung oder Ersatzlieferung.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-secondary mb-3">§ 8 Haftung</h2>
          <p className="text-muted leading-relaxed">
            Wir haften unbeschränkt für Vorsatz und grobe Fahrlässigkeit sowie für Schäden aus der Verletzung des Lebens, des
            Körpers oder der Gesundheit. Bei einfacher Fahrlässigkeit haften wir nur bei Verletzung wesentlicher Vertragspflichten
            (Kardinalpflichten) und der Höhe nach begrenzt auf den vorhersehbaren, vertragstypischen Schaden.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-secondary mb-3">§ 9 Jugendschutz</h2>
          <p className="text-muted leading-relaxed">
            Die Abgabe alkoholischer Getränke an Personen unter 16 bzw. 18 Jahren (je nach Sorte) ist untersagt. Bei Lieferung
            und Abholung ist der Anbieter berechtigt, einen Altersnachweis zu verlangen. Mit Ihrer Bestellung versichern Sie,
            das gesetzliche Mindestalter erreicht zu haben.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-secondary mb-3">§ 10 Streitbeilegung</h2>
          <p className="text-muted leading-relaxed">
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung bereit:{" "}
            <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              ec.europa.eu/consumers/odr
            </a>. Wir sind weder bereit noch verpflichtet, an einem Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-secondary mb-3">§ 11 Schlussbestimmungen</h2>
          <p className="text-muted leading-relaxed">
            Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Erfüllungsort und
            Gerichtsstand ist — soweit gesetzlich zulässig — Goch.
          </p>
          <p className="text-muted leading-relaxed mt-3">
            Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
          </p>
        </section>

        <p className="text-xs text-muted mt-12 italic">
          Stand: Mai 2026 · Diese AGB werden bei Bedarf aktualisiert.
        </p>
      </div>
    </>
  );
}
