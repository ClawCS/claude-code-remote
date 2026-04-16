"use client";

import { useState } from "react";

type ProspektViewerProps = {
  viewerUrl: string;
  kw: number;
  werbekreis: string;
  pdfUrl?: string;
};

export default function ProspektViewer({
  viewerUrl,
  kw,
  werbekreis,
  pdfUrl,
}: ProspektViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  return (
    <div
      className={`relative bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : ""
      }`}
    >
      {/* Toolbar */}
      <div className="bg-gradient-to-r from-primary to-red-700 p-4 flex items-center justify-between">
        <div className="text-white text-sm font-medium">
          Handzettel KW {kw}
          <span className="hidden sm:inline text-white/70 ml-2">
            — Werbekreis {werbekreis} — Goch und Umgebung
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* PDF Download */}
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-white text-xs font-medium transition-colors"
              title="Als PDF herunterladen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">PDF</span>
            </a>
          )}
          {/* Extern oeffnen */}
          <a
            href={viewerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-white text-xs font-medium transition-colors"
            title="Im neuen Tab oeffnen"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span className="hidden sm:inline">Neuer Tab</span>
          </a>
          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-white text-xs font-medium transition-colors"
            title={isFullscreen ? "Vollbild beenden" : "Vollbild"}
          >
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9L4 4m0 0v4m0-4h4m7 11l5 5m0 0v-4m0 4h-4" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
            <span className="hidden sm:inline">{isFullscreen ? "Beenden" : "Vollbild"}</span>
          </button>
        </div>
      </div>

      {/* iframe Viewer */}
      <div className={`relative ${isFullscreen ? "h-[calc(100vh-56px)]" : "h-[70vh] min-h-[500px] max-h-[900px]"}`}>
        {/* Loading-Spinner */}
        {!iframeLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
            <div className="text-center">
              <div className="inline-block w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-muted text-sm">Handzettel wird geladen...</p>
            </div>
          </div>
        )}
        <iframe
          src={viewerUrl}
          title={`Trinkgut Handzettel KW ${kw}`}
          className="w-full h-full border-0"
          allow="fullscreen"
          onLoad={() => setIframeLoaded(true)}
        />
      </div>

      {/* Keyboard-Hinweis */}
      <div className="hidden sm:block text-center py-2 text-gray-400 text-xs bg-gray-50 border-t border-gray-100">
        Blaettere durch den Handzettel im eingebetteten Viewer — oder oeffne ihn im neuen Tab
      </div>
    </div>
  );
}
