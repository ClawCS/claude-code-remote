"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

type HandzettelPage = {
  number: number;
  imageUrl: string;
  thumbnailUrl: string;
};

type HandzettelData = {
  catalogId: string;
  kw: number;
  year: number;
  weekStart: string;
  weekEnd: string;
  fetchedAt: string;
  viewerUrl: string;
  pdfUrl: string;
  pageCount: number;
  pages: HandzettelPage[];
  status: "ok" | "fallback";
};

function getISOCalendarWeek() {
  const now = new Date();
  const tmp = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  const fmt = (d: Date) =>
    d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  return `Gueltig vom ${fmt(monday)} bis ${fmt(saturday)}`;
}

export default function AngebotePage() {
  const currentKW = getISOCalendarWeek();
  const [data, setData] = useState<HandzettelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomedPage, setZoomedPage] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/handzettel/fetch")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setData(json))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const hasPages = data?.status === "ok" && data.pages.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-3xl font-bold text-secondary mb-2">Aktuelle Angebote</h1>
      <p className="text-muted mb-8">
        KW {currentKW} · {getWeekRange()} · trinkgut Jammers Goch · Nur solange der Vorrat reicht.
      </p>

      {/* Handzettel Banner */}
      <section className="bg-gradient-to-r from-primary to-red-700 text-white rounded-2xl p-6 sm:p-8 mb-10 flex flex-col md:flex-row items-center gap-6">
        <div className="flex-1">
          <span className="inline-block bg-white/20 text-white text-sm font-bold px-3 py-1 rounded-full mb-3">
            WOCHENANGEBOTE KW {data?.kw ?? currentKW}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            Aktueller Handzettel
          </h2>
          <p className="text-white/80 mb-4">
            Alle Angebote dieser Woche aus unserem Prospekt — Werbekreis 3.6, Goch und Umgebung.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/handzettel"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-bold rounded-xl hover:bg-gray-100 transition-colors"
            >
              📰 Prospekt durchblaettern
            </Link>
            {data?.pdfUrl && (
              <a
                href={data.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 text-white font-bold rounded-xl hover:bg-white/30 transition-colors"
              >
                📥 PDF herunterladen
              </a>
            )}
          </div>
        </div>
        <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
          <span className="text-6xl sm:text-7xl">📰</span>
        </div>
      </section>

      {/* Follower-Rabatt */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <Link
          href="/handzettel"
          className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex items-center gap-4 hover:shadow-md transition-shadow group"
        >
          <span className="text-4xl">📖</span>
          <div className="flex-1">
            <h3 className="font-bold text-secondary group-hover:text-primary transition-colors">
              Handzettel KW {currentKW} interaktiv durchblaettern
            </h3>
            <p className="text-xs text-muted">
              Vollbild, Tastatur-Navigation, Zoom — wie ein echtes Heft
            </p>
          </div>
          <svg className="w-5 h-5 text-muted group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl p-6 flex items-center gap-4 text-white">
          <span className="text-4xl">📱</span>
          <div className="flex-1">
            <h3 className="font-bold">5 EUR Rabatt fuer Follower!</h3>
            <p className="text-xs text-white/80">Folge uns auf Instagram und spare bei ausgewaehlten Produkten.</p>
          </div>
          <a href="https://www.instagram.com/trinkgutjammers_goch/" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white text-secondary font-bold rounded-lg hover:bg-gray-100 transition-colors text-sm whitespace-nowrap">
            Folgen
          </a>
        </div>
      </div>

      {/* Wochenangebote aus Handzettel */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-secondary">
            Angebote der Woche
          </h2>
          {data?.fetchedAt && (
            <span className="text-xs text-muted">
              Aktualisiert: {new Date(data.fetchedAt).toLocaleDateString("de-DE")}
            </span>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
            <p className="text-muted text-sm">Angebote werden geladen...</p>
          </div>
        )}

        {/* Handzettel-Seiten als Angebots-Grid */}
        {hasPages && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.pages.map((page) => (
              <button
                key={page.number}
                onClick={() => setZoomedPage(page.number)}
                className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer"
              >
                <div className="relative aspect-[3/4]">
                  <Image
                    src={page.imageUrl}
                    alt={`Angebote Seite ${page.number}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-contain"
                  />
                  {/* Hover-Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white px-4 py-2 rounded-lg text-sm font-medium">
                      Vergroessern
                    </div>
                  </div>
                </div>
                <div className="p-2 text-center border-t border-gray-100">
                  <span className="text-xs text-muted font-medium">Seite {page.number}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Fallback: Kein Handzettel */}
        {!loading && !hasPages && (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <span className="text-5xl block mb-4">📰</span>
            <h3 className="text-lg font-bold text-secondary mb-2">
              Angebote werden vorbereitet
            </h3>
            <p className="text-muted text-sm mb-4">
              Die aktuellen Wochenangebote werden vom Server abgerufen. Bitte versuche es in wenigen Minuten erneut.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
            >
              Seite neu laden
            </button>
          </div>
        )}
      </section>

      {/* CTA */}
      <div className="text-center py-8">
        <p className="text-muted mb-4">Noch mehr Angebote gibt es direkt im Markt!</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/produkte" className="px-8 py-3 bg-primary hover:bg-red-700 text-white font-bold rounded-lg transition-colors">
            Alle Produkte
          </Link>
          <Link href="/handzettel" className="px-8 py-3 border border-primary text-primary hover:bg-primary hover:text-white font-bold rounded-lg transition-colors">
            Handzettel durchblaettern
          </Link>
        </div>
      </div>

      {/* Zoom-Modal */}
      {zoomedPage !== null && data?.pages && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomedPage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {/* Schliessen */}
            <button
              onClick={() => setZoomedPage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Navigation */}
            <div className="absolute -top-12 left-0 flex items-center gap-4">
              <button
                onClick={() => setZoomedPage(Math.max(1, zoomedPage - 1))}
                disabled={zoomedPage <= 1}
                className="text-white hover:text-gray-300 disabled:opacity-30 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-white text-sm font-medium">
                Seite {zoomedPage} von {data.pages.length}
              </span>
              <button
                onClick={() => setZoomedPage(Math.min(data.pages.length, zoomedPage + 1))}
                disabled={zoomedPage >= data.pages.length}
                className="text-white hover:text-gray-300 disabled:opacity-30 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Bild */}
            <div className="relative aspect-[3/4] bg-white rounded-xl overflow-hidden">
              <Image
                src={data.pages[zoomedPage - 1].imageUrl}
                alt={`Angebote Seite ${zoomedPage}`}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
      )}

      {/* Auto-Update Hinweis */}
      <p className="text-center text-xs text-muted mt-4">
        Angebote werden jeden Sonntag um 17:00 Uhr automatisch aktualisiert — Werbekreis 3.6
      </p>
    </div>
  );
}
