"use client";

import { useState, useEffect, useCallback } from "react";
import {
  points,
  getLevel,
  getLevelColor,
  getLevelIcon,
  getNextLevelThreshold,
  type LeaderboardEntry,
  type UserProfile,
  type MonthlyWinner,
  type Level,
} from "@/lib/points";

export default function CommunityPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [registered, setRegistered] = useState(false);
  const [name, setName] = useState("");
  const [regError, setRegError] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [winners, setWinners] = useState<MonthlyWinner[]>([]);
  const [activeTab, setActiveTab] = useState<"leaderboard" | "profil" | "sieger">("leaderboard");
  const [loading, setLoading] = useState(true);

  const refreshData = useCallback(async () => {
    const [boardData, profileData, winnersData] = await Promise.all([
      points.getLeaderboard(),
      points.getProfile(),
      points.getWinners(),
    ]);

    setLeaderboard(boardData.leaderboard);
    setTotalPlayers(boardData.totalPlayers);
    setProfile(profileData);
    setWinners(winnersData);
    setRegistered(points.isRegistered());
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshData();

    // Daily visit Punkte
    if (points.isRegistered()) {
      points.checkDailyVisit();
    }

    const handler = () => refreshData();
    window.addEventListener("trinkgut-points-change", handler);
    return () => window.removeEventListener("trinkgut-points-change", handler);
  }, [refreshData]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    if (!name.trim() || name.trim().length < 2) {
      setRegError("Mindestens 2 Zeichen");
      return;
    }
    if (name.trim().length > 20) {
      setRegError("Maximal 20 Zeichen");
      return;
    }

    const result = await points.register(name.trim());
    if (result.success) {
      setRegistered(true);
      await refreshData();
    } else {
      setRegError(result.error || "Fehler");
    }
  };

  const userLevel = profile ? (profile.level as Level) : "Bronze";
  const nextLevel = profile ? getNextLevelThreshold(profile.points) : { next: "Silber" as Level, threshold: 101 };
  const progressPercent = profile
    ? Math.min(100, (profile.points / nextLevel.threshold) * 100)
    : 0;

  const userId = points.getUserId();

  function formatMonth(month: string): string {
    const [y, m] = month.split("-");
    const months = ["Jan", "Feb", "Mrz", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
    return `${months[parseInt(m, 10) - 1]} ${y}`;
  }

  return (
    <>
      {/* Hero Banner */}
      <div className="page-hero-banner py-16 md:py-24">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <nav className="text-sm text-white/60 mb-4">
            <a href="/" className="hover:text-white">Home</a>
            <span className="mx-1">/</span>
            <span className="text-white">Community</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-3">
            Trinkgut Jammers Community
          </h1>
          <p className="text-white/80 max-w-lg mx-auto text-lg">
            Sammle Punkte, steige im Level auf und werde Monatssieger!
          </p>
          {totalPlayers > 0 && (
            <p className="text-white/50 text-sm mt-2">
              {totalPlayers} Spieler aktiv
            </p>
          )}
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
          {winners.length > 0 && (
            <p className="text-amber-600 text-xs mt-2">
              Letzter Sieger: <strong>{winners[0].name}</strong> mit {winners[0].points} Punkten ({formatMonth(winners[0].month)})
            </p>
          )}
        </div>

        {/* Registration */}
        {!registered && !loading && (
          <div className="mb-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-secondary mb-4 flex items-center gap-2">
              <span>{"\u{1F680}"}</span> Jetzt mitmachen
            </h2>
            <p className="text-muted text-sm mb-4">
              Waehle einen Spitznamen und fang an Punkte zu sammeln. Keine E-Mail, kein Passwort noetig.
            </p>
            <form onSubmit={handleRegister} className="flex gap-3">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dein Spitzname (2-20 Zeichen)"
                maxLength={20}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-primary hover:bg-red-700 text-white font-semibold rounded-xl transition-colors whitespace-nowrap"
              >
                Los geht&apos;s
              </button>
            </form>
            {regError && (
              <p className="text-red-500 text-sm mt-2">{regError}</p>
            )}
          </div>
        )}

        {/* User profile card */}
        {profile && (
          <div className="mb-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-xl font-bold text-primary">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-secondary">{profile.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${getLevelColor(userLevel)}`}>
                      {getLevelIcon(userLevel)} {userLevel}
                    </span>
                    <span className="text-xs text-muted">Rang #{profile.rank}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold text-primary">{profile.points}</p>
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
                    className="h-full bg-gradient-to-r from-primary to-amber-400 rounded-full transition-all duration-500"
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
            { icon: "\u{1F4C5}", label: "Taeglicher Besuch", pts: 10 },
            { icon: "\u{2694}\uFE0F", label: "Battle-Vote", pts: 5 },
            { icon: "\u{1F3B0}", label: "Gluecksrad drehen", pts: 5 },
            { icon: "\u{1F9CA}", label: "Kuehlschrank-Check", pts: 15 },
            { icon: "\u{1F9E0}", label: "Quiz abschliessen", pts: 20 },
            { icon: "\u{267B}\uFE0F", label: "Leergut-Rechner", pts: 10 },
          ].map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-xl p-3 text-center">
              <span className="text-2xl">{item.icon}</span>
              <p className="text-xs font-medium text-secondary mt-1">{item.label}</p>
              <p className="text-sm font-bold text-primary">+{item.pts} Pkt.</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === "leaderboard" ? "bg-primary text-white" : "bg-gray-100 text-muted hover:bg-gray-200"}`}
          >
            Leaderboard
          </button>
          {registered && (
            <button
              onClick={() => setActiveTab("profil")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === "profil" ? "bg-primary text-white" : "bg-gray-100 text-muted hover:bg-gray-200"}`}
            >
              Mein Profil
            </button>
          )}
          <button
            onClick={() => setActiveTab("sieger")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === "sieger" ? "bg-primary text-white" : "bg-gray-100 text-muted hover:bg-gray-200"}`}
          >
            Monatssieger
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
            <p className="text-muted text-sm">Leaderboard wird geladen...</p>
          </div>
        )}

        {/* Leaderboard */}
        {!loading && activeTab === "leaderboard" && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-bold text-secondary flex items-center gap-2">
                <span>{"\u{1F3C6}"}</span> Leaderboard
                <span className="text-xs text-muted font-normal ml-auto">{totalPlayers} Spieler</span>
              </h2>
            </div>
            {leaderboard.length === 0 ? (
              <div className="p-8 text-center text-muted">
                <span className="text-4xl block mb-2">{"\u{1F3AE}"}</span>
                <p>Noch keine Spieler. Sei der Erste!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {leaderboard.map((entry) => {
                  const isMe = userId === entry.id;
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center gap-4 px-6 py-3 ${isMe ? "bg-red-50" : ""} ${entry.rank <= 3 ? "font-semibold" : ""}`}
                    >
                      <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${
                        entry.rank === 1 ? "bg-amber-100 text-amber-700" :
                        entry.rank === 2 ? "bg-gray-100 text-gray-600" :
                        entry.rank === 3 ? "bg-orange-100 text-orange-700" :
                        "bg-gray-50 text-muted"
                      }`}>
                        {entry.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className={`text-sm ${isMe ? "text-primary font-bold" : "text-secondary"}`}>
                          {entry.name} {isMe && "(Du)"}
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
            )}
          </div>
        )}

        {/* Profile / History */}
        {!loading && activeTab === "profil" && profile && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-bold text-secondary flex items-center gap-2">
                <span>{"\u{1F4CA}"}</span> Punktehistorie
              </h2>
            </div>
            {profile.history.length === 0 ? (
              <div className="p-8 text-center text-muted">
                <p>Noch keine Punkte gesammelt. Besuche die Seite taeglich fuer +10 Punkte!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                {profile.history.map((entry, i) => (
                  <div key={`${entry.timestamp}-${i}`} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-secondary">{entry.label}</p>
                      <p className="text-xs text-muted">
                        {new Date(entry.timestamp).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-green-600">+{entry.points}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Monthly Winners */}
        {!loading && activeTab === "sieger" && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="font-bold text-secondary flex items-center gap-2">
                <span>{"\u{1F3C6}"}</span> Monatssieger-Archiv
              </h2>
            </div>
            {winners.length === 0 ? (
              <div className="p-8 text-center text-muted">
                <span className="text-4xl block mb-2">{"\u{1F3C6}"}</span>
                <p>Noch keine Monatssieger. Der erste Monat laeuft!</p>
                <p className="text-xs mt-1">Am Monatsende gewinnt der Spieler mit den meisten Punkten einen Kasten gratis.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {winners.map((w, i) => (
                  <div key={w.month} className="flex items-center gap-4 px-6 py-4">
                    <span className={`w-10 h-10 flex items-center justify-center rounded-full text-lg ${
                      i === 0 ? "bg-amber-100" : "bg-gray-50"
                    }`}>
                      {"\u{1F3C6}"}
                    </span>
                    <div className="flex-1">
                      <p className="font-bold text-secondary">{w.name}</p>
                      <p className="text-xs text-muted">{formatMonth(w.month)}</p>
                    </div>
                    <span className="text-sm font-bold text-primary">{w.points} Pkt.</span>
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
