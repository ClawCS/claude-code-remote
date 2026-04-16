"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";

type Page = {
  number: number;
  imageUrl: string;
  thumbnailUrl: string;
};

type ProspektViewerProps = {
  pages: Page[];
  kw: number;
  werbekreis: string;
  pdfUrl?: string;
  fallbackUrl?: string;
};

export default function ProspektViewer({
  pages,
  kw,
  werbekreis,
  pdfUrl,
  fallbackUrl,
}: ProspektViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const totalPages = pages.length;

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 0 && page < totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages]
  );

  const nextPage = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const prevPage = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  // Keyboard-Navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextPage();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        prevPage();
      } else if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      } else if (e.key === "f" || e.key === "F") {
        setIsFullscreen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [nextPage, prevPage, isFullscreen]);

  // Thumbnail ins Sichtfeld scrollen
  useEffect(() => {
    if (thumbnailRef.current) {
      const thumb = thumbnailRef.current.children[currentPage] as HTMLElement;
      if (thumb) {
        thumb.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [currentPage]);

  // Touch-Swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextPage();
      else prevPage();
    }
    setTouchStart(null);
  };

  const handleImageError = (pageNum: number) => {
    setImageErrors((prev) => new Set(prev).add(pageNum));
  };

  // Fallback: Iframe wenn keine Seiten vorhanden
  if (totalPages === 0 && fallbackUrl) {
    return <FallbackViewer url={fallbackUrl} kw={kw} werbekreis={werbekreis} />;
  }

  if (totalPages === 0) {
    return (
      <div className="text-center py-16">
        <span className="text-6xl block mb-4">📰</span>
        <p className="text-muted">Kein Handzettel verfuegbar. Bitte spaeter erneut versuchen.</p>
      </div>
    );
  }

  const currentPageData = pages[currentPage];

  const viewerContent = (
    <div
      ref={viewerRef}
      className={`relative bg-gray-900 rounded-2xl overflow-hidden select-none ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Toolbar */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent p-4 flex items-center justify-between">
        <div className="text-white text-sm font-medium">
          Seite {currentPage + 1} von {totalPages}
          <span className="hidden sm:inline text-white/60 ml-2">
            — KW {kw} · Werbekreis {werbekreis}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* PDF Download */}
          {pdfUrl && (
            <a
              href={pdfUrl}
              download={`Handzettel-KW${kw}.pdf`}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
              title="Als PDF herunterladen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </a>
          )}
          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            title={isFullscreen ? "Vollbild beenden (F)" : "Vollbild (F)"}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0v4m0-4h4m7 11l5 5m0 0v-4m0 4h-4" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Hauptbild */}
      <div className={`relative ${isFullscreen ? "h-screen" : "aspect-[3/4] sm:aspect-[4/5]"}`}>
        {imageErrors.has(currentPageData.number) ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center text-white/60">
              <span className="text-4xl block mb-2">📄</span>
              <p className="text-sm">Seite {currentPage + 1} konnte nicht geladen werden</p>
            </div>
          </div>
        ) : (
          <Image
            src={currentPageData.imageUrl}
            alt={`Handzettel Seite ${currentPage + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-contain"
            priority={currentPage === 0}
            unoptimized
            onError={() => handleImageError(currentPageData.number)}
          />
        )}

        {/* Navigations-Overlay (links/rechts klicken) */}
        <button
          onClick={prevPage}
          disabled={currentPage === 0}
          className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer z-10 group"
          aria-label="Vorherige Seite"
        >
          <div className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
        </button>
        <button
          onClick={nextPage}
          disabled={currentPage === totalPages - 1}
          className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer z-10 group"
          aria-label="Naechste Seite"
        >
          <div className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>

      {/* Navigation unten */}
      <div className="bg-gray-900 p-3">
        {/* Pfeil-Buttons + Seitenanzeige */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <button
            onClick={prevPage}
            disabled={currentPage === 0}
            className="p-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 rounded-lg text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Direkt-Auswahl */}
          <select
            value={currentPage}
            onChange={(e) => goToPage(Number(e.target.value))}
            className="bg-white/10 text-white rounded-lg px-3 py-1.5 text-sm border-0 focus:ring-2 focus:ring-white/30"
          >
            {pages.map((_, i) => (
              <option key={i} value={i} className="bg-gray-900">
                Seite {i + 1}
              </option>
            ))}
          </select>

          <button
            onClick={nextPage}
            disabled={currentPage === totalPages - 1}
            className="p-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 rounded-lg text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Thumbnails */}
        <div
          ref={thumbnailRef}
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin"
          style={{ scrollbarWidth: "thin" }}
        >
          {pages.map((page, i) => (
            <button
              key={page.number}
              onClick={() => goToPage(i)}
              className={`relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                i === currentPage
                  ? "border-white shadow-lg shadow-white/20 scale-105"
                  : "border-transparent opacity-60 hover:opacity-90"
              }`}
              style={{ width: "60px", height: "80px" }}
            >
              {imageErrors.has(page.number) ? (
                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                  <span className="text-xs text-white/40">{page.number}</span>
                </div>
              ) : (
                <Image
                  src={page.thumbnailUrl}
                  alt={`Seite ${page.number}`}
                  fill
                  sizes="60px"
                  className="object-cover"
                  unoptimized
                  onError={() => handleImageError(page.number)}
                />
              )}
              <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                {page.number}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Keyboard-Hinweis */}
      <div className="hidden sm:block text-center py-2 text-white/30 text-xs">
        Pfeiltasten zum Blaettern · F fuer Vollbild · Esc zum Beenden
      </div>
    </div>
  );

  return viewerContent;
}

/** Fallback: Handzettel wird geladen */
function FallbackViewer({
  kw,
  werbekreis,
}: {
  url: string;
  kw: number;
  werbekreis: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 text-white">
        <h2 className="text-lg font-bold">
          Handzettel KW {kw} — Werbekreis {werbekreis}
        </h2>
      </div>

      <div className="py-16 px-8">
        <div className="text-center max-w-md mx-auto">
          <span className="text-6xl block mb-4">📰</span>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">
            Handzettel wird vorbereitet
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            KW {kw} — Werbekreis {werbekreis} — Goch und Umgebung.
            Der Handzettel wird gerade vom Server abgerufen.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-lg shadow-lg transition-all hover:scale-105"
          >
            Seite neu laden
          </button>
        </div>
      </div>
    </div>
  );
}
