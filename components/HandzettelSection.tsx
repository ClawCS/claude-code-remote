"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import ScrollReveal from "@/components/ScrollReveal";

type DEEntry = { kw: number; file: string; type: "pdf" | "image" };
type NLEntry = { kw: number; region: string; file: string; type: "pdf" | "image" };
type Manifest = { generated: string; de: DEEntry[]; nl: NLEntry[] };

function getISOWeek(d: Date): number {
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getVisibleKW(): number {
  const now = new Date();
  const berlin = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Berlin" })
  );
  const week = getISOWeek(berlin);
  const isSunday = berlin.getDay() === 0;
  const hour = berlin.getHours();
  if (isSunday && hour >= 16) return week + 1;
  return week;
}

export default function HandzettelSection() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"de" | "nl">("de");
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const visibleKW = getVisibleKW();

  useEffect(() => {
    fetch("/handzettel/manifest.json")
      .then((r) => r.json())
      .then((m: Manifest) => setManifest(m))
      .catch(() => {});
  }, []);

  if (!manifest) return null;

  const deEntries = manifest.de.filter((e) => e.kw <= visibleKW);
  const nlEntries = manifest.nl.filter((e) => e.kw <= visibleKW);

  const deCurrent = deEntries[0] ?? null;
  const deArchive = deEntries.slice(1);

  const nlByRegion: Record<string, NLEntry[]> = {};
  for (const e of nlEntries) {
    (nlByRegion[e.region] ??= []).push(e);
  }
  const nlRegions = Object.keys(nlByRegion).sort();

  const hasDE = deEntries.length > 0;
  const hasNL = nlEntries.length > 0;

  if (!hasDE && !hasNL) return null;

  return (
    <>
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-24">
        <ScrollReveal className="text-center mb-10">
          <p className="text-sm font-semibold tracking-widest uppercase text-[#DC2626] mb-2">
            {t("home.handzettel.label")}
          </p>
          <h2
            className="text-2xl md:text-3xl font-extrabold text-[#1F2937] section-accent-center"
            style={{ textWrap: "balance" }}
          >
            {t("home.handzettel.title")}
          </h2>
          <p className="text-muted mt-3 max-w-xl mx-auto">
            {t("home.handzettel.subtitle")}
          </p>
        </ScrollReveal>

        {/* Tabs */}
        {hasDE && hasNL && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setTab("de")}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  tab === "de"
                    ? "bg-white text-[#1F2937] shadow-sm"
                    : "text-muted hover:text-[#1F2937]"
                }`}
              >
                {t("home.handzettel.tab.de")}
              </button>
              <button
                onClick={() => setTab("nl")}
                className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  tab === "nl"
                    ? "bg-white text-[#1F2937] shadow-sm"
                    : "text-muted hover:text-[#1F2937]"
                }`}
              >
                {t("home.handzettel.tab.nl")}
              </button>
            </div>
          </div>
        )}

        {/* DE Tab */}
        {tab === "de" && hasDE && (
          <ScrollReveal>
            {deCurrent && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white border border-[#F0D5CF]/60 rounded-2xl overflow-hidden shadow-sm">
                  <div className="relative bg-gradient-to-br from-[#DC2626] via-[#B91C1C] to-[#7F1D1D] p-8 text-center">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.5),transparent_60%)]" />
                    <span className="relative text-7xl drop-shadow-lg">📰</span>
                    <div className="relative mt-4">
                      <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold rounded-full mb-2">
                        {t("home.handzettel.current")}
                      </span>
                      <h3 className="text-xl font-extrabold text-white">
                        Trinkgut Handzettel — {t("home.handzettel.kw")} {deCurrent.kw}
                      </h3>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                      href={deCurrent.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold rounded-xl transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      {t("home.handzettel.openPdf")}
                    </a>
                    <a
                      href={deCurrent.file}
                      download
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#1F2937] text-[#1F2937] hover:bg-[#1F2937] hover:text-white font-bold rounded-xl transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {t("home.handzettel.download")}
                    </a>
                  </div>
                </div>

                {/* DE Archive */}
                {deArchive.length > 0 && (
                  <div className="mt-6">
                    <button
                      onClick={() => setArchiveOpen(!archiveOpen)}
                      className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-bold text-[#1F2937] transition-colors"
                    >
                      <span>{t("home.handzettel.archive")} ({deArchive.length})</span>
                      <svg
                        className={`w-5 h-5 transition-transform ${archiveOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {archiveOpen && (
                      <div className="mt-2 space-y-2">
                        {deArchive.map((entry) => (
                          <a
                            key={entry.kw}
                            href={entry.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 px-5 py-3 bg-white border border-border/60 rounded-xl hover:border-[#DC2626]/30 transition-colors"
                          >
                            <span className="text-2xl">📄</span>
                            <span className="font-medium text-[#1F2937]">
                              {t("home.handzettel.kw")} {entry.kw}
                            </span>
                            <span className="ml-auto text-xs text-muted uppercase">{entry.type}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </ScrollReveal>
        )}

        {/* NL Tab */}
        {tab === "nl" && hasNL && (
          <ScrollReveal>
            <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {nlRegions.map((region) => {
                const entries = nlByRegion[region];
                const current = entries[0];
                const archive = entries.slice(1);
                return (
                  <div
                    key={region}
                    className="bg-white border border-[#F0D5CF]/60 rounded-2xl overflow-hidden shadow-sm"
                  >
                    <div className="p-4 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white">
                      <h3 className="font-extrabold text-lg">{region}</h3>
                      <p className="text-sm text-white/80">
                        {t("home.handzettel.kw")} {current.kw} — {t("home.handzettel.current")}
                      </p>
                    </div>
                    {current.type === "image" ? (
                      <button
                        onClick={() => setLightbox(current.file)}
                        className="relative w-full aspect-[3/4] cursor-zoom-in group"
                      >
                        <Image
                          src={current.file}
                          alt={`${region} ${t("home.handzettel.kw")} ${current.kw}`}
                          fill
                          sizes="(max-width: 640px) 100vw, 50vw"
                          className="object-contain bg-gray-50 group-hover:brightness-95 transition-all"
                          unoptimized
                        />
                        <span className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/60 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          {t("home.handzettel.enlarge")} 🔍
                        </span>
                      </button>
                    ) : (
                      <div className="p-5 text-center">
                        <a
                          href={current.file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white font-bold rounded-xl transition-colors"
                        >
                          {t("home.handzettel.openPdf")}
                        </a>
                      </div>
                    )}
                    {archive.length > 0 && (
                      <div className="p-4 border-t border-border/40">
                        <p className="text-xs text-muted mb-2">{t("home.handzettel.archive")}</p>
                        <div className="space-y-1">
                          {archive.map((entry) => (
                            <a
                              key={entry.kw}
                              href={entry.file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-[#1F2937] transition-colors"
                            >
                              <span>📄</span>
                              <span>{t("home.handzettel.kw")} {entry.kw}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollReveal>
        )}

        {/* Keine Einträge im aktiven Tab */}
        {tab === "de" && !hasDE && (
          <p className="text-center text-muted py-8">{t("home.handzettel.noFlyers")}</p>
        )}
        {tab === "nl" && !hasNL && (
          <p className="text-center text-muted py-8">{t("home.handzettel.noFlyers")}</p>
        )}

        {/* Link zur Handzettel-Seite */}
        <div className="text-center mt-10">
          <Link
            href="/handzettel"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1F2937] hover:bg-[#111827] text-white font-bold rounded-xl shadow-lg transition-colors"
          >
            {t("home.handzettel.allOffers")}
          </Link>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-xl transition-colors"
          >
            ✕
          </button>
          <div className="relative w-full max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={lightbox}
              alt="Handzettel"
              width={1200}
              height={1600}
              className="object-contain w-full h-auto max-h-[90vh] rounded-lg"
              unoptimized
            />
          </div>
        </div>
      )}
    </>
  );
}
