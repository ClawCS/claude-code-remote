"use client";

import { useState } from "react";
import ShimmerParticles from "@/components/ShimmerParticles";

/* ═══════════════════════════════════════════════════════════════
   GAME DATA & TYPES
   ═══════════════════════════════════════════════════════════════ */

type GameId = "roulette" | "wahrheit" | "bierpong" | "flunkyball" | "kingscup" | "ichhabnochnie" | "cocktailquiz" | "tabu";

type GameMeta = {
  id: GameId;
  name: string;
  icon: string;
  players: string;
  difficulty: string;
  difficultyColor: string;
  description: string;
};

const GAMES: GameMeta[] = [
  { id: "roulette", name: "Trink-Roulette", icon: "\u{1F3B0}", players: "2-10", difficulty: "Leicht", difficultyColor: "bg-green-100 text-green-700", description: "Digitales Rad mit Aufgaben. Namen eintragen, drehen, machen!" },
  { id: "wahrheit", name: "Wahrheit oder Pflicht", icon: "\u{1F525}", players: "3-12", difficulty: "Mittel", difficultyColor: "bg-amber-100 text-amber-700", description: "Getranke-Edition mit lustigen Fragen und Aufgaben." },
  { id: "bierpong", name: "Bier-Pong Scoreboard", icon: "\u{1F3C6}", players: "2 Teams", difficulty: "Leicht", difficultyColor: "bg-green-100 text-green-700", description: "Digitaler Punktezahler mit Timer und Regeln." },
  { id: "flunkyball", name: "Flunkyball Timer", icon: "\u{26BD}", players: "4-20", difficulty: "Mittel", difficultyColor: "bg-amber-100 text-amber-700", description: "Countdown & Scoreboard fur Flunkyball-Turniere." },
  { id: "kingscup", name: "Kings Cup", icon: "\u{1F0CF}", players: "3-10", difficulty: "Mittel", difficultyColor: "bg-amber-100 text-amber-700", description: "Ring of Fire — digitale Karten mit Regeln aufdecken." },
  { id: "ichhabnochnie", name: "Ich hab noch nie...", icon: "\u{1F648}", players: "3-15", difficulty: "Leicht", difficultyColor: "bg-green-100 text-green-700", description: "Zufallige Statements — wer es getan hat, trinkt!" },
  { id: "cocktailquiz", name: "Cocktail-Quiz", icon: "\u{1F378}", players: "1-8", difficulty: "Schwer", difficultyColor: "bg-red-100 text-red-700", description: "Multiple Choice uber Cocktails. Timer, Punkte, Highscore." },
  { id: "tabu", name: "Getranke-Tabu", icon: "\u{1F910}", players: "4-12", difficulty: "Schwer", difficultyColor: "bg-red-100 text-red-700", description: "Beschreibe ein Getrank ohne bestimmte Worter!" },
];

/* ═══════════════════════════════════════════════════════════════
   SHARED UI: Modal Wrapper
   ═══════════════════════════════════════════════════════════════ */

function GameModal({ title, icon, onClose, children, alkoholfrei, setAlkoholfrei }: {
  title: string;
  icon: string;
  onClose: () => void;
  children: React.ReactNode;
  alkoholfrei: boolean;
  setAlkoholfrei: (v: boolean) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto z-10">
        <div className="sticky top-0 bg-white border-b border-border px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-lg font-bold text-secondary flex items-center gap-2">
            <span className="text-2xl">{icon}</span> {title}
          </h2>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
              <input type="checkbox" checked={alkoholfrei} onChange={(e) => setAlkoholfrei(e.target.checked)} className="accent-primary w-4 h-4" />
              <span className={alkoholfrei ? "text-green-600 font-semibold" : "text-muted"}>Alkoholfrei</span>
            </label>
            <button onClick={onClose} className="p-1 text-muted hover:text-secondary" aria-label="Schliessen">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function ShareButton({ gameName }: { gameName: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    const url = window.location.href;
    const text = `Spiel mit mir "${gameName}" auf Trinkgut Jammers Partyspiele!`;
    if (navigator.share) {
      try { await navigator.share({ title: gameName, text, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <button onClick={share} className="mt-4 w-full py-2 border border-border rounded-xl text-sm text-muted hover:text-primary hover:border-primary transition-colors flex items-center justify-center gap-2">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      {copied ? "Link kopiert!" : "Teile dieses Spiel"}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GAME 1: TRINK-ROULETTE
   ═══════════════════════════════════════════════════════════════ */

const ROULETTE_TASKS = [
  "Trinke einen Schluck", "2 Schlucke verteilen", "Alle trinken!", "Erzahle einen Witz oder trinke",
  "Selfie mit dem Nachbarn", "Arm-Wrestling mit links", "30 Sekunden Dauergrinsen",
  "Nachmachen was der Rechte sagt", "Trink mit der falschen Hand", "Stille Post starten",
  "Wahrheit beantworten oder 3 Schlucke", "Handstand versuchen", "Akzent nachahmen",
  "Kompliment an alle", "Song anstimmen",
];
const ROULETTE_TASKS_AF = [
  "Trinke einen Schluck Wasser", "2 Schlucke Saft verteilen", "Alle trinken Limo!",
  "Erzahle einen Witz", "Selfie mit dem Nachbarn", "Arm-Wrestling mit links",
  "30 Sekunden Dauergrinsen", "Nachmachen was der Rechte sagt", "Trink mit der falschen Hand",
  "Stille Post starten", "Wahrheit beantworten oder Aufgabe", "Handstand versuchen",
  "Akzent nachahmen", "Kompliment an alle", "Song anstimmen",
];

function RouletteGame({ alkoholfrei }: { alkoholfrei: boolean }) {
  const [players, setPlayers] = useState<string[]>([]);
  const [newPlayer, setNewPlayer] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<{ player: string; task: string } | null>(null);
  const [rotation, setRotation] = useState(0);

  const addPlayer = () => {
    if (newPlayer.trim() && players.length < 10) {
      setPlayers([...players, newPlayer.trim()]);
      setNewPlayer("");
    }
  };

  const spin = () => {
    if (players.length < 2 || spinning) return;
    setSpinning(true);
    setResult(null);
    const tasks = alkoholfrei ? ROULETTE_TASKS_AF : ROULETTE_TASKS;
    const extraRotation = 1440 + Math.random() * 1440;
    setRotation((prev) => prev + extraRotation);
    setTimeout(() => {
      const player = players[Math.floor(Math.random() * players.length)];
      const task = tasks[Math.floor(Math.random() * tasks.length)];
      setResult({ player, task });
      setSpinning(false);
    }, 3000);
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          value={newPlayer}
          onChange={(e) => setNewPlayer(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addPlayer()}
          placeholder="Spielername..."
          className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <button onClick={addPlayer} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors">+</button>
      </div>
      {players.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {players.map((p, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-light rounded-full text-sm">
              {p}
              <button onClick={() => setPlayers(players.filter((_, j) => j !== i))} className="text-muted hover:text-red-500 ml-1">&times;</button>
            </span>
          ))}
        </div>
      )}

      {/* Wheel */}
      <div className="flex flex-col items-center my-6">
        <div className="relative w-48 h-48 mb-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10 text-2xl">{"\u{1F53D}"}</div>
          <div
            className="w-full h-full rounded-full border-4 border-primary shadow-lg transition-transform"
            style={{ transform: `rotate(${rotation}deg)`, transitionDuration: spinning ? "3s" : "0s", transitionTimingFunction: "cubic-bezier(0.2, 0.8, 0.3, 1)" }}
          >
            {players.map((p, i) => {
              const angle = (360 / players.length) * i;
              const colors = ["#DC2626", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#EF4444"];
              return (
                <div key={i} className="absolute w-full h-full" style={{ transform: `rotate(${angle}deg)` }}>
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-white px-1.5 py-0.5 rounded" style={{ backgroundColor: colors[i % colors.length] }}>
                    {p}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <button
          onClick={spin}
          disabled={players.length < 2 || spinning}
          className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {spinning ? "Dreht..." : "Drehen!"}
        </button>
      </div>

      {result && (
        <div className="mt-4 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl text-center animate-fade-in-up">
          <p className="text-2xl font-extrabold text-primary">{result.player}</p>
          <p className="text-lg text-secondary mt-2">{result.task}</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GAME 2: WAHRHEIT ODER PFLICHT
   ═══════════════════════════════════════════════════════════════ */

const WOP_WAHRHEIT = [
  "Was ist dein peinlichstes Getrank das du je bestellt hast?",
  "Welches Getrank trinkst du heimlich gerne?",
  "Was war dein schlimmster Kater-Morgen?",
  "Hast du jemals aus der Flasche eines Fremden getrunken?",
  "Was ist das exotischste Getrank das du probiert hast?",
  "Hast du schon mal Getranke geklaut (als Kind)?",
  "Welchen Cocktail kannst du nicht leiden, gibst es aber nicht zu?",
  "Was war dein erstes alkoholisches Getrank?",
  "Hast du schon mal einen Getrankeautomaten getreten?",
  "Welches Getrank verbindest du mit deinem besten Erlebnis?",
];
const WOP_PFLICHT = [
  "Trinke einen Schluck mit geschlossenen Augen",
  "Bestelle dein nachstes Getrank mit einem Akzent",
  "Mache ein Trink-Gerausch nach",
  "Tue so als warst du ein Barkeeper — nimm 30 Sekunden Bestellungen auf",
  "Trinke deinen nachsten Schluck ohne Hande",
  "Halte eine Lobrede auf dein Lieblingsgetrank",
  "Singe einen Trink-Song",
  "Mache einen Toast auf die Person links von dir",
  "Imitiere wie ein Baby trinkt",
  "Mache 10 Hampelmanner, dann trinke",
];
const WOP_WAHRHEIT_AF = [
  "Was ist dein Lieblingsgetrank?",
  "Welchen Saft trinkst du am liebsten?",
  "Was war das komischste Getrank das du probiert hast?",
  "Trinkst du lieber Sprudel oder stilles Wasser?",
  "Welchen Smoothie wurdest du erfinden?",
  "Was ist dein Lieblingsgetrank im Sommer?",
];
const WOP_PFLICHT_AF = [
  "Trinke einen Schluck Wasser mit geschlossenen Augen",
  "Beschreibe deinen Lieblingssaft ohne den Namen zu sagen",
  "Mache das Gerausch einer Sprudelflasche nach",
  "Halte eine Lobrede auf Wasser",
  "Trinke einen Schluck auf ex",
  "Mache 10 Hampelmanner",
];

function WahrheitOderPflichtGame({ alkoholfrei }: { alkoholfrei: boolean }) {
  const [current, setCurrent] = useState<{ type: "Wahrheit" | "Pflicht"; text: string } | null>(null);

  const draw = (type: "Wahrheit" | "Pflicht") => {
    const list = type === "Wahrheit"
      ? (alkoholfrei ? WOP_WAHRHEIT_AF : WOP_WAHRHEIT)
      : (alkoholfrei ? WOP_PFLICHT_AF : WOP_PFLICHT);
    const text = list[Math.floor(Math.random() * list.length)];
    setCurrent({ type, text });
  };

  return (
    <div className="text-center">
      <div className="flex gap-3 justify-center mb-6">
        <button onClick={() => draw("Wahrheit")} className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors shadow-md">
          Wahrheit
        </button>
        <button onClick={() => draw("Pflicht")} className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors shadow-md">
          Pflicht
        </button>
      </div>
      {current && (
        <div className={`p-6 rounded-xl ${current.type === "Wahrheit" ? "bg-blue-50 border border-blue-200" : "bg-red-50 border border-red-200"}`}>
          <span className="text-xs font-bold uppercase tracking-wider text-muted">{current.type}</span>
          <p className="text-lg font-semibold text-secondary mt-2">{current.text}</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GAME 3: BIER-PONG SCOREBOARD
   ═══════════════════════════════════════════════════════════════ */

function BierPongGame() {
  const [team1, setTeam1] = useState({ name: "Team 1", score: 0, cups: 10 });
  const [team2, setTeam2] = useState({ name: "Team 2", score: 0, cups: 10 });
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);
  const [showRules, setShowRules] = useState(false);

  const startTimer = () => {
    if (running) return;
    setRunning(true);
    const id = setInterval(() => setTimer((t) => t + 1), 1000);
    setIntervalId(id);
  };

  const stopTimer = () => {
    if (intervalId) clearInterval(intervalId);
    setRunning(false);
    setIntervalId(null);
  };

  const resetGame = () => {
    stopTimer();
    setTimer(0);
    setTeam1({ name: "Team 1", score: 0, cups: 10 });
    setTeam2({ name: "Team 2", score: 0, cups: 10 });
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const hitCup = (team: 1 | 2) => {
    if (team === 1) {
      setTeam2((t) => ({ ...t, cups: Math.max(0, t.cups - 1) }));
      setTeam1((t) => ({ ...t, score: t.score + 1 }));
    } else {
      setTeam1((t) => ({ ...t, cups: Math.max(0, t.cups - 1) }));
      setTeam2((t) => ({ ...t, score: t.score + 1 }));
    }
  };

  return (
    <div>
      {/* Timer */}
      <div className="text-center mb-6">
        <p className="text-4xl font-mono font-bold text-secondary">{formatTime(timer)}</p>
        <div className="flex gap-2 justify-center mt-2">
          <button onClick={startTimer} disabled={running} className="px-4 py-1.5 bg-green-500 text-white text-sm font-medium rounded-lg disabled:opacity-50">Start</button>
          <button onClick={stopTimer} className="px-4 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-lg">Stopp</button>
          <button onClick={resetGame} className="px-4 py-1.5 bg-gray-500 text-white text-sm font-medium rounded-lg">Reset</button>
        </div>
      </div>
      {/* Scores */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {[{ team: team1, num: 1 as const }, { team: team2, num: 2 as const }].map(({ team, num }) => (
          <div key={num} className="bg-light rounded-xl p-4 text-center">
            <input
              value={team.name}
              onChange={(e) => num === 1 ? setTeam1({ ...team1, name: e.target.value }) : setTeam2({ ...team2, name: e.target.value })}
              className="w-full text-center font-bold text-secondary bg-transparent border-b border-border mb-2 focus:outline-none focus:border-primary"
            />
            <p className="text-3xl font-extrabold text-primary">{team.score}</p>
            <p className="text-sm text-muted mt-1">Becher ubrig: {team.cups}</p>
            <button
              onClick={() => hitCup(num)}
              className="mt-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors w-full"
            >
              Treffer!
            </button>
          </div>
        ))}
      </div>
      <button onClick={() => setShowRules(!showRules)} className="w-full py-2 text-sm text-muted hover:text-primary transition-colors">
        {showRules ? "Regeln ausblenden" : "Regeln anzeigen"}
      </button>
      {showRules && (
        <div className="mt-2 p-4 bg-light rounded-xl text-sm text-muted space-y-1">
          <p>1. Jedes Team hat 10 Becher in Pyramidenform</p>
          <p>2. Abwechselnd wirft jedes Team einen Tischtennisball</p>
          <p>3. Trifft man einen Becher, trinkt das gegnerische Team</p>
          <p>4. Das Team das zuerst alle Becher trifft gewinnt</p>
          <p>5. Redemption-Runde: Das verlierende Team darf nochmal</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GAME 4: FLUNKYBALL TIMER
   ═══════════════════════════════════════════════════════════════ */

function FlunkyballGame() {
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [countdownRunning, setCountdownRunning] = useState(false);
  const [countdownId, setCountdownId] = useState<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = (seconds: number) => {
    if (countdownRunning) {
      if (countdownId) clearInterval(countdownId);
      setCountdownRunning(false);
      setCountdownId(null);
    }
    setCountdown(seconds);
    setCountdownRunning(true);
    const id = setInterval(() => {
      setCountdown((t) => {
        if (t <= 1) {
          clearInterval(id);
          setCountdownRunning(false);
          setCountdownId(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    setCountdownId(id);
  };

  return (
    <div className="text-center">
      {/* Countdown */}
      <div className="mb-6">
        <p className={`text-6xl font-mono font-bold ${countdown <= 5 && countdownRunning ? "text-primary animate-pulse" : "text-secondary"}`}>
          {countdown > 0 ? countdown : "GO!"}
        </p>
        <div className="flex gap-2 justify-center mt-3">
          <button onClick={() => startCountdown(30)} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg">30s</button>
          <button onClick={() => startCountdown(60)} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg">60s</button>
          <button onClick={() => startCountdown(90)} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg">90s</button>
        </div>
      </div>
      {/* Scores */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-xl p-4">
          <p className="font-bold text-blue-700">Team 1</p>
          <p className="text-4xl font-extrabold text-blue-600 my-2">{team1Score}</p>
          <button onClick={() => setTeam1Score(team1Score + 1)} className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg">+1 Punkt</button>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="font-bold text-red-700">Team 2</p>
          <p className="text-4xl font-extrabold text-red-600 my-2">{team2Score}</p>
          <button onClick={() => setTeam2Score(team2Score + 1)} className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg">+1 Punkt</button>
        </div>
      </div>
      <button onClick={() => { setTeam1Score(0); setTeam2Score(0); }} className="mt-4 text-sm text-muted hover:text-primary">Scores zurucksetzen</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GAME 5: KINGS CUP
   ═══════════════════════════════════════════════════════════════ */

const SUITS = ["\u2660", "\u2665", "\u2666", "\u2663"];
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const KING_RULES: Record<string, { rule: string; ruleAf: string }> = {
  A: { rule: "Wasserfall! Alle trinken, erst aufhoren wenn der Vordermann aufhort.", ruleAf: "Wasserfall! Alle trinken Wasser, erst aufhoren wenn der Vordermann aufhort." },
  "2": { rule: "Du! Wahle jemanden der trinken muss.", ruleAf: "Du! Wahle jemanden der eine Aufgabe machen muss." },
  "3": { rule: "Ich! Du trinkst selbst.", ruleAf: "Ich! Du machst 5 Kniebeugen." },
  "4": { rule: "Boden! Letzter der den Boden beruhrt trinkt.", ruleAf: "Boden! Letzter der den Boden beruhrt macht 10 Hampelmanner." },
  "5": { rule: "Manner trinken!", ruleAf: "Alle die ein blaues Oberteil tragen machen eine Aufgabe." },
  "6": { rule: "Frauen trinken!", ruleAf: "Alle die ein rotes Oberteil tragen machen eine Aufgabe." },
  "7": { rule: "Himmel! Letzter der die Hande hebt trinkt.", ruleAf: "Himmel! Letzter der die Hande hebt macht 5 Liegestutze." },
  "8": { rule: "Trinkpartner! Wahle einen Partner, ihr trinkt zusammen.", ruleAf: "Partner! Wahle einen Partner fur die nachste Runde." },
  "9": { rule: "Reim! Sage ein Wort, alle reimen. Wer keins weiss trinkt.", ruleAf: "Reim! Sage ein Wort, alle reimen. Wer keins weiss macht eine Aufgabe." },
  "10": { rule: "Kategorie! Wahle eine Kategorie (z.B. Biersorten). Wer nichts weiss trinkt.", ruleAf: "Kategorie! Wahle eine Kategorie. Wer nichts weiss macht eine Aufgabe." },
  J: { rule: "Regel! Stelle eine neue Regel auf die bis Spielende gilt.", ruleAf: "Regel! Stelle eine neue Regel auf die bis Spielende gilt." },
  Q: { rule: "Frage-Meister! Wer deine Fragen beantwortet trinkt.", ruleAf: "Frage-Meister! Wer deine Fragen beantwortet macht eine Aufgabe." },
  K: { rule: "Konig! Fulle etwas in den Kings Cup. Beim 4. Konig: Austrinken!", ruleAf: "Konig! Beim 4. Konig: Der Ziehende singt ein Lied!" },
};

function KingsCupGame({ alkoholfrei }: { alkoholfrei: boolean }) {
  const [deck, setDeck] = useState<{ value: string; suit: string }[]>(() => {
    const d: { value: string; suit: string }[] = [];
    for (const suit of SUITS) for (const value of VALUES) d.push({ value, suit });
    return d.sort(() => Math.random() - 0.5);
  });
  const [current, setCurrent] = useState<{ value: string; suit: string } | null>(null);
  const [kingsDrawn, setKingsDrawn] = useState(0);

  const drawCard = () => {
    if (deck.length === 0) return;
    const newDeck = [...deck];
    const card = newDeck.pop()!;
    setDeck(newDeck);
    setCurrent(card);
    if (card.value === "K") setKingsDrawn((k) => k + 1);
  };

  const resetDeck = () => {
    const d: { value: string; suit: string }[] = [];
    for (const suit of SUITS) for (const value of VALUES) d.push({ value, suit });
    setDeck(d.sort(() => Math.random() - 0.5));
    setCurrent(null);
    setKingsDrawn(0);
  };

  const isRed = current && (current.suit === "\u2665" || current.suit === "\u2666");

  return (
    <div className="text-center">
      <p className="text-sm text-muted mb-4">Karten ubrig: {deck.length} / 52 | Konige gezogen: {kingsDrawn}/4</p>
      {/* Card display */}
      <div className="flex justify-center mb-6">
        {current ? (
          <div className={`w-32 h-48 bg-white border-2 ${isRed ? "border-red-300" : "border-gray-300"} rounded-xl shadow-lg flex flex-col items-center justify-center`}>
            <span className={`text-4xl font-bold ${isRed ? "text-red-500" : "text-gray-800"}`}>{current.value}</span>
            <span className={`text-3xl ${isRed ? "text-red-500" : "text-gray-800"}`}>{current.suit}</span>
          </div>
        ) : (
          <div className="w-32 h-48 bg-gradient-to-br from-primary to-primary-dark rounded-xl shadow-lg flex items-center justify-center">
            <span className="text-white text-3xl font-bold">?</span>
          </div>
        )}
      </div>
      {/* Rule */}
      {current && (
        <div className="p-4 bg-light rounded-xl mb-4">
          <p className="text-sm font-semibold text-primary mb-1">{current.value} {current.suit}</p>
          <p className="text-secondary">{alkoholfrei ? KING_RULES[current.value].ruleAf : KING_RULES[current.value].rule}</p>
        </div>
      )}
      <div className="flex gap-2 justify-center">
        <button
          onClick={drawCard}
          disabled={deck.length === 0}
          className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors disabled:opacity-50 shadow-md"
        >
          Karte ziehen
        </button>
        <button onClick={resetDeck} className="px-4 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors">Neues Deck</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GAME 6: ICH HAB NOCH NIE
   ═══════════════════════════════════════════════════════════════ */

const ICHHABNOCHNIE_STATEMENTS = [
  "...einen Cocktail vor 12 Uhr mittags getrunken",
  "...beim Karaoke mitgesungen",
  "...ein ganzes Bier auf ex getrunken",
  "...ein Getrank uber jemanden geschuttet",
  "...heimlich vom Getrank eines anderen getrunken",
  "...einen Bierbauch-Wettbewerb gewonnen",
  "...mehr als 10 verschiedene Biersorten an einem Abend probiert",
  "...auf einer Party eingeschlafen",
  "...bei einem Trinkspiel verloren und die Strafe nicht gemacht",
  "...jemanden auf einer Party geküsst",
  "...einen Cocktail selbst gemixt",
  "...aus einem Schuh getrunken",
  "...sich bei einem Kater geschworen nie wieder zu trinken",
  "...einen Filmabend alleine mit Snacks und Drinks gemacht",
  "...in einer Bar den falschen Drink bekommen und ihn trotzdem getrunken",
  "...auf einem Festival gewesen",
  "...beim Vorglühen ubertrieben",
  "...bei einer Weinprobe mitgemacht",
];
const ICHHABNOCHNIE_AF = [
  "...einen Smoothie selbst gemacht",
  "...drei Liter Wasser an einem Tag getrunken",
  "...einen Energy Drink getrunken",
  "...Cola mit Mentos ausprobiert",
  "...eine neue Saftsorte probiert und sie gehasst",
  "...auf einer Party nur Wasser getrunken",
  "...einen Bubble Tea getrunken",
  "...frisch gepressten Orangensaft gemacht",
  "...heisse Schokolade mit Sahne bestellt",
  "...einen Milchshake in 2 Minuten getrunken",
];

function IchHabNochNieGame({ alkoholfrei }: { alkoholfrei: boolean }) {
  const [current, setCurrent] = useState<string | null>(null);
  const [used, setUsed] = useState<Set<number>>(new Set());

  const draw = () => {
    const list = alkoholfrei ? ICHHABNOCHNIE_AF : ICHHABNOCHNIE_STATEMENTS;
    const available = list.map((_, i) => i).filter((i) => !used.has(i));
    if (available.length === 0) {
      setUsed(new Set());
      setCurrent(list[Math.floor(Math.random() * list.length)]);
      return;
    }
    const idx = available[Math.floor(Math.random() * available.length)];
    setUsed(new Set([...used, idx]));
    setCurrent(list[idx]);
  };

  return (
    <div className="text-center">
      {current ? (
        <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-500 mb-2">Ich hab noch nie...</p>
          <p className="text-xl font-semibold text-secondary">{current}</p>
        </div>
      ) : (
        <div className="p-6 bg-light rounded-xl mb-6">
          <p className="text-muted">Drucke den Button fur das erste Statement!</p>
        </div>
      )}
      <button
        onClick={draw}
        className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors shadow-md"
      >
        Nachstes Statement
      </button>
      {current && (
        <p className="text-sm text-muted mt-4">
          {alkoholfrei ? "Wer es getan hat macht eine Aufgabe!" : "Wer es getan hat trinkt!"}
        </p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GAME 7: COCKTAIL-QUIZ
   ═══════════════════════════════════════════════════════════════ */

type QuizQuestion = { question: string; options: string[]; correct: number };

const QUIZ_QUESTIONS: QuizQuestion[] = [
  { question: "Was ist die Hauptzutat eines Mojito?", options: ["Wodka", "Rum", "Gin", "Tequila"], correct: 1 },
  { question: "Welcher Cocktail besteht aus Champagner und Orangensaft?", options: ["Bellini", "Mimosa", "Kir Royal", "Spritz"], correct: 1 },
  { question: "Was kommt NICHT in einen Cosmopolitan?", options: ["Cranberrysaft", "Limettensaft", "Wodka", "Rum"], correct: 3 },
  { question: "Welcher Cocktail wird traditionell mit einem Salzrand serviert?", options: ["Daiquiri", "Margarita", "Manhattan", "Old Fashioned"], correct: 1 },
  { question: "Was ist ein Aperol Spritz?", options: ["Aperol + Prosecco + Soda", "Aperol + Gin + Tonic", "Aperol + Rum + Cola", "Aperol + Wodka + Saft"], correct: 0 },
  { question: "Welcher Cocktail hat den Beinamen 'The King of Cocktails'?", options: ["Martini", "Manhattan", "Negroni", "Old Fashioned"], correct: 0 },
  { question: "Was ist die Basis eines Pina Colada?", options: ["Wodka + Ananassaft", "Rum + Kokosmilch + Ananas", "Gin + Kokoswasser", "Tequila + Sahne"], correct: 1 },
  { question: "Wie heisst der Cocktail aus Wodka, Kaffeelikoer und Espresso?", options: ["Irish Coffee", "Espresso Martini", "Black Russian", "Carajillo"], correct: 1 },
  { question: "Welche Spirituose wird fur einen Caipirinha verwendet?", options: ["Rum", "Pisco", "Cachaca", "Mezcal"], correct: 2 },
  { question: "Was bedeutet 'on the rocks'?", options: ["Geschuttelt", "Mit Eis", "Ohne Eis", "Doppelte Portion"], correct: 1 },
  { question: "Welcher Cocktail enthalt Bourbon, Zucker und Angostura Bitters?", options: ["Whiskey Sour", "Manhattan", "Old Fashioned", "Mint Julep"], correct: 2 },
  { question: "Woher stammt der Moscow Mule?", options: ["Moskau", "USA", "England", "Schweden"], correct: 1 },
];

function CocktailQuizGame() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [timerId, setTimerId] = useState<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    setTimeLeft(15);
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    setTimerId(id);
    return id;
  };

  const handleStart = () => {
    setQuestionIndex(0);
    setScore(0);
    setSelected(null);
    setFinished(false);
    startTimer();
  };

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (timerId) clearInterval(timerId);
    const q = QUIZ_QUESTIONS[questionIndex];
    if (idx === q.correct) setScore((s) => s + (timeLeft > 10 ? 30 : timeLeft > 5 ? 20 : 10));
  };

  const nextQuestion = () => {
    if (questionIndex + 1 >= QUIZ_QUESTIONS.length) {
      setFinished(true);
      return;
    }
    setQuestionIndex((i) => i + 1);
    setSelected(null);
    startTimer();
  };

  if (finished) {
    return (
      <div className="text-center">
        <div className="text-5xl mb-4">{score > 200 ? "\u{1F3C6}" : score > 100 ? "\u{1F44D}" : "\u{1F4AA}"}</div>
        <p className="text-2xl font-extrabold text-secondary">{score} Punkte</p>
        <p className="text-muted mt-2">{QUIZ_QUESTIONS.length} Fragen beantwortet</p>
        <button onClick={handleStart} className="mt-4 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl">Nochmal spielen</button>
      </div>
    );
  }

  if (questionIndex === 0 && selected === null && timeLeft === 15) {
    return (
      <div className="text-center">
        <p className="text-muted mb-4">Teste dein Cocktail-Wissen! {QUIZ_QUESTIONS.length} Fragen, je schneller desto mehr Punkte.</p>
        <button onClick={handleStart} className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-md">Quiz starten</button>
      </div>
    );
  }

  const q = QUIZ_QUESTIONS[questionIndex];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-muted">Frage {questionIndex + 1}/{QUIZ_QUESTIONS.length}</span>
        <span className="text-sm font-bold text-primary">{score} Pkt.</span>
      </div>
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-1000 ${timeLeft <= 5 ? "bg-red-500" : "bg-green-500"}`} style={{ width: `${(timeLeft / 15) * 100}%` }} />
        </div>
        <span className={`text-sm font-bold ${timeLeft <= 5 ? "text-red-500" : "text-muted"}`}>{timeLeft}s</span>
      </div>
      <p className="text-lg font-semibold text-secondary mb-4">{q.question}</p>
      <div className="space-y-2">
        {q.options.map((opt, i) => {
          let cls = "w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm font-medium ";
          if (selected !== null) {
            if (i === q.correct) cls += "bg-green-50 border-green-300 text-green-700";
            else if (i === selected) cls += "bg-red-50 border-red-300 text-red-700";
            else cls += "bg-light border-border text-muted";
          } else {
            cls += "bg-white border-border text-secondary hover:border-primary hover:bg-red-50";
          }
          return (
            <button key={i} onClick={() => handleAnswer(i)} className={cls} disabled={selected !== null}>
              {opt}
            </button>
          );
        })}
      </div>
      {selected !== null && (
        <button onClick={nextQuestion} className="mt-4 w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-colors">
          {questionIndex + 1 >= QUIZ_QUESTIONS.length ? "Ergebnis anzeigen" : "Nachste Frage"}
        </button>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GAME 8: GETRANKE-TABU
   ═══════════════════════════════════════════════════════════════ */

type TabuCard = { word: string; forbidden: string[] };

const TABU_CARDS: TabuCard[] = [
  { word: "Bier", forbidden: ["Hopfen", "Malz", "Pils", "Weizen", "Brauerei"] },
  { word: "Rotwein", forbidden: ["Traube", "Rot", "Wein", "Frankreich", "Fass"] },
  { word: "Cola", forbidden: ["Zucker", "Schwarz", "Koffein", "Dose", "Coca"] },
  { word: "Champagner", forbidden: ["Frankreich", "Sekt", "Korken", "Prickelnd", "Feier"] },
  { word: "Espresso", forbidden: ["Kaffee", "Italienisch", "Stark", "Klein", "Bohne"] },
  { word: "Orangensaft", forbidden: ["Orange", "Frucht", "Pressen", "Fruhstuck", "Vitamin"] },
  { word: "Gin Tonic", forbidden: ["Wacholder", "Tonic", "Eis", "Gurke", "Longdrink"] },
  { word: "Milch", forbidden: ["Kuh", "Weiss", "Calcium", "Trinken", "Bauernhof"] },
  { word: "Aperol Spritz", forbidden: ["Orange", "Prosecco", "Sommer", "Eis", "Bitter"] },
  { word: "Whiskey", forbidden: ["Schottland", "Fass", "Rauch", "Eis", "Malz"] },
  { word: "Smoothie", forbidden: ["Obst", "Mixer", "Gesund", "Banane", "Shake"] },
  { word: "Radler", forbidden: ["Bier", "Limo", "Zitrone", "Sommer", "Mischung"] },
  { word: "Mojito", forbidden: ["Minze", "Rum", "Limette", "Zucker", "Kuba"] },
  { word: "Sprudel", forbidden: ["Wasser", "Kohlensaure", "Blubber", "Mineral", "Flasche"] },
];

function TabuGame() {
  const [currentCard, setCurrentCard] = useState<TabuCard | null>(null);
  const [score, setScore] = useState({ correct: 0, skip: 0 });
  const [timer, setTimer] = useState(60);
  const [running, setRunning] = useState(false);
  const [tId, setTId] = useState<ReturnType<typeof setInterval> | null>(null);
  const [usedIndices, setUsedIndices] = useState<Set<number>>(new Set());

  const drawCard = () => {
    const available = TABU_CARDS.map((_, i) => i).filter((i) => !usedIndices.has(i));
    if (available.length === 0) {
      setUsedIndices(new Set());
      setCurrentCard(TABU_CARDS[Math.floor(Math.random() * TABU_CARDS.length)]);
      return;
    }
    const idx = available[Math.floor(Math.random() * available.length)];
    setUsedIndices(new Set([...usedIndices, idx]));
    setCurrentCard(TABU_CARDS[idx]);
  };

  const start = () => {
    setScore({ correct: 0, skip: 0 });
    setTimer(60);
    setRunning(true);
    setUsedIndices(new Set());
    drawCard();
    const id = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(id);
          setRunning(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    setTId(id);
  };

  const handleCorrect = () => {
    setScore((s) => ({ ...s, correct: s.correct + 1 }));
    drawCard();
  };

  const handleSkip = () => {
    setScore((s) => ({ ...s, skip: s.skip + 1 }));
    drawCard();
  };

  if (!running && timer === 0) {
    return (
      <div className="text-center">
        <p className="text-4xl mb-2">{"\u{23F0}"}</p>
        <p className="text-xl font-bold text-secondary">Zeit abgelaufen!</p>
        <p className="text-muted mt-2">Richtig: {score.correct} | Ubersprungen: {score.skip}</p>
        <button onClick={start} className="mt-4 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl">Nochmal spielen</button>
      </div>
    );
  }

  if (!running) {
    return (
      <div className="text-center">
        <p className="text-muted mb-4">Ein Spieler beschreibt das Getrank — aber die verbotenen Worter durfen nicht gesagt werden! 60 Sekunden Zeit.</p>
        <button onClick={start} className="px-8 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl shadow-md">Spiel starten</button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-muted">Richtig: {score.correct}</span>
        <span className={`text-lg font-bold ${timer <= 10 ? "text-red-500 animate-pulse" : "text-secondary"}`}>{timer}s</span>
        <span className="text-sm text-muted">Skip: {score.skip}</span>
      </div>
      {currentCard && (
        <div className="bg-white border-2 border-primary rounded-xl p-6 text-center mb-4">
          <p className="text-2xl font-extrabold text-primary mb-4">{currentCard.word}</p>
          <div className="space-y-1.5">
            {currentCard.forbidden.map((w) => (
              <div key={w} className="flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span className="text-sm font-medium text-red-600">{w}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleCorrect} className="py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors">Richtig!</button>
        <button onClick={handleSkip} className="py-3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold rounded-xl transition-colors">Uberspringen</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */

export default function PartyspielePageContent() {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [alkoholfrei, setAlkoholfrei] = useState(false);

  const renderGame = () => {
    switch (activeGame) {
      case "roulette": return <RouletteGame alkoholfrei={alkoholfrei} />;
      case "wahrheit": return <WahrheitOderPflichtGame alkoholfrei={alkoholfrei} />;
      case "bierpong": return <BierPongGame />;
      case "flunkyball": return <FlunkyballGame />;
      case "kingscup": return <KingsCupGame alkoholfrei={alkoholfrei} />;
      case "ichhabnochnie": return <IchHabNochNieGame alkoholfrei={alkoholfrei} />;
      case "cocktailquiz": return <CocktailQuizGame />;
      case "tabu": return <TabuGame />;
      default: return null;
    }
  };

  const activeMeta = GAMES.find((g) => g.id === activeGame);

  return (
    <>
    {/* Red Hero Banner */}
    <div className="page-hero-banner py-16 md:py-24">
      <ShimmerParticles />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
        <nav className="text-sm text-white/60 mb-4"><a href="/" className="hover:text-white">Home</a> <span className="mx-1">/</span> <span className="text-white">Partyspiele</span></nav>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-3">Partyspiele</h1>
        <p className="text-white/80 max-w-lg mx-auto text-lg">
          8 Spiele direkt im Browser spielen — perfekt für jede Party! Einfach Spiel wählen und loslegen.
        </p>
      </div>
    </div>
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

      {/* Game Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {GAMES.map((game) => (
          <button
            key={game.id}
            onClick={() => setActiveGame(game.id)}
            className="group bg-white rounded-2xl border border-border hover:border-primary/30 transition-all overflow-hidden text-left p-5 card-hover-glow"
          >
            <span className="text-4xl">{game.icon}</span>
            <h3 className="font-bold text-secondary mt-3 group-hover:text-primary transition-colors">{game.name}</h3>
            <p className="text-xs text-muted mt-1 line-clamp-2">{game.description}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-muted flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {game.players}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${game.difficultyColor}`}>
                {game.difficulty}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Active Game Modal */}
      {activeGame && activeMeta && (
        <GameModal
          title={activeMeta.name}
          icon={activeMeta.icon}
          onClose={() => setActiveGame(null)}
          alkoholfrei={alkoholfrei}
          setAlkoholfrei={setAlkoholfrei}
        >
          {renderGame()}
          <ShareButton gameName={activeMeta.name} />
        </GameModal>
      )}
    </div>
    </>
  );
}
