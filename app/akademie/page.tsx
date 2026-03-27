import Link from "next/link";
import { courses } from "@/data/akademie";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Getränkeakademie" };

export default function AkademiePage() {
  return (
    <>
    {/* Red Hero Banner */}
    <div className="page-hero-banner py-16 md:py-24">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <nav className="text-sm text-white/60 mb-4"><a href="/" className="hover:text-white">Home</a> <span className="mx-1">/</span> <span className="text-white">Getränkeakademie</span></nav>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-3">Getränkeakademie</h1>
        <p className="text-white/80 max-w-xl mx-auto text-lg">
          Werde zum Getränke-Experten! {courses.length} Kurse mit {courses.reduce((sum, c) => sum + c.lessons.length, 0)} Lektionen
          — von Bierwissen bis Likör-Herstellung.
        </p>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-children">
        {courses.map((course) => (
          <Link
            key={course.slug}
            href={`/akademie/${course.slug}`}
            className="group relative bg-white border border-border rounded-2xl overflow-hidden card-hover"
          >
            <div className={`bg-gradient-to-br ${course.color} p-6 text-white`}>
              <span className="text-5xl block mb-3 group-hover:scale-110 transition-transform">{course.icon}</span>
              <h2 className="text-xl font-bold">{course.title}</h2>
              <p className="text-sm text-white/70 mt-1">{course.lessons.length} Lektionen</p>
            </div>
            <div className="p-5">
              <p className="text-sm text-muted leading-relaxed">{course.description}</p>
              <p className="text-primary font-semibold text-sm mt-3 group-hover:underline">
                Kurs starten →
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Zertifikate CTA */}
      <div className="mt-12 bg-gradient-to-r from-secondary to-gray-800 rounded-2xl p-8 text-white text-center">
        <span className="text-4xl block mb-3">🏅</span>
        <h2 className="text-2xl font-bold mb-2">Professionelle Zertifikatskurse</h2>
        <p className="text-white/80 max-w-lg mx-auto mb-5">
          IHK-Zertifikate, WSET-Diplome und Sommelier-Ausbildungen — 16 buchbare Kurse für deine Karriere.
        </p>
        <Link
          href="/akademie/zertifikate"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-secondary font-bold rounded-xl hover:bg-gray-100 transition-colors"
        >
          Alle Zertifikatskurse ansehen →
        </Link>
      </div>

      {/* Why Learn */}
      <div className="mt-16 bg-light rounded-2xl p-8 md:p-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <span className="text-4xl block mb-3">🎓</span>
            <h3 className="font-bold text-secondary mb-2">Expertenwissen</h3>
            <p className="text-sm text-muted">Von Profis aufbereitet — verständlich, praxisnah und sofort anwendbar.</p>
          </div>
          <div className="text-center">
            <span className="text-4xl block mb-3">🛒</span>
            <h3 className="font-bold text-secondary mb-2">Besser einkaufen</h3>
            <p className="text-sm text-muted">Wer versteht, was er kauft, trifft bessere Entscheidungen und entdeckt Neues.</p>
          </div>
          <div className="text-center">
            <span className="text-4xl block mb-3">🥂</span>
            <h3 className="font-bold text-secondary mb-2">Mehr genießen</h3>
            <p className="text-sm text-muted">Hintergrundwissen macht jedes Glas zum Erlebnis — ob Bier, Wein oder Whisky.</p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
