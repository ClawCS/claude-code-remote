"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // Save to localStorage
      const existing = JSON.parse(localStorage.getItem("trinkgut-newsletter") || "[]");
      existing.push({ email, date: new Date().toISOString() });
      localStorage.setItem("trinkgut-newsletter", JSON.stringify(existing));

      // Open mailto
      const subject = encodeURIComponent("Newsletter-Anmeldung");
      const body = encodeURIComponent(`Neue Newsletter-Anmeldung:\n\nE-Mail: ${email}\nDatum: ${new Date().toLocaleString("de-DE")}`);
      window.open(`mailto:hanna.thewald@trinkgut-jammers.de?subject=${subject}&body=${body}`, "_self");

      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <span className="text-4xl block mb-3">✅</span>
        <p className="font-bold text-green-800 text-lg">{t("newsletter.success")}</p>
        <p className="text-sm text-green-700 mt-1">{t("newsletter.successText")}</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-8 md:p-10 text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 opacity-10 text-[8rem] leading-none select-none">📬</div>

      <div className="relative max-w-xl">
        <p className="text-sm font-semibold tracking-widest uppercase text-white/50 mb-2">{t("newsletter.label")}</p>
        <h3 className="text-2xl md:text-3xl font-extrabold mb-2">
          {t("newsletter.title")}
        </h3>
        <p className="text-white/70 mb-6 text-sm">
          {t("newsletter.text")}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("newsletter.placeholder")}
            className="flex-1 px-4 py-3 rounded-xl text-secondary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-accent hover:bg-accent-dark text-secondary font-bold rounded-xl transition-colors whitespace-nowrap text-sm btn-hover"
          >
            {t("btn.anmelden")}
          </button>
        </form>
        <p className="text-xs text-white/40 mt-3">
          {t("newsletter.privacy")}
        </p>
      </div>
    </div>
  );
}
