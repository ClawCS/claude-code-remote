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

      {/* Prospekt Anzeige */}
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
            href={pdfPath}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF öffnen
          </a>
        </div>

        {/* PDF Embed */}
        <div className="relative">
          <iframe
            key={`${activeTab}-${currentKW}`}
            src={pdfPath}
            className="w-full border-0"
            style={{ height: "900px" }}
            title={`Handzettel KW ${currentKW} ${activeTab.toUpperCase()}`}
          />
          {/* Fallback wenn PDF nicht existiert */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur rounded-2xl p-8 text-center shadow-xl hidden" id={`fallback-${activeTab}-${currentKW}`}>
              <span className="text-5xl block mb-4">📄</span>
              <h3 className="text-xl font-bold text-secondary mb-2">Handzettel KW {currentKW} wird geladen...</h3>
              <p className="text-muted text-sm">
                Falls der Prospekt nicht angezeigt wird, nutze den Button oben um das PDF direkt zu öffnen.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Link zu Trinkgut.de als Fallback */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm mb-8">
        <div className="bg-gradient-to-r from-gray-700 to-gray-900 p-6 text-white text-center">
          <h2 className="text-lg font-bold mb-2">Auch online verfügbar</h2>
          <p className="text-white/70 text-sm mb-4">Den aktuellen Prospekt findest du auch direkt bei trinkgut.de</p>
          <a
            href="https://www.trinkgut.de/angebote/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-secondary font-bold rounded-xl hover:bg-gray-100 transition-colors"
          >
            Auf trinkgut.de ansehen ↗
          </a>
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
