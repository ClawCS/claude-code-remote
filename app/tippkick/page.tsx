"use client";

import { useState, useEffect } from "react";

type Match = {
  id: number;
  home: string;
  away: string;
  date: string;
  group: string;
  result?: string;
};

type Tip = {
  matchId: number;
  homeGoals: number;
  awayGoals: number;
};

const upcomingMatches: Match[] = [
  { id: 1, home: "Deutschland", away: "Japan", date: "Mi, 11.06.", group: "Gruppe E" },
  { id: 2, home: "Brasilien", away: "Schweiz", date: "Do, 12.06.", group: "Gruppe G" },
  { id: 3, home: "Spanien", away: "Niederlande", date: "Do, 12.06.", group: "Gruppe H" },
  { id: 4, home: "Frankreich", away: "Australien", date: "Fr, 13.06.", group: "Gruppe D" },
  { id: 5, home: "Argentinien", away: "Kanada", date: "Fr, 13.06.", group: "Gruppe A" },
  { id: 6, home: "England", away: "USA", date: "Sa, 14.06.", group: "Gruppe B" },
];

const leaderboard = [
  { rank: 1, name: "MaxBier99", points: 42, trend: "\u2191" },
  { rank: 2, name: "K\u00f6lschFan", points: 39, trend: "\u2191" },
  { rank: 3, name: "PilsProfi", points: 37, trend: "\u2193" },
  { rank: 4, name: "HopfenHeld", points: 35, trend: "\u2192" },
  { rank: 5, name: "BierBaron", points: 33, trend: "\u2191" },
  { rank: 6, name: "GoldenGoal", points: 31, trend: "\u2193" },
  { rank: 7, name: "StadionKing", points: 29, trend: "\u2192" },
  { rank: 8, name: "Torj\u00e4gerTom", points: 27, trend: "\u2191" },
];

function Countdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date("2026-06-11T00:00:00+02:00").getTime();
    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-gradient-to-r from-secondary to-gray-800 rounded-xl p-5 mb-6 text-white text-center">
      <p className="text-sm font-medium mb-2 opacity-80">Countdown zur WM 2026</p>
      <div className="flex justify-center gap-4">
        {[
          { value: timeLeft.days, label: "Tage" },
          { value: timeLeft.hours, label: "Std" },
          { value: timeLeft.minutes, label: "Min" },
          { value: timeLeft.seconds, label: "Sek" },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center">
            <span className="text-3xl font-bold tabular-nums">{String(item.value).padStart(2, "0")}</span>
            <span className="text-xs opacity-70">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TippkickPage() {
  const [tips, setTips] = useState<Tip[]>(
    upcomingMatches.map((m) => ({ matchId: m.id, homeGoals: 0, awayGoals: 0 }))
  );
  const [submitted, setSubmitted] = useState(false);
  const [username, setUsername] = useState("");
  const [registered, setRegistered] = useState(false);

  const updateTip = (matchId: number, side: "home" | "away", delta: number) => {
    setTips((prev) =>
      prev.map((t) => {
        if (t.matchId !== matchId) return t;
        const key = side === "home" ? "homeGoals" : "awayGoals";
        return { ...t, [key]: Math.max(0, Math.min(9, t[key] + delta)) };
      })
    );
  };

  if (!registered) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-8">
          <span className="text-6xl block mb-4">🏆</span>
          <h1 className="text-3xl font-bold text-secondary mb-2">WM 2026 Tippspiel</h1>
          <p className="text-muted">
            Tippe die WM-Ergebnisse und gewinne fette Preise!
          </p>
        </div>

        <Countdown />

        {/* Prizes */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 mb-6 text-secondary">
          <h3 className="font-bold text-center mb-3">🏆 WM-Preise</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3 bg-white/80 rounded-lg p-3">
              <span className="text-2xl">🥇</span>
              <div>
                <p className="font-bold">1. Platz</p>
                <p className="text-sm">1.000 € Reisegutschein</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/60 rounded-lg p-3">
              <span className="text-2xl">🥈</span>
              <div>
                <p className="font-bold">2. Platz</p>
                <p className="text-sm">PlayStation 5 Pro + EA Sports FC (FIFA)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/40 rounded-lg p-3">
              <span className="text-2xl">🥉</span>
              <div>
                <p className="font-bold">3. Platz</p>
                <p className="text-sm">300 € Einkaufsgutschein bei Trinkgut Jammers</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-border rounded-xl p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Spielername *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="z.B. BierBaron42"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">E-Mail *</label>
              <input
                type="email"
                placeholder="deine@email.de"
                className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <button
              onClick={() => username && setRegistered(true)}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
            >
              Mitmachen
            </button>
          </div>
          <div className="mt-6 p-4 bg-light rounded-lg">
            <h3 className="font-semibold text-secondary text-sm mb-2">Punktesystem:</h3>
            <ul className="text-xs text-muted space-y-1">
              <li>3 Punkte – Exaktes Ergebnis</li>
              <li>1 Punkt – Richtige Tendenz (Sieg/Unentschieden)</li>
              <li>0 Punkte – Falsch getippt</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16 text-center">
        <span className="text-6xl block mb-4">✅</span>
        <h2 className="text-2xl font-bold text-secondary mb-2">Tipps abgegeben!</h2>
        <p className="text-muted mb-6">
          Viel Glück, {username}! Die Ergebnisse werden nach den Spielen ausgewertet.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
        >
          Tipps bearbeiten
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-secondary">🏆 WM 2026 Tippspiel</h1>
          <p className="text-muted">Gruppenphase – Deine Tipps, {username}</p>
        </div>
      </div>

      <Countdown />

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Matches */}
        <div className="lg:col-span-2 space-y-3">
          {upcomingMatches.map((match) => {
            const tip = tips.find((t) => t.matchId === match.id)!;
            return (
              <div key={match.id} className="bg-white border border-border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted">{match.date}</p>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{match.group}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex-1 text-right font-medium text-secondary text-sm">{match.home}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateTip(match.id, "home", -1)} className="w-7 h-7 rounded bg-light text-sm font-bold hover:bg-border">-</button>
                    <span className="w-8 text-center font-bold text-lg">{tip.homeGoals}</span>
                    <button onClick={() => updateTip(match.id, "home", 1)} className="w-7 h-7 rounded bg-light text-sm font-bold hover:bg-border">+</button>
                  </div>
                  <span className="text-muted font-bold">:</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateTip(match.id, "away", -1)} className="w-7 h-7 rounded bg-light text-sm font-bold hover:bg-border">-</button>
                    <span className="w-8 text-center font-bold text-lg">{tip.awayGoals}</span>
                    <button onClick={() => updateTip(match.id, "away", 1)} className="w-7 h-7 rounded bg-light text-sm font-bold hover:bg-border">+</button>
                  </div>
                  <span className="flex-1 font-medium text-secondary text-sm">{match.away}</span>
                </div>
              </div>
            );
          })}
          <button
            onClick={() => setSubmitted(true)}
            className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors text-lg mt-4"
          >
            Tipps abgeben
          </button>
        </div>

        {/* Leaderboard */}
        <div className="bg-white border border-border rounded-xl p-5">
          <h2 className="font-bold text-secondary mb-4">🏆 Rangliste</h2>
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.rank}
                className={`flex items-center gap-3 p-2 rounded-lg text-sm ${
                  entry.rank <= 3 ? "bg-amber-50" : ""
                }`}
              >
                <span className="w-6 text-center font-bold text-muted">
                  {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
                </span>
                <span className="flex-1 font-medium text-secondary">{entry.name}</span>
                <span className="text-xs text-muted">{entry.trend}</span>
                <span className="font-bold text-primary">{entry.points} Pkt.</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
