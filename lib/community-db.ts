import { promises as fs } from "fs";
import path from "path";

const DB_FILE = path.join(process.cwd(), "data", "community.json");

export type StoredUser = {
  id: string;
  name: string;
  points: number;
  history: { action: string; points: number; timestamp: string; label: string }[];
  joinedAt: string;
  lastVisit: string;
};

export type MonthlyWinner = {
  month: string; // "2026-04"
  name: string;
  points: number;
};

export type CommunityDB = {
  users: Record<string, StoredUser>;
  monthlyWinners: MonthlyWinner[];
  lastReset: string;
};

function emptyDB(): CommunityDB {
  return { users: {}, monthlyWinners: [], lastReset: "" };
}

/** Datenbank laden */
export async function loadDB(): Promise<CommunityDB> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf-8");
    return JSON.parse(raw) as CommunityDB;
  } catch {
    return emptyDB();
  }
}

/** Datenbank speichern */
export async function saveDB(db: CommunityDB): Promise<void> {
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
}

/** Zufaellige 8-stellige ID */
export function generateId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

/** Aktueller Monat als String */
export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Level berechnen */
export type Level = "Bronze" | "Silber" | "Gold" | "Diamant";

export function getLevel(points: number): Level {
  if (points > 1000) return "Diamant";
  if (points > 500) return "Gold";
  if (points > 100) return "Silber";
  return "Bronze";
}

/** Leaderboard: Top N User sortiert nach Punkten */
export function getLeaderboard(db: CommunityDB, limit = 50): { rank: number; id: string; name: string; points: number; level: Level }[] {
  return Object.values(db.users)
    .sort((a, b) => b.points - a.points)
    .slice(0, limit)
    .map((u, i) => ({
      rank: i + 1,
      id: u.id,
      name: u.name,
      points: u.points,
      level: getLevel(u.points),
    }));
}

/**
 * Monatlichen Reset pruefen und durchfuehren.
 * Wenn ein neuer Monat begonnen hat:
 * 1. Monatssieger archivieren
 * 2. Alle Punkte auf 0 setzen
 * 3. Historie loeschen
 */
export async function checkMonthlyReset(db: CommunityDB): Promise<{ reset: boolean; winner: MonthlyWinner | null }> {
  const month = currentMonth();
  if (db.lastReset === month) {
    return { reset: false, winner: null };
  }

  // Monatssieger ermitteln
  const users = Object.values(db.users);
  let winner: MonthlyWinner | null = null;

  if (users.length > 0) {
    const top = users.reduce((best, u) => (u.points > best.points ? u : best), users[0]);
    if (top.points > 0) {
      winner = {
        month: db.lastReset || month,
        name: top.name,
        points: top.points,
      };
      db.monthlyWinners.push(winner);
      // Maximal 12 Monate speichern
      if (db.monthlyWinners.length > 12) {
        db.monthlyWinners = db.monthlyWinners.slice(-12);
      }
    }
  }

  // Alle Punkte zuruecksetzen
  for (const id of Object.keys(db.users)) {
    db.users[id].points = 0;
    db.users[id].history = [];
  }

  db.lastReset = month;
  await saveDB(db);

  return { reset: true, winner };
}
