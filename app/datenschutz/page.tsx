import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung",
};

export default function DatenschutzPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-3xl font-bold text-secondary mb-8">Datenschutzerklärung</h1>

      <div className="space-y-8 text-sm text-muted leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-secondary mb-2">1. Verantwortlicher</h2>
          <p>
            Trinkgut Jammers, Jammers e.K.<br />
            Inhaber: Nikolaos Jammers<br />
            Jurgenstr. 20, 47574 Goch<br />
            E-Mail: jammers-goch@trinkgut.de<br />
            Tel: 02823-418707
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary mb-2">2. Erhebung und Speicherung personenbezogener Daten</h2>
          <p>
            Beim Besuch unserer Website werden automatisch Informationen durch den Browser übermittelt und in Server-Log-Dateien gespeichert.
            Diese Daten sind nicht bestimmten Personen zuordenbar und werden nicht mit anderen Datenquellen zusammengeführt.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary mb-2">3. Cookies</h2>
          <p>
            Unsere Website verwendet ausschließlich technisch notwendige Cookies, die für den Betrieb der Seite erforderlich sind
            (z.B. Warenkorb-Funktion, Cookie-Consent-Speicherung). Es werden keine Tracking- oder Marketing-Cookies eingesetzt.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary mb-2">4. Kontaktformular / Bestellformular</h2>
          <p>
            Wenn Sie uns per Formular Anfragen zukommen lassen, werden Ihre Angaben aus dem Formular inklusive der von Ihnen
            dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert.
            Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary mb-2">5. Gewinnspiele</h2>
          <p>
            Bei Teilnahme an Gewinnspielen werden die angegebenen Daten ausschließlich zur Durchführung des Gewinnspiels verwendet
            und nach Ablauf des Gewinnspiels gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary mb-2">6. Ihre Rechte</h2>
          <p>Sie haben das Recht auf:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Auskunft über Ihre bei uns gespeicherten Daten (Art. 15 DSGVO)</li>
            <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO)</li>
            <li>Löschung Ihrer Daten (Art. 17 DSGVO)</li>
            <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
            <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary mb-2">7. Wetterdienst</h2>
          <p>
            Wir nutzen den Dienst Open-Meteo (open-meteo.com) zur Anzeige von Wetterdaten. Dabei wird Ihre ungefähre Position
            anhand Ihrer IP-Adresse ermittelt (ipapi.co). Es werden keine personenbezogenen Daten gespeichert.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary mb-2">8. KI-Assistent &amp; Bild-Uploads (Google Gemini)</h2>
          <p>
            Unser Website-Chat („Frag mich etwas") sowie die Funktionen Kühlschrank- und Leergut-Scan nutzen die
            KI-Schnittstelle Google Gemini (Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland).
            Wenn Sie den Chat verwenden, werden Ihre eingegebenen Texte an Google übermittelt und dort verarbeitet,
            um eine Antwort zu erzeugen. Beim Kühlschrank- oder Leergut-Scan wird zusätzlich das von Ihnen
            hochgeladene Bild an Google übermittelt und analysiert. Die Verarbeitung kann auf Servern außerhalb der
            EU (u. a. in den USA) erfolgen; Google stützt solche Drittlandübermittlungen auf die
            EU-Standardvertragsklauseln.
          </p>
          <p className="mt-2">
            Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem funktionierenden
            Beratungs- und Service-Angebot). Bitte geben Sie im Chat keine sensiblen personenbezogenen Daten ein und
            laden Sie nur Bilder hoch, auf denen keine Personen erkennbar sind. Wir speichern die Chat-Inhalte und
            hochgeladenen Bilder nicht dauerhaft auf unseren Systemen. Weitere Informationen finden Sie in den
            Datenschutzhinweisen von Google (policies.google.com/privacy).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary mb-2">9. Externe Links</h2>
          <p>
            Unsere Website enthält Links zu externen Websites (z.B. Instagram, Facebook, WhatsApp).
            Für die Inhalte und Datenschutzpraktiken dieser Seiten sind wir nicht verantwortlich.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-secondary mb-2">10. Änderungen</h2>
          <p>
            Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie stets den aktuellen
            rechtlichen Anforderungen anzupassen. Stand: Juli 2026.
          </p>
        </section>
      </div>
    </div>
  );
}
