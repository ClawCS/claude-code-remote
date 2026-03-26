"use client";

import { useState, useEffect } from "react";
import { points, getLevel, getLevelColor, getLevelIcon, getNextLevelThreshold, type CommunityUser, type Level } from "@/lib/points";

export default function CommunityPage() {
  const [user, setUser] = useState<CommunityUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [leaderboard, setLeaderboard] = useState<{ name: string; points: number; level: Level }[]>([]);
  const [activeTab, setActiveTab] = useState<"leaderboard" | "profil">("leaderboard");

  useEffect(() => {
    const u = points.getUser();
    setUser(u);
    if (!u) setShowRegister(true);
    setLeaderboard(points.getLeaderboard());

    // daily visit
    points.checkDailyVisit();

    const handler = () => {
      setUser(points.getUser());
      setLeaderboard(points.getLeaderboard());
    };
    window.addEventListener("trinkgut-points-change", handler);
    return () => window.removeEventListener("trinkgut-points-change", handler);
  }, []);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    const u = points.register(name.trim(), email.trim());
    setUser(u);
    setShowRegister(false);
    setLeaderboard(points.getLeaderboard());
  };

  const userLevel = user ? getLevel(user.points) : "Bronze";
  const nextLevel = user ? getNextLevelThreshold(user.points) : { next: "Silber" as Level, threshold: 101 };
  const progressPercent = user
    ? Math.min(100, (user.points / nextLevel.threshold) * 100)
    : 0;

  return (
    <>
    {/* Red Hero Banner */}
    <div className="page-hero-banner py-16 md:py-24">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <nav className="text-sm text-white/60 mb-4"><a href="/" className="hover:text-white">Home</a> <span className="mx-1">/</span> <span className="text-white">Community</span></nav>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-3">Trinkgut Jammers Community</h1>
        <p className="text-white/80 max-w-lg mx-auto text-lg">
          Sammle Punkte, steige im Level auf und werde Monatssieger!
        </p>
      </div>
    </div>
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

      {/* Monthly Winner Banner */}
      <div className="mb-8 bg-gradient-to-r from-amber-50 via-yellow-50 to-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
        <span className="text-3xl">{"\u{1F3C6}"}</span>
        <h2 className="text-lg font-bold text-amber-800 mt-2">Monatssieger-Challenge</h2>
        <p className="text-amber-700 text-sm mt-1">
          Der Spieler mit den meisten Punkten am Monatsende bekommt einen <strong>Kasten gratis!</strong>
        </p>
      </div>

      {/* Registration */}
      {showRegister && !user && (
        <div className="mb-8 bg-white border border-border rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-secondary mb-4 flex items-center gap-2">
            <span>{"\u{1F680}"}</span> Jetzt mitmachen
          </h2>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dein Anzeigename"
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary mb-1">E-Mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.de"
                className="w-full px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition-colors"
            >
              Registrieren & Punkte sammeln
            </button>
          </form>
        </div>
      )}

      {/* User profile card */}
      {user && (
        <div className="mb-8 bg-white border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xl font-bold text-primary">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-secondary">{user.name}</h3>
                <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${getLevelColor(userLevel)}`}>
                  {getLevelIcon(userLevel)} {userLevel}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-extrabold text-primary">{user.points}</p>
              <p className="text-xs text-muted">Punkte</p>
            </div>
          </div>
          {/* Progress bar */}
          {userLevel !== "Diamant" && (
            <div>
              <div className="flex justify-between text-xs text-muted mb-1">
                <span>{userLevel}</span>
                <span>{nextLevel.next} ab {nextLevel.threshold} Pkt.</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Points info */}
      <div className="mb-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { icon: "\u{1F4C5}", label: "Täglicher Besuch", pts: 10 },
          { icon: "\u{2694}\uFE0F", label: "Battle-Vote", pts: 5 },
          { icon: "\u{1F3B0}", label: "Glücksrad drehen", pts: 5 },
          { icon: "\u{1F9CA}", label: "Kühlschrank-Check", pts: 15 },
          { icon: "\u{1F9E0}", label: "Quiz abschließen", pts: 20 },
          { icon: "\u{267B}\uFE0F", label: "Leergut-Rechner", pts: 10 },
        ].map((item) => (
          <div key={item.label} className="bg-light rounded-xl p-3 text-center">
            <span className="text-2xl">{item.icon}</span>
            <p className="text-xs font-medium text-secondary mt-1">{item.label}</p>
            <p className="text-sm font-bold text-primary">+{item.pts} Pkt.</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      {user && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === "leaderboard" ? "bg-primary text-white" : "bg-light text-muted hover:bg-border"}`}
          >
            Leaderboard
          </button>
          <button
            onClick={() => setActiveTab("profil")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === "profil" ? "bg-primary text-white" : "bg-light text-muted hover:bg-border"}`}
          >
            Mein Profil
          </button>
        </div>
      )}

      {/* Leaderboard */}
      {(activeTab === "leaderboard" || !user) && (
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border bg-light">
            <h2 className="font-bold text-secondary flex items-center gap-2">
              <span>{"\u{1F3C6}"}</span> Leaderboard
            </h2>
          </div>
          <div className="divide-y divide-border">
            {leaderboard.map((entry, i) => {
              const isCurrentUser = user && entry.name === user.name;
              return (
                <div
                  key={entry.name}
                  className={`flex items-center gap-4 px-6 py-3 ${isCurrentUser ? "bg-red-50" : ""} ${i < 3 ? "font-semibold" : ""}`}
                >
                  <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                    i === 0 ? "bg-amber-100 text-amber-700" :
                    i === 1 ? "bg-gray-100 text-gray-600" :
                    i === 2 ? "bg-orange-100 text-orange-700" :
                    "bg-light text-muted"
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm ${isCurrentUser ? "text-primary font-bold" : "text-secondary"}`}>
                      {entry.name} {isCurrentUser && "(Du)"}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getLevelColor(entry.level)}`}>
                    {getLevelIcon(entry.level)} {entry.level}
                  </span>
                  <span className="text-sm font-bold text-primary w-16 text-right">{entry.points}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Profile / History */}
      {activeTab === "profil" && user && (
        <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-border bg-light">
            <h2 className="font-bold text-secondary flex items-center gap-2">
              <span>{"\u{1F4CA}"}</span> Punktehistorie
            </h2>
          </div>
          {user.history.length === 0 ? (
            <div className="p-8 text-center text-muted">
              <p>Noch keine Punkte gesammelt. Starte jetzt!</p>
            </div>
          ) : (
            <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
              {user.history.map((entry, i) => (
                <div key={`${entry.timestamp}-${i}`} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <p className="text-sm font-medium text-secondary">{entry.label}</p>
                    <p className="text-xs text-muted">{new Date(entry.timestamp).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <span className="text-sm font-bold text-green-600">+{entry.points}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
