const LOCAL_ID_KEY = "trinkgut-community-id";
const LOCAL_NAME_KEY = "trinkgut-community-name";

export type PointAction =
  | "daily_visit"
  | "battle_vote"
  | "gluecksrad"
  | "kuehlschrank_check"
  | "quiz_complete"
  | "leergut_rechner"
  | "partyspiel";

export type Level = "Bronze" | "Silber" | "Gold" | "Diamant";

export type LeaderboardEntry = {
  rank: number;
  id: string;
  name: string;
  points: number;
  level: Level;
};

export type UserProfile = {
  id: string;
  name: string;
  points: number;
  level: Level;
  rank: number;
  history: { action: string; points: number; timestamp: string; label: string }[];
  joinedAt: string;
};

export type MonthlyWinner = {
  month: string;
  name: string;
  points: number;
};

export function getLevel(points: number): Level {
  if (points > 1000) return "Diamant";
  if (points > 500) return "Gold";
  if (points > 100) return "Silber";
  return "Bronze";
}

export function getLevelColor(level: Level): string {
  switch (level) {
    case "Diamant": return "bg-cyan-100 text-cyan-700 border-cyan-300";
    case "Gold": return "bg-amber-100 text-amber-700 border-amber-300";
    case "Silber": return "bg-gray-100 text-gray-600 border-gray-300";
    case "Bronze": return "bg-orange-100 text-orange-700 border-orange-300";
  }
}

export function getLevelIcon(level: Level): string {
  switch (level) {
    case "Diamant": return "\u{1F48E}";
    case "Gold": return "\u{1F947}";
    case "Silber": return "\u{1F948}";
    case "Bronze": return "\u{1F949}";
  }
}

export function getNextLevelThreshold(points: number): { next: Level; threshold: number } {
  if (points <= 100) return { next: "Silber", threshold: 101 };
  if (points <= 500) return { next: "Gold", threshold: 501 };
  if (points <= 1000) return { next: "Diamant", threshold: 1001 };
  return { next: "Diamant", threshold: points };
}

/** Gespeicherte User-ID aus localStorage holen */
function getLocalId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LOCAL_ID_KEY);
}

function getLocalName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LOCAL_NAME_KEY);
}

export const points = {
  /** Pruefen ob registriert */
  isRegistered(): boolean {
    return getLocalId() !== null;
  },

  /** Lokale User-ID */
  getUserId(): string | null {
    return getLocalId();
  },

  /** Lokaler Username */
  getUserName(): string | null {
    return getLocalName();
  },

  /** Registrieren — serverseitig */
  async register(name: string): Promise<{ success: boolean; error?: string; id?: string }> {
    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", name }),
      });
      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || "Fehler bei der Registrierung" };
      }

      // ID lokal speichern
      localStorage.setItem(LOCAL_ID_KEY, data.user.id);
      localStorage.setItem(LOCAL_NAME_KEY, data.user.name);
      window.dispatchEvent(new Event("trinkgut-points-change"));

      return { success: true, id: data.user.id };
    } catch {
      return { success: false, error: "Server nicht erreichbar" };
    }
  },

  /** Punkte hinzufuegen — serverseitig */
  async addPoints(action: PointAction): Promise<{ points: number; totalPoints: number; level: Level } | null> {
    const id = getLocalId();
    if (!id) return null;

    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add_points", userId: id, pointAction: action }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) return null;

      window.dispatchEvent(new Event("trinkgut-points-change"));
      return {
        points: data.points,
        totalPoints: data.totalPoints,
        level: data.level,
      };
    } catch {
      return null;
    }
  },

  /** Taeglichen Besuch pruefen + Punkte geben */
  async checkDailyVisit(): Promise<boolean> {
    const result = await points.addPoints("daily_visit");
    return result !== null && result.points > 0;
  },

  /** Eigenes Profil laden */
  async getProfile(): Promise<UserProfile | null> {
    const id = getLocalId();
    if (!id) return null;

    try {
      const res = await fetch(`/api/community?action=profile&id=${id}`);
      const data = await res.json();
      return data.user || null;
    } catch {
      return null;
    }
  },

  /** Leaderboard laden */
  async getLeaderboard(): Promise<{ leaderboard: LeaderboardEntry[]; totalPlayers: number }> {
    try {
      const res = await fetch("/api/community?action=leaderboard");
      return await res.json();
    } catch {
      return { leaderboard: [], totalPlayers: 0 };
    }
  },

  /** Monatssieger laden */
  async getWinners(): Promise<MonthlyWinner[]> {
    try {
      const res = await fetch("/api/community?action=winners");
      const data = await res.json();
      return data.winners || [];
    } catch {
      return [];
    }
  },

  /** Abmelden (lokal) */
  logout() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(LOCAL_ID_KEY);
    localStorage.removeItem(LOCAL_NAME_KEY);
    // Alte Daten auch aufraeumen
    localStorage.removeItem("trinkgut-community");
    localStorage.removeItem("trinkgut-last-visit");
    window.dispatchEvent(new Event("trinkgut-points-change"));
  },
};
