"use client";

import { useRef, useState } from "react";

type FieldKey = "lebenslauf" | "foto" | "bewerbung" | "zeugnisse";

type FileSlot = {
  field: FieldKey;
  label: string;
  hint: string;
  icon: string;
  accept: string;
  multiple?: boolean;
  required?: boolean;
};

const FILE_SLOTS: FileSlot[] = [
  {
    field: "lebenslauf",
    label: "Lebenslauf",
    hint: "PDF oder DOC, max. 10 MB",
    icon: "📄",
    accept: ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  {
    field: "foto",
    label: "Foto",
    hint: "JPG, PNG oder WEBP, max. 10 MB",
    icon: "📸",
    accept: "image/jpeg,image/png,image/webp,image/heic,image/heif",
  },
  {
    field: "bewerbung",
    label: "Bewerbungsschreiben",
    hint: "PDF oder DOC, max. 10 MB",
    icon: "✉️",
    accept: ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  {
    field: "zeugnisse",
    label: "Zeugnisse",
    hint: "PDF oder Foto, mehrere moeglich, je max. 10 MB",
    icon: "🎓",
    accept: ".pdf,image/jpeg,image/png,image/webp,application/pdf",
    multiple: true,
  },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BewerbungPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    telefon: "",
    position: "",
    nachricht: "",
  });
  const [files, setFiles] = useState<Record<FieldKey, File[]>>({
    lebenslauf: [],
    foto: [],
    bewerbung: [],
    zeugnisse: [],
  });

  const fileInputRefs = useRef<Partial<Record<FieldKey, HTMLInputElement | null>>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileSelect = (
    field: FieldKey,
    e: React.ChangeEvent<HTMLInputElement>,
    multiple: boolean
  ) => {
    setUploadError(null);
    const selected = Array.from(e.target.files || []);
    // Groesse clientseitig validieren
    for (const f of selected) {
      if (f.size > MAX_FILE_SIZE) {
        setUploadError(`Datei "${f.name}" ist zu gross (max. 10 MB).`);
        return;
      }
    }
    setFiles((prev) => ({
      ...prev,
      [field]: multiple ? [...prev[field], ...selected] : selected,
    }));
  };

  const removeFile = (field: FieldKey, index: number) => {
    setFiles((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
    // Input zuruecksetzen, damit dieselbe Datei erneut gewaehlt werden kann
    const input = fileInputRefs.current[field];
    if (input) input.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!form.name || !form.email || !form.position) return;

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("name", form.name);
      data.append("email", form.email);
      data.append("telefon", form.telefon);
      data.append("position", form.position);
      data.append("nachricht", form.nachricht);
      for (const slot of FILE_SLOTS) {
        for (const f of files[slot.field]) {
          data.append(slot.field, f, f.name);
        }
      }

      const res = await fetch("/api/bewerbung", { method: "POST", body: data });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json.success) {
        throw new Error(json.error || `Upload fehlgeschlagen (HTTP ${res.status})`);
      }

      setSubmitted(true);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Unbekannter Fehler beim Upload.");
    } finally {
      setSubmitting(false);
    }
  };

  const totalFiles = Object.values(files).reduce((s, arr) => s + arr.length, 0);

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16 text-center">
        <span className="text-6xl block mb-4">🎉</span>
        <h2 className="text-2xl font-bold text-secondary mb-2">Bewerbung gesendet!</h2>
        <p className="text-muted mb-2">
          Vielen Dank, {form.name}! Wir melden uns so schnell wie moeglich bei dir.
        </p>
        {totalFiles > 0 && (
          <p className="text-muted text-sm mb-6">
            {totalFiles} {totalFiles === 1 ? "Anhang" : "Anhaenge"} erfolgreich hochgeladen.
          </p>
        )}
        <button
          onClick={() => {
            setSubmitted(false);
            setForm({ name: "", email: "", telefon: "", position: "", nachricht: "" });
            setFiles({ lebenslauf: [], foto: [], bewerbung: [], zeugnisse: [] });
          }}
          className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
        >
          Weitere Bewerbung senden
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="page-hero-banner py-16 md:py-24">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <nav className="text-sm text-white/60 mb-4">
            <a href="/" className="hover:text-white">Home</a>{" "}
            <span className="mx-1">/</span>{" "}
            <span className="text-white">Jobs</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-3">
            Bewirb dich bei uns!
          </h1>
          <p className="text-white/80 max-w-lg mx-auto text-lg">
            Werde Teil unseres Teams in Goch
          </p>
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* Info Box */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6 mb-8">
          <h3 className="font-bold text-secondary mb-3">Was wir bieten:</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm text-secondary">
              <span className="text-lg">🤝</span>
              <span>Familiäres Arbeitsumfeld</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-secondary">
              <span className="text-lg">💰</span>
              <span>Faire Bezahlung</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-secondary">
              <span className="text-lg">🕐</span>
              <span>Flexible Arbeitszeiten</span>
            </div>
          </div>
        </div>

        {/* Team Quote */}
        <div className="bg-white border border-border rounded-xl p-6 mb-8">
          <blockquote className="text-center">
            <p className="text-secondary italic text-sm leading-relaxed">
              &ldquo;Wir sind ein engagiertes Team, das mit Leidenschaft für Getränke arbeitet.&rdquo;
            </p>
            <footer className="mt-3 text-xs text-muted font-medium">— Niko &amp; Sven</footer>
          </blockquote>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-border rounded-xl p-6 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-secondary mb-1">
              Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="Vor- und Nachname"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-secondary mb-1">
              E-Mail *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="deine@email.de"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="telefon" className="block text-sm font-medium text-secondary mb-1">
              Telefon
            </label>
            <input
              id="telefon"
              name="telefon"
              type="tel"
              value={form.telefon}
              onChange={handleChange}
              placeholder="0123 456789"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="position" className="block text-sm font-medium text-secondary mb-1">
              Position *
            </label>
            <select
              id="position"
              name="position"
              required
              value={form.position}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
            >
              <option value="">Bitte wählen...</option>
              <option value="verkauf">Verkauf</option>
              <option value="lager">Lager</option>
              <option value="aushilfe">Aushilfe</option>
              <option value="ausbildung">Ausbildung</option>
            </select>
          </div>

          <div>
            <label htmlFor="nachricht" className="block text-sm font-medium text-secondary mb-1">
              Nachricht
            </label>
            <textarea
              id="nachricht"
              name="nachricht"
              rows={4}
              value={form.nachricht}
              onChange={handleChange}
              placeholder="Erzähl uns etwas über dich..."
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>

          {/* Anhaenge */}
          <div className="border-t border-border pt-5">
            <h3 className="font-semibold text-secondary mb-1 flex items-center gap-2">
              <span>📎</span> Anhaenge
            </h3>
            <p className="text-xs text-muted mb-4">
              Lade deine Bewerbungsunterlagen hoch. Optional, aber empfohlen. Max. 10 MB pro Datei.
            </p>

            <div className="space-y-4">
              {FILE_SLOTS.map((slot) => {
                const selected = files[slot.field];
                const inputId = `file-${slot.field}`;
                return (
                  <div key={slot.field} className="border border-border rounded-lg p-4 bg-gray-50/50">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{slot.icon}</span>
                        <div>
                          <label
                            htmlFor={inputId}
                            className="block text-sm font-medium text-secondary cursor-pointer"
                          >
                            {slot.label}
                          </label>
                          <p className="text-xs text-muted">{slot.hint}</p>
                        </div>
                      </div>
                      <label
                        htmlFor={inputId}
                        className="shrink-0 px-3 py-1.5 border border-primary text-primary hover:bg-primary hover:text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors"
                      >
                        {slot.multiple ? "Dateien waehlen" : selected.length > 0 ? "Aendern" : "Datei waehlen"}
                      </label>
                    </div>
                    <input
                      ref={(el) => {
                        fileInputRefs.current[slot.field] = el;
                      }}
                      id={inputId}
                      type="file"
                      accept={slot.accept}
                      multiple={slot.multiple}
                      onChange={(e) => handleFileSelect(slot.field, e, !!slot.multiple)}
                      className="sr-only"
                    />

                    {selected.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {selected.map((f, i) => (
                          <li
                            key={`${f.name}-${i}`}
                            className="flex items-center justify-between gap-2 text-xs bg-white border border-border rounded-md px-3 py-1.5"
                          >
                            <span className="truncate text-secondary">{f.name}</span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-muted">{formatBytes(f.size)}</span>
                              <button
                                type="button"
                                onClick={() => removeFile(slot.field, i)}
                                className="text-red-500 hover:text-red-700 font-bold"
                                aria-label="Entfernen"
                              >
                                ×
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>

            {totalFiles > 0 && (
              <p className="text-xs text-muted mt-3">
                {totalFiles} {totalFiles === 1 ? "Datei ausgewaehlt" : "Dateien ausgewaehlt"}
              </p>
            )}
          </div>

          {uploadError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {uploadError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors text-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Wird gesendet..." : "Bewerbung absenden"}
          </button>

          <p className="text-xs text-muted text-center">
            Mit dem Absenden erklaerst du dich einverstanden, dass wir deine Daten und Anhaenge zur Bearbeitung deiner Bewerbung speichern.
          </p>
        </form>
      </div>
    </>
  );
}
