import type { Metadata } from "next";

export const metadata: Metadata = { title: "Eigenmarke" };

export default function EigenmarkePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-12 animate-fade-in-up">
        <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-2">Exklusiv</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-secondary mb-3">Unsere Eigenmarke</h1>
        <p className="text-muted max-w-lg mx-auto">
          Exklusive Produkte von Trinkgut Jammers — nur bei uns erhältlich. Qualität zum fairen Preis.
        </p>
      </div>

      <div className="bg-gradient-to-br from-accent/10 to-primary/5 border border-accent/20 rounded-2xl p-10 text-center">
        <span className="text-6xl block mb-4">🏷️</span>
        <h2 className="text-2xl font-bold text-secondary mb-3">Kommt bald!</h2>
        <p className="text-muted max-w-md mx-auto mb-6">
          Unsere Eigenmarke-Produkte werden gerade vorbereitet. Sobald die Produktdaten und Fotos vorliegen, findest du sie hier.
        </p>
        <p className="text-sm text-muted">
          Du möchtest vorab Infos? Schreib uns auf{" "}
          <a href="https://wa.me/491752492386" target="_blank" rel="noopener noreferrer" className="text-primary font-medium hover:underline">WhatsApp</a> oder ruf an:{" "}
          <a href="tel:02823418707" className="text-primary font-medium hover:underline">02823-418707</a>
        </p>
      </div>
    </div>
  );
}
