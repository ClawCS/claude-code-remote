import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-primary to-red-900 animate-gradient" />

      {/* Secondary gradient layer for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />

      {/* Blur overlay orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float-slow" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-red-400/20 rounded-full blur-3xl animate-float" />

      {/* Background decoration — floating */}
      <div className="absolute inset-0 opacity-[0.07]">
        <div className="absolute top-10 left-10 text-[12rem] leading-none select-none animate-float">🍺</div>
        <div className="absolute top-5 right-16 text-[10rem] leading-none select-none animate-float-slow">🍷</div>
        <div className="absolute bottom-5 left-1/4 text-[8rem] leading-none select-none animate-float" style={{ animationDelay: '2s' }}>🥤</div>
        <div className="absolute bottom-10 right-1/3 text-[9rem] leading-none select-none animate-float-slow" style={{ animationDelay: '1s' }}>🥃</div>
      </div>

      {/* Noise texture overlay */}
      <div className="absolute inset-0 noise-bg" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-28 md:py-40 text-white">
        <div className="max-w-2xl animate-fade-in-up">
          <p className="text-base md:text-lg font-bold tracking-[0.15em] uppercase text-white/80 mb-5 glass inline-block px-4 py-1.5 rounded-full">
            Trinkgut Jammers Goch
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold leading-[1.05] mb-7 tracking-tight">
            Dein Getränkemarkt.
            <br />
            <span className="text-accent drop-shadow-lg">Online entdecken.</span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 mb-12 leading-relaxed max-w-xl">
            Über 7.000 Artikel — von Bier über Wein bis Spirituosen.
            Partyplanung, Vermietung und persönliche Beratung.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/produkte"
              className="inline-flex items-center justify-center px-8 py-4 bg-accent hover:bg-accent-dark text-secondary font-bold rounded-2xl transition-all btn-hover text-lg shadow-lg shadow-amber-500/25"
            >
              Sortiment entdecken
            </Link>
            <Link
              href="/partyplaner"
              className="inline-flex items-center justify-center px-8 py-4 glass text-white font-semibold rounded-2xl transition-all hover:bg-white/20 text-lg"
            >
              🎉 Party planen
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
