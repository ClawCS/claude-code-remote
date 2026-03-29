"use client";

import Link from "next/link";
import { useState } from "react";

function getISOCalendarWeek() {
  const now = new Date();
  const tmp = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export default function HandzettelPage() {
  const currentKW = getISOCalendarWeek();
  const [activeTab, setActiveTab] = useState<"de" | "nl">("de");

  // Trinkgut Prospekt direkt von der offiziellen Quelle
  const trinkgutProspektUrl = "https://www.trinkgut.de/angebote/";
  const pdfPath = `/handzettel/${activeTab}/kw-${currentKW}.pdf`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="text-center mb-8">
        <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-2">Wochenangebote</p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-secondary mb-3">Aktueller Handzettel</h1>
        <p className="text-muted max-w-lg mx-auto">
          Unser aktueller Prospekt mit allen Angeboten der Woche. Werbekreis 3.6 — Goch und Umgebung.
        </p>
      </div>

      {/* DE / NL Tabs */}
      <div className="flex justify-center gap-3 mb-6">
        <button
          onClick={() => setActiveTab("de")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-lg transition-all ${
            activeTab === "de"
              ? "bg-primary text-white shadow-lg shadow-red-500/20"
              : "bg-gray-100 text-secondary hover:bg-gray-200"
          }`}
        >
          <svg className="w-6 h-4 rounded-sm" viewBox="0 0 20 14">
            <rect width="20" height="4.67" fill="#000" />
            <rect y="4.67" width="20" height="4.67" fill="#DD0000" />
            <rect y="9.33" width="20" height="4.67" fill="#FFCC00" />
          </svg>
          Deutschland
        </button>
        <button
          onClick={() => setActiveTab("nl")}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-lg transition-all ${
            activeTab === "nl"
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
              : "bg-gray-100 text-secondary hover:bg-gray-200"
          }`}
        >
          <svg className="w-6 h-4 rounded-sm" viewBox="0 0 20 14">
            <rect width="20" height="4.67" fill="#AE1C28" />
            <rect y="4.67" width="20" height="4.67" fill="#FFF" />
            <rect y="9.33" width="20" height="4.67" fill="#21468B" />
          </svg>
          Nederland
        </button>
      </div>

      {/* KW Anzeige */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-white rounded-xl font-bold">
          <span className="text-sm">📅</span>
          KW {currentKW}
          <span className="text-xs font-normal opacity-70">— aktuelle Woche</span>
        </div>
      </div>

      {/* Prospekt Anzeige — Direkt von trinkgut.de */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm mb-8">
        <div className={`p-4 text-white flex items-center justify-between ${
          activeTab === "de"
            ? "bg-gradient-to-r from-primary to-red-700"
            : "bg-gradient-to-r from-orange-500 to-orange-600"
        }`}>
          <h2 className="text-lg font-bold">
            {activeTab === "de" ? "🇩🇪" : "🇳🇱"} {activeTab === "de" ? "Handzettel" : "Folder"} KW {currentKW} — Werbekreis 3.6
          </h2>
          <a
            href={trinkgutProspektUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            Auf trinkgut.de öffnen ↗
          </a>
        </div>

        {/* Trinkgut Prospekt Embed */}
        <div className="relative">
          <iframe
            key={`prospekt-${activeTab}-${currentKW}`}
            src={trinkgutProspektUrl}
            className="w-full border-0"
            style={{ height: "900px" }}
            title={`Trinkgut Handzettel KW ${currentKW} — Werbekreis 3.6`}
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
          {/* Overlay falls Embed blockiert wird */}
          <div className="absolute inset-0 flex items-center justify-center bg-white/95">
            <div className="text-center p-8 max-w-md">
              <span className="text-6xl block mb-4">📰</span>
              <h3 className="text-2xl font-bold text-secondary mb-3">
                {activeTab === "de" ? "Aktueller Handzettel" : "Huidige folder"}
              </h3>
              <p className="text-muted text-sm mb-2">
                KW {currentKW} — Werbekreis 3.6 — Goch und Umgebung
              </p>
              <p className="text-muted text-sm mb-6">
                {activeTab === "de"
                  ? "Alle aktuellen Angebote direkt auf trinkgut.de ansehen:"
                  : "Alle actuele aanbiedingen direct op trinkgut.de bekijken:"}
              </p>
              <a
                href={trinkgutProspektUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-8 py-4 text-white font-bold rounded-xl text-lg shadow-lg transition-all hover:scale-105 ${
                  activeTab === "de"
                    ? "bg-primary hover:bg-red-700 shadow-red-500/20"
                    : "bg-orange-500 hover:bg-orange-600 shadow-orange-500/20"
                }`}
              >
                📄 {activeTab === "de" ? "Handzettel öffnen" : "Folder openen"} ↗
              </a>
              <p className="text-xs text-muted mt-4">Öffnet trinkgut.de in einem neuen Tab</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-light rounded-xl p-6 text-center">
        <h3 className="font-bold text-secondary mb-2">Angebote gelten in unserem Markt in Goch</h3>
        <p className="text-muted text-sm mb-4">
          Jurgenstr. 20, 47574 Goch — Werbekreis 3.6
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/angebote" className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-red-700 transition-colors text-sm">
            Online-Angebote ansehen
          </Link>
          <a href="tel:02823418707" className="px-5 py-2.5 border-2 border-secondary text-secondary rounded-xl font-semibold hover:bg-secondary hover:text-white transition-colors text-sm">
            Anrufen: 02823-418707
          </a>
        </div>
      </div>
    </div>
  );
}
