import Link from "next/link";
import Image from "next/image";
import { courses } from "@/data/akademie";
import ShimmerParticles from "@/components/ShimmerParticles";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Getränkeakademie" };

export default function AkademiePage() {
  const totalLessons = courses.reduce((sum, c) => sum + c.lessons.length, 0);

  return (
    <>
      {/* Red Hero Banner — identisch zur Startseite (page-hero-banner) */}
      <div className="page-hero-banner py-16 md:py-24">
        <ShimmerParticles />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <nav className="text-sm text-white/60 mb-4">
            <a href="/" className="hover:text-white">Home</a>
            <span className="mx-1">/</span>
            <span className="text-white">Getränkeakademie</span>
          </nav>
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#F59E0B] mb-4">
            Wissen & Zertifikate · Seit 2024
          </p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-3">
            Getränkeakademie
          </h1>
          <p className="text-white/80 max-w-xl mx-auto text-lg">
            Werde zum Getränke-Experten — <strong>{courses.length} Kurse</strong> mit{" "}
            <strong>{totalLessons} Lektionen</strong> auf Sommelier-Niveau.
          </p>
        </div>
      </div>

      {/* Course Grid */}
      <section className="relative py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course, i) => (
              <Link
                key={course.slug}
                href={`/akademie/${course.slug}`}
                className="group relative block rounded-2xl overflow-hidden border border-white/5 hover:border-[#DC2626]/50 shadow-2xl shadow-black/40 hover:shadow-[0_0_32px_rgba(220,38,38,0.25)] transition-all duration-300 hover:-translate-y-1 aspect-[3/2] bg-[#0F0F0F]"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {course.image ? (
                  <Image
                    src={course.image}
                    alt={course.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    unoptimized
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${course.color} flex items-center justify-center`}>
                    <span className="text-7xl">{course.icon}</span>
                  </div>
                )}

                {/* Top right meta-pills */}
                <div className="absolute top-3 right-3 flex flex-col items-end gap-2 z-10">
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full backdrop-blur-md ${
                    course.difficulty === "Einsteiger" ? "bg-green-500/80 text-white" :
                    course.difficulty === "Fortgeschritten" ? "bg-amber-500/80 text-white" :
                    "bg-red-500/80 text-white"
                  }`}>{course.difficulty}</span>
                </div>

                {/* Bottom info bar — appears on hover */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/85 to-transparent pt-12 pb-4 px-4">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-extrabold text-white leading-tight">{course.title}</h2>
                      <p className="text-xs text-white/60 mt-0.5">
                        {course.lessons.length} Lektionen · {course.duration}
                      </p>
                    </div>
                    <span className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 bg-[#DC2626] text-white text-xs font-bold rounded-full shadow-lg shadow-red-500/30 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                      Start
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Learn — drei Vorteile */}
      <section className="relative py-16">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#DC2626]/40 to-transparent" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#DC2626] mb-2">
              Warum lernen?
            </p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white section-accent-center">
              Mehr als nur Theorie
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: "🎓", title: "Expertenwissen", text: "Von Profis aufbereitet — verständlich, praxisnah und sofort anwendbar." },
              { icon: "🛒", title: "Besser einkaufen", text: "Wer versteht, was er kauft, trifft bessere Entscheidungen und entdeckt Neues." },
              { icon: "🥂", title: "Mehr genießen", text: "Hintergrundwissen macht jedes Glas zum Erlebnis — ob Bier, Wein oder Whisky." },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white/[0.03] border border-white/5 hover:border-[#DC2626]/40 rounded-2xl p-6 text-center transition-colors"
              >
                <span className="text-4xl block mb-3">{card.icon}</span>
                <h3 className="font-bold text-white mb-2">{card.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Zertifikate CTA */}
      <section className="relative py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Link
            href="/akademie/zertifikate"
            className="group block bg-gradient-to-br from-[#1F1F1F] via-[#2A0F0F] to-[#0F0F0F] border border-[#DC2626]/30 hover:border-[#DC2626]/60 rounded-2xl p-8 md:p-10 text-center shadow-2xl shadow-black/40 hover:shadow-[0_0_40px_rgba(220,38,38,0.2)] transition-all hover:-translate-y-1"
          >
            <span className="text-5xl block mb-4">🏅</span>
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-[#DC2626] mb-3">
              Professionelle Ausbildung
            </p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3 group-hover:text-[#EF4444] transition-colors">
              IHK & WSET Zertifikatskurse
            </h2>
            <p className="text-white/60 max-w-lg mx-auto mb-6">
              16 buchbare Kurse mit IHK-Zertifikaten, WSET-Diplomen und Sommelier-Ausbildungen — für deine Karriere im Getränkehandel.
            </p>
            <span className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] hover:to-[#DC2626] text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all">
              Alle Zertifikatskurse ansehen
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          </Link>
        </div>
      </section>
    </>
  );
}
