import { NextResponse } from "next/server";
import {
  loadDB,
  saveDB,
  generateId,
  getLeaderboard,
  getLevel,
  checkMonthlyReset,
  type StoredUser,
} from "@/lib/community-db";

const ACTION_POINTS: Record<string, { points: number; label: string }> = {
  daily_visit: { points: 10, label: "Taeglicher Besuch" },
  battle_vote: { points: 5, label: "Battle-Vote" },
  gluecksrad: { points: 5, label: "Gluecksrad gedreht" },
  kuehlschrank_check: { points: 15, label: "Kuehlschrank-Check" },
  quiz_complete: { points: 20, label: "Quiz abgeschlossen" },
  leergut_rechner: { points: 10, label: "Leergut-Rechner genutzt" },
  partyspiel: { points: 5, label: "Partyspiel gespielt" },
};

/**
 * GET /api/community
 *   ?action=leaderboard          → Top 50 Spieler
 *   ?action=profile&id=abc123    → Eigenes Profil
 *   ?action=winners              → Monatssieger-Archiv
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || "leaderboard";

  const db = await loadDB();

  // Monatlichen Reset pruefen
  await checkMonthlyReset(db);

  if (action === "leaderboard") {
    const board = getLeaderboard(db);
    const totalPlayers = Object.keys(db.users).length;
    return NextResponse.json({ leaderboard: board, totalPlayers });
  }

  if (action === "profile") {
    const id = searchParams.get("id");
    if (!id || !db.users[id]) {
      return NextResponse.json({ user: null });
    }
    const u = db.users[id];
    const board = getLeaderboard(db);
    const rank = board.findIndex((e) => e.id === id) + 1;
    return NextResponse.json({
      user: {
        id: u.id,
        name: u.name,
        points: u.points,
        level: getLevel(u.points),
        history: u.history.slice(0, 50),
        joinedAt: u.joinedAt,
        rank: rank || Object.keys(db.users).length,
      },
    });
  }

  if (action === "winners") {
    return NextResponse.json({
      winners: [...db.monthlyWinners].reverse(),
    });
  }

  return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 });
}

/**
 * POST /api/community
 * Body: { action: "register" | "add_points", ... }
 */
export async function POST(request: Request) {
  const body = await request.json();
  const db = await loadDB();

  // Monatlichen Reset pruefen
  await checkMonthlyReset(db);

  // === REGISTRIEREN ===
  if (body.action === "register") {
    const name = (body.name || "").trim();
    if (!name || name.length < 2 || name.length > 20) {
      return NextResponse.json(
        { error: "Name muss 2-20 Zeichen lang sein" },
        { status: 400 }
      );
    }

    // Doppelte Namen pruefen
    const nameTaken = Object.values(db.users).some(
      (u) => u.name.toLowerCase() === name.toLowerCase()
    );
    if (nameTaken) {
      return NextResponse.json(
        { error: "Dieser Name ist bereits vergeben" },
        { status: 409 }
      );
    }

    const id = generateId();
    const user: StoredUser = {
      id,
      name,
      points: 0,
      history: [],
      joinedAt: new Date().toISOString(),
      lastVisit: new Date().toDateString(),
    };

    db.users[id] = user;
    await saveDB(db);

    return NextResponse.json({
      success: true,
      user: { id, name, points: 0, level: "Bronze" },
    });
  }

  // === PUNKTE HINZUFUEGEN ===
  if (body.action === "add_points") {
    const id = body.userId;
    const pointAction = body.pointAction;

    if (!id || !db.users[id]) {
      return NextResponse.json({ error: "User nicht gefunden" }, { status: 404 });
    }

    const config = ACTION_POINTS[pointAction];
    if (!config) {
      return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 });
    }

    // Daily visit: nur einmal pro Tag
    if (pointAction === "daily_visit") {
      const today = new Date().toDateString();
      if (db.users[id].lastVisit === today) {
        return NextResponse.json({ success: true, points: 0, alreadyVisited: true });
      }
      db.users[id].lastVisit = today;
    }

    const pts = config.points;
    db.users[id].points += pts;
    db.users[id].history.unshift({
      action: pointAction,
      points: pts,
      timestamp: new Date().toISOString(),
      label: config.label,
    });

    // Max 100 Eintraege
    if (db.users[id].history.length > 100) {
      db.users[id].history = db.users[id].history.slice(0, 100);
    }

    await saveDB(db);

    return NextResponse.json({
      success: true,
      points: pts,
      totalPoints: db.users[id].points,
      level: getLevel(db.users[id].points),
    });
  }

  return NextResponse.json({ error: "Unbekannte Aktion" }, { status: 400 });
}
