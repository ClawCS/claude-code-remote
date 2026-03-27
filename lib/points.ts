const STORAGE_KEY = "trinkgut-community";
const LAST_VISIT_KEY = "trinkgut-last-visit";

export type PointAction =
  | "daily_visit"
  | "battle_vote"
  | "gluecksrad"
  | "kuehlschrank_check"
  | "quiz_complete"
  | "leergut_rechner"
  | "partyspiel";

export type PointEntry = {
  action: PointAction;
  points: number;
  timestamp: string;
  label: string;
};

export type CommunityUser = {
  name: string;
  email: string;
  points: number;
  history: PointEntry[];
  joinedAt: string;
};

const ACTION_POINTS: Record<PointAction, { points: number; label: string }> = {
  daily_visit: { points: 10, label: "Täglicher Besuch" },
  battle_vote: { points: 5, label: "Battle-Vote" },
  gluecksrad: { points: 5, label: "Glücksrad gedreht" },
  kuehlschrank_check: { points: 15, label: "Kühlschrank-Check" },
  quiz_complete: { points: 20, label: "Quiz abgeschlossen" },
  leergut_rechner: { points: 10, label: "Leergut-Rechner genutzt" },
  partyspiel: { points: 5, label: "Partyspiel gespielt" },
};

export type Level = "Bronze" | "Silber" | "Gold" | "Diamant";

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

function getUser(): CommunityUser | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as CommunityUser;
  } catch {
    return null;
  }
}

function saveUser(user: CommunityUser) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("trinkgut-points-change"));
}

export const points = {
  getUser,

  register(name: string, email: string): CommunityUser {
    const existing = getUser();
    if (existing) return existing;
    const user: CommunityUser = {
      name,
      email,
      points: 0,
      history: [],
      joinedAt: new Date().toISOString(),
    };
    saveUser(user);
    return user;
  },

  isRegistered(): boolean {
    return getUser() !== null;
  },

  addPoints(action: PointAction, customPoints?: number): number {
    const user = getUser();
    if (!user) return 0;

    const config = ACTION_POINTS[action];
    const pts = customPoints ?? config.points;

    const entry: PointEntry = {
      action,
      points: pts,
      timestamp: new Date().toISOString(),
      label: config.label,
    };

    user.points += pts;
    user.history.unshift(entry);
    if (user.history.length > 100) user.history = user.history.slice(0, 100);
    saveUser(user);
    return pts;
  },

  checkDailyVisit(): boolean {
    if (typeof window === "undefined") return false;
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    const today = new Date().toDateString();
    if (lastVisit === today) return false;
    localStorage.setItem(LAST_VISIT_KEY, today);
    const user = getUser();
    if (!user) return false;
    points.addPoints("daily_visit");
    return true;
  },

  getLeaderboard(): { name: string; points: number; level: Level }[] {
    // In a localStorage-only setup we only have the current user.
    // For demo we generate some fake competitors + the real user.
    const user = getUser();
    const fakeUsers = [
      { name: "MaxBierFan", points: 1250 },
      { name: "LisaWein", points: 890 },
      { name: "TomMixer", points: 720 },
      { name: "SarahSekt", points: 580 },
      { name: "BenHopfen", points: 430 },
      { name: "AnnaSprudel", points: 310 },
      { name: "PaulPils", points: 220 },
      { name: "MiaRadler", points: 150 },
      { name: "LeonLimo", points: 85 },
      { name: "EmmaAle", points: 45 },
    ];

    const board = fakeUsers.map((u) => ({
      name: u.name,
      points: u.points,
      level: getLevel(u.points),
    }));

    if (user) {
      board.push({
        name: user.name,
        points: user.points,
        level: getLevel(user.points),
      });
    }

    return board.sort((a, b) => b.points - a.points);
  },
};
