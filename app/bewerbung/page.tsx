"use client";

import { useState } from "react";

export default function BewerbungPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    telefon: "",
    position: "",
    nachricht: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name && form.email && form.position) {
      // Save to localStorage
      const existing = JSON.parse(localStorage.getItem("trinkgut-bewerbungen") || "[]");
      existing.push({ ...form, date: new Date().toISOString() });
      localStorage.setItem("trinkgut-bewerbungen", JSON.stringify(existing));

      // Open mailto with form data
      const subject = encodeURIComponent(`Bewerbung: ${form.position} - ${form.name}`);
      const body = encodeURIComponent(
        `Neue Bewerbung über die Website:\n\n` +
        `Name: ${form.name}\n` +
        `E-Mail: ${form.email}\n` +
        `Telefon: ${form.telefon || "Nicht angegeben"}\n` +
        `Position: ${form.position}\n` +
        `Nachricht: ${form.nachricht || "Keine Nachricht"}\n\n` +
        `Gesendet am: ${new Date().toLocaleString("de-DE")}`
      );
      window.open(`mailto:jammers-goch@trinkgut.de?subject=${subject}&body=${body}`, "_self");

      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16 text-center">
        <span className="text-6xl block mb-4">🎉</span>
        <h2 className="text-2xl font-bold text-secondary mb-2">Bewerbung gesendet!</h2>
        <p className="text-muted mb-6">
          Vielen Dank, {form.name}! Wir melden uns so schnell wie möglich bei dir.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setForm({ name: "", email: "", telefon: "", position: "", nachricht: "" });
          }}
          className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
        >
          Weitere Bewerbung senden
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-10">
        <span className="text-5xl block mb-4">👋</span>
        <h1 className="text-3xl font-bold text-secondary mb-2">Bewirb dich bei Trinkgut Jammers!</h1>
        <p className="text-muted text-lg">Werde Teil unseres Teams in Goch</p>
      </div>

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
          <footer className="mt-3 text-xs text-muted font-medium">
            — Niko &amp; Sven
          </footer>
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

        <button
          type="submit"
          className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors text-lg"
        >
          Bewerbung absenden
        </button>
      </form>
    </div>
  );
}
