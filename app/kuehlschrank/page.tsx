"use client";

import { useState, useCallback, useRef } from "react";
import Image from "next/image";

type KuehlschrankResult = {
  score: number;
  bewertung: string;
  empfehlungen: string[];
  roast: string;
};

function ScoreCircle({ score }: { score: number }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const offset = circumference - progress;

  const getColor = (s: number) => {
    if (s <= 3) return { stroke: "#EF4444", bg: "text-red-500", glow: "rgba(239,68,68,0.3)" };
    if (s <= 5) return { stroke: "#F59E0B", bg: "text-amber-500", glow: "rgba(245,158,11,0.3)" };
    if (s <= 7) return { stroke: "#EAB308", bg: "text-yellow-500", glow: "rgba(234,179,8,0.3)" };
    return { stroke: "#22C55E", bg: "text-green-500", glow: "rgba(34,197,94,0.3)" };
  };

  const { stroke, bg, glow } = getColor(score);

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg
        viewBox="0 0 180 180"
        className="w-full h-full transform -rotate-90"
        style={{ filter: `drop-shadow(0 0 20px ${glow})` }}
      >
        {/* Background circle */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="12"
        />
        {/* Progress circle */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-5xl font-black ${bg}`}>{score}</span>
        <span className="text-sm text-muted font-medium">von 10</span>
      </div>
    </div>
  );
}

function getScoreLabel(score: number): string {
  if (score <= 2) return "Katastrophe!";
  if (score <= 3) return "Da geht noch was...";
  if (score <= 5) return "Ausbaufaehig!";
  if (score <= 6) return "Ganz OK!";
  if (score <= 7) return "Solide Basis!";
  if (score <= 8) return "Sehr gut!";
  if (score <= 9) return "Fast perfekt!";
  return "Meister-Kuehlschrank!";
}

function getScoreEmoji(score: number): string {
  if (score <= 2) return "\u{1F62D}";
  if (score <= 3) return "\u{1F625}";
  if (score <= 5) return "\u{1F914}";
  if (score <= 6) return "\u{1F60F}";
  if (score <= 7) return "\u{1F44D}";
  if (score <= 8) return "\u{1F60E}";
  if (score <= 9) return "\u{1F929}";
  return "\u{1F451}";
}

export default function KuehlschrankPage() {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KuehlschrankResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Bitte lade ein Bild hoch (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Das Bild ist zu gross (max. 20 MB).");
      return;
    }
    setError(null);
    setResult(null);
    setImageFile(file);

    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragActive(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const analyzeImage = useCallback(async () => {
    if (!imageFile) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      const response = await fetch("/api/kuehlschrank", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Fehler: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ein Fehler ist aufgetreten."
      );
    } finally {
      setLoading(false);
    }
  }, [imageFile]);

  const resetAll = useCallback(() => {
    setImage(null);
    setImageFile(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const shareResult = useCallback(async () => {
    if (!result) return;
    const text = `Mein Kuehlschrank-Score: ${result.score}/10 ${getScoreEmoji(result.score)}\n"${result.roast}"\n\nGetestet bei trinkgut-jammers.de/kuehlschrank`;
    if (navigator.share) {
      try {
        await navigator.share({ text, title: "Kuehlschrank-Check" });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
      alert("In die Zwischenablage kopiert!");
    }
  }, [result]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/50 to-white">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-6">
        <div className="text-center animate-fade-in-up">
          <p className="text-sm font-semibold tracking-widest uppercase text-primary mb-2">
            KI-Analyse
          </p>
          <h1 className="text-3xl md:text-5xl font-extrabold text-secondary mb-3">
            <span className="text-4xl md:text-6xl mr-2">{"\u{1F9CA}"}</span>
            Kuehlschrank-Check
          </h1>
          <p className="text-muted max-w-xl mx-auto text-lg">
            Wie gut ist dein Kuehlschrank bestückt? Lade ein Foto hoch und
            unsere KI bewertet deinen Getraenkebestand!
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-12">
        {/* Upload Zone */}
        {!result && (
          <div className="mb-8">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => !image && inputRef.current?.click()}
              className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 overflow-hidden ${
                dragActive
                  ? "border-primary bg-red-50 scale-[1.02]"
                  : image
                  ? "border-border bg-white"
                  : "border-border bg-light hover:border-primary/50 hover:bg-red-50/30 cursor-pointer"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
              />

              {image ? (
                <div className="p-4">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                    <Image
                      src={image}
                      alt="Kuehlschrank-Foto"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex gap-3 mt-4 justify-center">
                    {!loading && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            analyzeImage();
                          }}
                          className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20 text-lg"
                        >
                          {"\u{1F52C}"} KI analysieren lassen
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            resetAll();
                          }}
                          className="px-4 py-3 bg-light hover:bg-border text-muted font-medium rounded-xl transition-colors"
                        >
                          Anderes Bild
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-16 px-8 text-center">
                  <div className="text-6xl mb-4">{"\u{1F4F7}"}</div>
                  <p className="text-lg font-semibold text-secondary mb-2">
                    Kuehlschrank-Foto hochladen
                  </p>
                  <p className="text-muted text-sm mb-4">
                    Drag & Drop oder klicke hier — JPG, PNG, WEBP (max. 20 MB)
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-border text-sm text-muted">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Datei auswaehlen
                  </div>
                </div>
              )}
            </div>

            {/* Loading Animation */}
            {loading && (
              <div className="mt-8 text-center animate-fade-in-up">
                <div className="inline-flex items-center gap-3 bg-white rounded-2xl border border-border px-8 py-6 shadow-lg">
                  <div className="flex gap-1.5">
                    <div
                      className="w-3 h-3 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <div
                      className="w-3 h-3 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <div
                      className="w-3 h-3 rounded-full bg-primary animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-secondary">
                      KI analysiert deinen Kuehlschrank...
                    </p>
                    <p className="text-sm text-muted">
                      Das dauert nur wenige Sekunden
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <p className="font-semibold">Fehler</p>
                <p>{error}</p>
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="space-y-6 animate-fade-in-up">
            {/* Score */}
            <div className="bg-white rounded-2xl border border-border p-8 text-center shadow-sm">
              <p className="text-sm font-semibold tracking-widest uppercase text-muted mb-4">
                Dein Ergebnis
              </p>
              <ScoreCircle score={result.score} />
              <p className="text-2xl font-bold text-secondary mt-4">
                {getScoreEmoji(result.score)} {getScoreLabel(result.score)}
              </p>
            </div>

            {/* Bewertung */}
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="font-bold text-secondary mb-2 flex items-center gap-2">
                <span className="text-xl">{"\u{1F4DD}"}</span> Bewertung
              </h3>
              <p className="text-muted leading-relaxed">{result.bewertung}</p>
            </div>

            {/* Roast */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6 shadow-sm">
              <h3 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                <span className="text-xl">{"\u{1F525}"}</span> Der Roast
              </h3>
              <p className="text-amber-900 font-medium text-lg italic">
                &ldquo;{result.roast}&rdquo;
              </p>
            </div>

            {/* Empfehlungen */}
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <h3 className="font-bold text-secondary mb-3 flex items-center gap-2">
                <span className="text-xl">{"\u{1F6D2}"}</span> Das fehlt in deinem Kuehlschrank
              </h3>
              <div className="grid gap-2">
                {result.empfehlungen.map((emp, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-light rounded-xl px-4 py-3"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-secondary font-medium">{emp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={shareResult}
                className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20"
              >
                {"\u{1F4E4}"} Mein Score teilen
              </button>
              <button
                onClick={resetAll}
                className="px-6 py-3 bg-white border border-border hover:bg-light text-secondary font-medium rounded-xl transition-colors"
              >
                {"\u{1F504}"} Nochmal testen
              </button>
            </div>

            {/* Mini image reminder */}
            {image && (
              <div className="flex justify-center">
                <div className="relative w-32 h-24 rounded-lg overflow-hidden border border-border">
                  <Image
                    src={image}
                    alt="Dein Kuehlschrank"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* How it works */}
        {!image && !result && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-secondary text-center mb-6">
              So funktioniert&apos;s
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: "\u{1F4F8}",
                  title: "1. Foto machen",
                  text: "Oeffne deinen Kuehlschrank und mach ein Foto.",
                },
                {
                  icon: "\u{1F916}",
                  title: "2. KI analysiert",
                  text: "Unsere KI bewertet deinen Getraenkebestand.",
                },
                {
                  icon: "\u{1F3AF}",
                  title: "3. Score & Tipps",
                  text: "Erhalte deinen Score plus passende Empfehlungen!",
                },
              ].map((step) => (
                <div
                  key={step.title}
                  className="bg-white rounded-xl border border-border p-5 text-center"
                >
                  <div className="text-4xl mb-3">{step.icon}</div>
                  <h3 className="font-bold text-secondary mb-1">{step.title}</h3>
                  <p className="text-sm text-muted">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
