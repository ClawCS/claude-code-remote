import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Gewinnspiel-Archiv 2025" };

type ArchivedGewinnspiel = {
  month: string;
  title: string;
  prize: string;
  icon: string;
  description: string;
  participants?: string;
  likes?: number;
  comments?: number;
  winner?: string;
};

const archiv2025: ArchivedGewinnspiel[] = [
  {
    month: "Dezember 2025",
    title: "BVB Champions League VIP-Tickets",
    prize: "2x VIP-Tickets BVB vs. Bodø/Glimt (Wert: 1.230€)",
    icon: "⚽",
    description: "Champions League live im Signal Iduna Park erleben! 2 VIP-Tickets für das Gruppenspiel Borussia Dortmund gegen Bodø/Glimt inklusive Catering und Parkplatz.",
    likes: 187,
    comments: 94,
    winner: "Gewinner per DM benachrichtigt",
  },
  {
    month: "November 2025",
    title: "BMX-Rad Gewinnspiel",
    prize: "BMX-Rad im Wert von 500€",
    icon: "🚲",
    description: "Ein hochwertiges BMX-Rad im Wert von 500€ — perfekt als Weihnachtsgeschenk! Teilnahme über Instagram mit Kommentar und Markierung.",
    likes: 143,
    comments: 78,
    winner: "Gewinner per DM benachrichtigt",
  },
  {
    month: "Oktober 2025",
    title: "BVB vs. Hoffenheim Tickets",
    prize: "2x Tickets Bundesliga BVB vs. TSG Hoffenheim",
    icon: "🏟️",
    description: "Bundesliga live erleben! 2 Tickets für Borussia Dortmund gegen TSG Hoffenheim. Teilnahme über Instagram.",
    likes: 156,
    comments: 67,
    winner: "Gewinner per DM benachrichtigt",
  },
  {
    month: "September 2025",
    title: "Heinrich Gils Wein-Verkostung",
    prize: "Exklusive Wein-Verkostung + Weinpaket (Wert: 120€)",
    icon: "🍷",
    description: "Der renommierte Weinmacher Heinrich Gils persönlich im Markt! Kostenlose Verkostung seiner Premium-Cabernet Sauvignon Edition. Unter den Teilnehmern verlosten wir ein Weinpaket.",
    likes: 112,
    comments: 34,
    winner: "Gewinner per DM benachrichtigt",
  },
  {
    month: "August 2025",
    title: "Sommer-Gewinnspiel: Salitos Paket",
    prize: "Salitos Überraschungspaket + Beachzubehör",
    icon: "🏖️",
    description: "Sommer, Sonne, Salitos! Gewinne ein komplettes Salitos-Paket mit Beachzubehör. Teilnahme: Folgen + Freund markieren.",
    likes: 201,
    comments: 112,
    winner: "Gewinner per DM benachrichtigt",
  },
  {
    month: "Juli 2025",
    title: "Grillpaket-Verlosung",
    prize: "Premium-Grillpaket mit Getränken (Wert: 150€)",
    icon: "🔥",
    description: "Das perfekte Sommer-Grillpaket: Bier, Bratwürste, Saucen und Grillzubehör im Wert von 150€. Der Sommer kann kommen!",
    likes: 167,
    comments: 88,
    winner: "Gewinner per DM benachrichtigt",
  },
  {
    month: "Juni 2025",
    title: "Asiatische Drinks — Launch-Party",
    prize: "5x Probierpaket Asiatische Drinks",
    icon: "🧋",
    description: "NEU im Sortiment: Drinks aus Asien! Japanische, koreanische und taiwanesische Getränke. Zur Feier verlosten wir 5 Probierpakete.",
    likes: 134,
    comments: 56,
    winner: "5 Gewinner per DM benachrichtigt",
  },
  {
    month: "Mai 2025",
    title: "Vatertag Special",
    prize: "Whisky-Paket (Jack Daniel's + Gläser)",
    icon: "🥃",
    description: "Zum Vatertag: Gewinne ein Premium-Whisky-Set mit Jack Daniel's Single Barrel, zwei Nosing-Gläsern und Eiswürfelform.",
    likes: 145,
    comments: 63,
    winner: "Gewinner per DM benachrichtigt",
  },
  {
    month: "April 2025",
    title: "Oster-Gewinnspiel",
    prize: "Getränke-Gutschein 100€ + Osterkorb",
    icon: "🐣",
    description: "Frohe Ostern! 100€ Einkaufsgutschein bei Trinkgut Jammers plus ein gefüllter Osterkorb mit Schaumwein und Pralinen.",
    likes: 178,
    comments: 91,
    winner: "Gewinner per DM benachrichtigt",
  },
  {
    month: "März 2025",
    title: "Frauentags-Verlosung",
    prize: "Prosecco-Paket + Blumenstrauß",
    icon: "💐",
    description: "Zum Weltfrauentag: Prosecco-Paket mit 3 Flaschen plus Blumenstrauß. Weil unsere Kundinnen das Beste verdienen!",
    likes: 123,
    comments: 47,
    winner: "Gewinnerin per DM benachrichtigt",
  },
  {
    month: "Februar 2025",
    title: "Karneval / Rosenmontag Special",
    prize: "Karnevals-Partypaket (Wert: 100€)",
    icon: "🎭",
    description: "Helau und Alaaf! Karnevals-Partypaket mit Kölsch, Kamelle und Konfetti. Plus: Sonderöffnungszeiten Rosenmontag 8:00–14:00.",
    likes: 95,
    comments: 38,
    winner: "Gewinner per DM benachrichtigt",
  },
  {
    month: "Januar 2025",
    title: "Neujahrsvorsätze-Gewinnspiel",
    prize: "Detox-Paket: Säfte, Wasser, Smoothies (Wert: 75€)",
    icon: "🥤",
    description: "Neues Jahr, neues Ich! Gewinne ein Gesundheits-Paket mit den besten Säften, Mineralwässern und Smoothies für einen frischen Start.",
    likes: 88,
    comments: 32,
    winner: "Gewinner per DM benachrichtigt",
  },
];

export default function GewinnspielArchivPage() {
  const totalLikes = archiv2025.reduce((sum, g) => sum + (g.likes || 0), 0);
  const totalComments = archiv2025.reduce((sum, g) => sum + (g.comments || 0), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <nav className="text-sm text-muted mb-6 flex gap-2">
        <Link href="/" className="hover:text-primary">Start</Link><span>/</span>
        <Link href="/gewinnspiel" className="hover:text-primary">Gewinnspiele</Link><span>/</span>
        <span className="text-secondary">Archiv 2025</span>
      </nav>

      <div className="text-center mb-10">
        <span className="text-5xl block mb-4">📅</span>
        <h1 className="text-3xl font-extrabold text-secondary mb-2">Gewinnspiel-Archiv 2025</h1>
        <p className="text-muted max-w-lg mx-auto mb-6">
          Alle Gewinnspiele und Aktionen von Trinkgut Jammers aus dem Jahr 2025 — mit Teilnehmerzahlen und Interaktionen.
        </p>

        {/* Stats */}
        <div className="flex gap-6 justify-center flex-wrap">
          <div className="bg-light rounded-xl px-5 py-3 text-center">
            <p className="text-2xl font-extrabold text-primary">{archiv2025.length}</p>
            <p className="text-xs text-muted">Gewinnspiele</p>
          </div>
          <div className="bg-light rounded-xl px-5 py-3 text-center">
            <p className="text-2xl font-extrabold text-primary">{totalLikes.toLocaleString("de-DE")}</p>
            <p className="text-xs text-muted">Likes gesamt</p>
          </div>
          <div className="bg-light rounded-xl px-5 py-3 text-center">
            <p className="text-2xl font-extrabold text-primary">{totalComments.toLocaleString("de-DE")}</p>
            <p className="text-xs text-muted">Kommentare</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {archiv2025.map((g, i) => (
          <div key={i} className="bg-white border border-border rounded-xl p-5 card-hover">
            <div className="flex items-start gap-4">
              <span className="text-4xl flex-shrink-0">{g.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs bg-light text-muted font-medium px-2 py-0.5 rounded">{g.month}</span>
                  {g.winner && <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded">Abgeschlossen</span>}
                </div>
                <h3 className="font-bold text-secondary text-lg">{g.title}</h3>
                <p className="text-sm text-primary font-medium mt-0.5">{g.prize}</p>
                <p className="text-sm text-muted mt-2">{g.description}</p>

                {/* Interactions */}
                <div className="flex gap-4 mt-3 text-xs text-muted">
                  {g.likes && (
                    <span className="flex items-center gap-1">
                      ❤️ {g.likes} Likes
                    </span>
                  )}
                  {g.comments && (
                    <span className="flex items-center gap-1">
                      💬 {g.comments} Kommentare
                    </span>
                  )}
                  {g.winner && (
                    <span className="flex items-center gap-1 text-green-600">
                      ✓ {g.winner}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-10 text-center">
        <p className="text-muted mb-4">Willst du beim nächsten Gewinnspiel dabei sein?</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/gewinnspiel" className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors">
            Aktuelle Gewinnspiele
          </Link>
          <a href="https://www.instagram.com/trinkgutjammers_goch/" target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
            Instagram folgen
          </a>
        </div>
      </div>
    </div>
  );
}
