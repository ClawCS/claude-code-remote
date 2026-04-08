"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import ProspektViewer from "@/components/ProspektViewer";

type HandzettelPage = {
  number: number;
  imageUrl: string;
  thumbnailUrl: string;
};

type HandzettelData = {
  catalogId: string;
  catalogVersion: string;
  storeId: string;
  werbekreis: string;
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

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function HandzettelPage() {
  const currentKW = getISOCalendarWeek();
  const [data, setData] = useState<HandzettelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHandzettel();
  }, []);

  async function fetchHandzettel(forceRefresh = false) {
    try {
      setLoading(true);
      setError(null);
      const url = `/api/handzettel/fetch${forceRefresh ? "?refresh=true" : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Fehler ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchHandzettel(true);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-2">
          Wochenangebote
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-secondary mb-3">
          Aktueller Handzettel
        </h1>
        <p className="text-muted max-w-lg mx-auto">
          Unser aktueller Prospekt mit allen Angeboten der Woche. Blaettere durch
          alle Seiten oder oeffne den Handzettel im Vollbild.
        </p>
      </div>

      {/* KW + Werbekreis Info */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-secondary text-white rounded-xl font-bold">
          <span className="text-sm">📅</span>
          KW {data?.kw ?? currentKW}
          {data?.weekStart && data?.weekEnd && (
            <span className="text-xs font-normal opacity-70">
              — {formatDate(data.weekStart)} bis {formatDate(data.weekEnd)}
            </span>
          )}
        </div>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold">
          <span className="text-sm">📍</span>
          Werbekreis {data?.werbekreis ?? "3.6"}
        </div>
      </div>

      {/* Refresh-Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted hover:text-secondary bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {refreshing ? "Aktualisiere..." : "Handzettel aktualisieren"}
        </button>
      </div>

      {/* Loading */}
      {loading && !data && (
        <div className="text-center py-16">
          <div className="inline-block w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-muted">Handzettel wird geladen...</p>
        </div>
      )}

      {/* Error */}
      {error && !data && (
        <div className="text-center py-16">
          <span className="text-5xl block mb-4">⚠️</span>
          <p className="text-red-600 font-medium mb-2">Fehler beim Laden</p>
          <p className="text-muted text-sm mb-4">{error}</p>
          <button
            onClick={() => fetchHandzettel(true)}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Erneut versuchen
          </button>
        </div>
      )}

      {/* Prospekt Viewer */}
      {data && (
        <>
          {data.status === "ok" && data.pages.length > 0 ? (
            <ProspektViewer
              pages={data.pages}
              kw={data.kw}
              werbekreis={data.werbekreis}
              pdfUrl={data.pdfUrl}
              fallbackUrl={data.viewerUrl}
            />
          ) : (
            /* Fallback: Handzettel wird geladen / Retry */
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mb-8">
              <div className="bg-gradient-to-r from-primary to-red-700 p-4 text-white">
                <h2 className="text-lg font-bold">
                  Handzettel KW {data.kw} — Werbekreis {data.werbekreis}
                </h2>
              </div>

              <div className="p-12 text-center">
                <span className="text-6xl block mb-4">📰</span>
                <h3 className="text-2xl font-bold text-secondary mb-3">
                  Handzettel wird vorbereitet
                </h3>
                <p className="text-muted text-sm mb-2">
                  KW {data.kw} — Werbekreis {data.werbekreis} — Goch und Umgebung
                </p>
                <p className="text-muted text-sm mb-6">
                  Der Handzettel wird gerade vom Server abgerufen. Bitte versuche es in wenigen Minuten erneut.
                </p>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-red-700 text-white font-bold rounded-xl text-lg shadow-lg transition-all hover:scale-105 disabled:opacity-50"
                >
                  {refreshing ? "Wird geladen..." : "Erneut laden"}
                </button>
              </div>
            </div>
          )}

          {/* Letzte Aktualisierung */}
          {data.fetchedAt && (
            <p className="text-center text-xs text-muted mt-4">
              Zuletzt aktualisiert:{" "}
              {new Date(data.fetchedAt).toLocaleString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" Uhr"}
            </p>
          )}
        </>
      )}

      {/* Info-Footer */}
      <div className="bg-gray-50 rounded-xl p-6 text-center mt-8">
        <h3 className="font-bold text-secondary mb-2">
          Angebote gelten in unserem Markt in Goch
        </h3>
        <p className="text-muted text-sm mb-4">
          Jurgenstr. 20, 47574 Goch — Werbekreis 3.6
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/angebote"
            className="px-5 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-red-700 transition-colors text-sm"
          >
            Wochenangebote ansehen
          </Link>
          <a
            href="tel:02823418707"
            className="px-5 py-2.5 border-2 border-secondary text-secondary rounded-xl font-semibold hover:bg-secondary hover:text-white transition-colors text-sm"
          >
            Anrufen: 02823-418707
          </a>
        </div>
      </div>

      {/* Auto-Update Hinweis */}
      <p className="text-center text-xs text-muted mt-6">
        Der Handzettel wird jeden Sonntag um 17:00 Uhr automatisch aktualisiert.
      </p>
    </div>
  );
}
