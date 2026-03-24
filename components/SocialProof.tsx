export default function SocialProof() {
  return (
    <section className="py-16 bg-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-2">Kundenstimmen</p>
          <h2 className="text-2xl md:text-3xl font-extrabold text-secondary mb-3">
            Was unsere Kunden sagen
          </h2>
          <div className="flex items-center justify-center gap-2 text-sm text-muted">
            <div className="flex">
              {[...Array(4)].map((_, i) => (
                <span key={i} className="text-amber-400 text-lg">★</span>
              ))}
              <span className="text-amber-400 text-lg">★</span>
            </div>
            <span className="font-medium text-secondary">4,6 / 5</span>
            <span>·</span>
            <a href="https://www.google.com/maps/place/trinkgut+Jammers/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              auf Google ansehen
            </a>
          </div>
        </div>

        {/* Echte Bewertungen — Platzhalter bis echte Google Reviews integriert werden */}
        <div className="bg-white rounded-2xl p-8 border border-border text-center max-w-2xl mx-auto">
          <p className="text-muted text-sm mb-4">
            Unsere Kundenbewertungen werden direkt von Google geladen. Klicke unten um alle Bewertungen zu lesen.
          </p>
          <a
            href="https://www.google.com/maps/place/trinkgut+Jammers/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Google Bewertungen lesen
          </a>
          <p className="text-xs text-muted mt-4">
            Du warst bei uns? Hinterlasse uns gerne eine Bewertung auf Google!
          </p>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap gap-6 justify-center mt-10 text-sm text-muted">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏪</span>
            <span>Getränkemarkt in Goch</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🇩🇪🇳🇱</span>
            <span>Deutsche & niederländische Kunden</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📦</span>
            <span>Über 7.000 Artikel</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🎉</span>
            <span>Partyservice & Vermietung</span>
          </div>
        </div>
      </div>
    </section>
  );
}
