"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import products from "@/data/products.json";

/* ─── Types ─── */
type Product = {
  id: number;
  name: string;
  slug: string;
  price: number;
  image: string;
  category: string;
};

type Duel = {
  kw: number;
  year: number;
  leftSlug: string;
  rightSlug: string;
  /** fallback data when a product isn't in products.json */
  fallback?: Record<string, Partial<Product>>;
};

type VoteRecord = Record<string, "left" | "right">;
type VoteCountRecord = Record<string, { left: number; right: number }>;

/* ─── Duel schedule ─── */
const duels: Duel[] = [
  {
    kw: 14,
    year: 2026,
    leftSlug: "krombacher-pils",
    rightSlug: "bitburger-pils",
    fallback: {
      "krombacher-pils": {
        id: 9999,
        name: "Krombacher Pils",
        slug: "krombacher-pils",
        price: 12.99,
        image:
          "https://media.trinkgut.de/media/products_md/uploads/promotions/trinkgut-krombacher-pils-20x0-5l-mw-komp-69b934395e1a5830149062.png",
        category: "Bier",
      },
    },
  },
  {
    kw: 15,
    year: 2026,
    leftSlug: "afri-cola-o-bluna-orange",
    rightSlug: "coca-cola-fanta-o-sprite",
  },
  {
    kw: 16,
    year: 2026,
    leftSlug: "heineken",
    rightSlug: "carlsberg-lager-beer",
  },
  {
    kw: 17,
    year: 2026,
    leftSlug: "aperol",
    rightSlug: "ramazzotti",
  },
  {
    kw: 18,
    year: 2026,
    leftSlug: "usa-jack-daniel-s",
    rightSlug: "usa-jim-beam-black",
  },
];

/* ─── Helpers ─── */
const LS_VOTES = "battle-votes";
const LS_COUNTS = "battle-counts";

function getISOWeek(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function nextMonday(): Date {
  const now = new Date();
  const d = new Date(now);
  d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

function findProduct(slug: string, duel: Duel): Product {
  const found = (products as Product[]).find((p) => p.slug === slug);
  if (found) return found;
  if (duel.fallback?.[slug]) return duel.fallback[slug] as Product;
  return {
    id: 0,
    name: slug,
    slug,
    price: 0,
    image: "",
    category: "",
  };
}

function duelKey(d: Duel) {
  return `${d.year}-kw${d.kw}`;
}

function getCurrentDuel(): Duel {
  const now = new Date();
  const kw = getISOWeek(now);
  const year = now.getFullYear();
  const current = duels.find((d) => d.kw === kw && d.year === year);
  return current || duels[0];
}

/* ─── Confetti component ─── */
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ["#DC2626", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#FFD700"];
  return (
    <div className="fixed inset-0 pointer-events-none z-50" aria-hidden>
      {Array.from({ length: 60 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const dur = 1.5 + Math.random() * 2;
        const color = colors[i % colors.length];
        const size = 6 + Math.random() * 8;
        return (
          <span
            key={i}
            className="absolute top-0 rounded-sm"
            style={{
              left: `${left}%`,
              width: size,
              height: size * 0.6,
              background: color,
              animation: `confettiFall ${dur}s ${delay}s ease-in forwards`,
              opacity: 0,
            }}
          />
        );
      })}
    </div>
  );
}

/* ─── Main page ─── */
export default function BattlePage() {
  const [currentDuel, setCurrentDuel] = useState<Duel>(duels[0]);
  const [votes, setVotes] = useState<VoteRecord>({});
  const [counts, setCounts] = useState<VoteCountRecord>({});
  const [showConfetti, setShowConfetti] = useState(false);
  const [countdown, setCountdown] = useState("");
  const [mounted, setMounted] = useState(false);

  /* Hydrate from localStorage */
  useEffect(() => {
    setMounted(true);
    setCurrentDuel(getCurrentDuel());
    try {
      const v = localStorage.getItem(LS_VOTES);
      if (v) setVotes(JSON.parse(v));
      const c = localStorage.getItem(LS_COUNTS);
      if (c) setCounts(JSON.parse(c));
    } catch {
      /* ignore */
    }
  }, []);

  /* Countdown */
  useEffect(() => {
    function update() {
      const target = nextMonday();
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setCountdown("Neues Duell startet...");
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${d}T ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    }
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, []);

  const key = duelKey(currentDuel);
  const hasVoted = !!votes[key];
  const currentCounts = counts[key] || { left: 0, right: 0 };
  const totalVotes = currentCounts.left + currentCounts.right;

  const handleVote = useCallback(
    (side: "left" | "right") => {
      if (hasVoted) return;
      const newVotes = { ...votes, [key]: side };
      const prev = counts[key] || { left: 0, right: 0 };
      const newCounts = {
        ...counts,
        [key]: {
          left: prev.left + (side === "left" ? 1 : 0),
          right: prev.right + (side === "right" ? 1 : 0),
        },
      };
      setVotes(newVotes);
      setCounts(newCounts);
      localStorage.setItem(LS_VOTES, JSON.stringify(newVotes));
      localStorage.setItem(LS_COUNTS, JSON.stringify(newCounts));
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    },
    [hasVoted, votes, counts, key],
  );

  const left = findProduct(currentDuel.leftSlug, currentDuel);
  const right = findProduct(currentDuel.rightSlug, currentDuel);

  const pastDuels = duels.filter((d) => duelKey(d) !== key);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Confetti animation keyframes */}
      <style jsx global>{`
        @keyframes confettiFall {
          0% {
            opacity: 1;
            transform: translateY(-10px) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(100vh) rotate(720deg);
          }
        }
        @keyframes spotlightPulse {
          0%, 100% { opacity: 0.08; }
          50% { opacity: 0.15; }
        }
        @keyframes vsPulse {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.15) rotate(5deg); }
        }
        @keyframes vsGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(220,38,38,0.4), 0 0 40px rgba(255,215,0,0.2); }
          50% { box-shadow: 0 0 30px rgba(220,38,38,0.7), 0 0 60px rgba(255,215,0,0.4); }
        }
        @keyframes barGrow {
          from { width: 0%; }
        }
      `}</style>

      <Confetti active={showConfetti} />

      {/* Red Hero Banner */}
      <div className="page-hero-banner py-16 md:py-24">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <nav className="text-sm text-white/60 mb-4"><a href="/" className="hover:text-white">Home</a> <span className="mx-1">/</span> <span className="text-white">Getränke-Battle</span></nav>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-3">Getränke-Battle</h1>
          <p className="text-white/80 max-w-lg mx-auto text-lg">Wöchentliches Voting-Duell — Welches Getränk gewinnt?</p>
        </div>
      </div>

      <div className="min-h-screen bg-gray-950 relative overflow-hidden">
        {/* Spotlight effects */}
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-red-600/10 blur-3xl"
          style={{ animation: "spotlightPulse 4s ease-in-out infinite" }}
        />
        <div
          className="absolute top-20 right-1/4 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl"
          style={{ animation: "spotlightPulse 4s 1s ease-in-out infinite" }}
        />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-red-900/5 blur-3xl" />

        {/* Header */}
        <div className="relative z-10 pt-8 pb-4 text-center">

          {/* Countdown */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-900/80 border border-gray-700 rounded-full">
            <span className="text-gray-400 text-sm">N&auml;chstes Duell in:</span>
            <span className="font-mono font-bold text-amber-400 text-sm">{countdown}</span>
          </div>
        </div>

        {/* KW badge */}
        <div className="text-center mb-6">
          <span className="inline-block px-3 py-1 bg-red-600/20 border border-red-600/40 rounded-full text-red-400 text-xs font-semibold tracking-wider uppercase">
            KW {currentDuel.kw} &bull; {currentDuel.year}
          </span>
        </div>

        {/* Battle Arena */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 pb-12">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-0 items-center">
            {/* Left Fighter */}
            <FighterCard
              product={left}
              side="left"
              voted={votes[key]}
              onVote={() => handleVote("left")}
              hasVoted={hasVoted}
              count={currentCounts.left}
              total={totalVotes}
            />

            {/* VS Badge */}
            <div className="flex items-center justify-center md:px-6">
              <div
                className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center text-2xl md:text-3xl font-black text-white"
                style={{
                  background: "linear-gradient(135deg, #DC2626 0%, #FFD700 50%, #DC2626 100%)",
                  animation: "vsPulse 2s ease-in-out infinite, vsGlow 2s ease-in-out infinite",
                }}
              >
                VS
              </div>
            </div>

            {/* Right Fighter */}
            <FighterCard
              product={right}
              side="right"
              voted={votes[key]}
              onVote={() => handleVote("right")}
              hasVoted={hasVoted}
              count={currentCounts.right}
              total={totalVotes}
            />
          </div>

          {/* Results bar after voting */}
          {hasVoted && totalVotes > 0 && (
            <div className="mt-10 max-w-xl mx-auto">
              <p className="text-gray-400 text-sm text-center mb-3">
                {totalVotes} {totalVotes === 1 ? "Stimme" : "Stimmen"} abgegeben
              </p>
              <div className="flex items-center gap-2">
                <span className="text-red-400 font-bold text-sm w-10 text-right">
                  {totalVotes > 0 ? Math.round((currentCounts.left / totalVotes) * 100) : 0}%
                </span>
                <div className="flex-1 h-6 bg-gray-800 rounded-full overflow-hidden flex">
                  <div
                    className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-l-full transition-all duration-1000"
                    style={{
                      width: `${totalVotes > 0 ? (currentCounts.left / totalVotes) * 100 : 50}%`,
                      animation: "barGrow 1s ease-out",
                    }}
                  />
                  <div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-r-full transition-all duration-1000"
                    style={{
                      width: `${totalVotes > 0 ? (currentCounts.right / totalVotes) * 100 : 50}%`,
                      animation: "barGrow 1s ease-out",
                    }}
                  />
                </div>
                <span className="text-blue-400 font-bold text-sm w-10">
                  {totalVotes > 0 ? Math.round((currentCounts.right / totalVotes) * 100) : 0}%
                </span>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>{left.name}</span>
                <span>{right.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Past Duels Archive */}
        {pastDuels.length > 0 && (
          <div className="relative z-10 max-w-5xl mx-auto px-4 pb-16">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="text-amber-400">&#x1F3C6;</span> Vergangene Duelle
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastDuels.map((d) => {
                const l = findProduct(d.leftSlug, d);
                const r = findProduct(d.rightSlug, d);
                const dk = duelKey(d);
                const dCounts = counts[dk] || { left: 0, right: 0 };
                const dTotal = dCounts.left + dCounts.right;
                const userVote = votes[dk];
                return (
                  <div key={dk} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500 font-mono">KW {d.kw}</span>
                      {userVote && (
                        <span className="text-[10px] px-2 py-0.5 bg-green-900/40 text-green-400 rounded-full">
                          Abgestimmt
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-white font-medium truncate flex-1">{l.name}</span>
                      <span className="text-amber-400 font-bold text-xs">VS</span>
                      <span className="text-white font-medium truncate flex-1 text-right">{r.name}</span>
                    </div>
                    {dTotal > 0 && (
                      <div className="mt-2 flex h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="bg-red-500 rounded-l-full"
                          style={{ width: `${(dCounts.left / dTotal) * 100}%` }}
                        />
                        <div
                          className="bg-blue-500 rounded-r-full"
                          style={{ width: `${(dCounts.right / dTotal) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Fighter Card ─── */
function FighterCard({
  product,
  side,
  voted,
  onVote,
  hasVoted,
  count,
  total,
}: {
  product: Product;
  side: "left" | "right";
  voted?: "left" | "right";
  onVote: () => void;
  hasVoted: boolean;
  count: number;
  total: number;
}) {
  const isWinner = hasVoted && voted === side;
  const borderColor = side === "left" ? "border-red-600/40" : "border-blue-600/40";
  const glowColor = side === "left" ? "shadow-red-600/20" : "shadow-blue-600/20";
  const btnGradient =
    side === "left"
      ? "from-red-600 to-red-500 hover:from-red-500 hover:to-red-400"
      : "from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400";

  return (
    <div
      className={`relative bg-gray-900/80 border ${borderColor} rounded-2xl p-6 flex flex-col items-center text-center shadow-lg ${glowColor} transition-all duration-300 ${
        isWinner ? "ring-2 ring-amber-400 scale-[1.02]" : ""
      }`}
    >
      {isWinner && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-amber-400 text-gray-900 text-xs font-bold rounded-full">
          DEINE WAHL
        </div>
      )}

      {/* Product Image */}
      <div className="w-36 h-36 md:w-44 md:h-44 relative mb-4 flex-shrink-0">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            sizes="(max-width:768px) 144px, 176px"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 rounded-lg flex items-center justify-center text-gray-600 text-4xl">
            &#x1F37A;
          </div>
        )}
      </div>

      <h3 className="text-white font-bold text-lg md:text-xl mb-1 leading-tight">{product.name}</h3>
      <p className="text-amber-400 font-semibold text-lg mb-1">{product.price.toFixed(2)} &euro;</p>
      <p className="text-gray-500 text-xs mb-4">{product.category}</p>

      {!hasVoted ? (
        <button
          onClick={onVote}
          className={`w-full py-3 px-6 rounded-xl bg-gradient-to-r ${btnGradient} text-white font-bold text-lg shadow-lg transition-all duration-200 active:scale-95 flex items-center justify-center gap-2`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M2 20h2c.55 0 1-.45 1-1v-9c0-.55-.45-1-1-1H2v11zm19.83-7.12c.11-.25.17-.52.17-.8V11c0-1.1-.9-2-2-2h-5.5l.92-4.65c.05-.22.02-.46-.08-.66-.23-.45-.52-.86-.88-1.22L14 2 7.59 8.41C7.21 8.79 7 9.3 7 9.83v7.84C7 18.95 8.05 20 9.34 20h8.11c.7 0 1.36-.37 1.72-.97l2.66-6.15z" />
          </svg>
          VOTE!
        </button>
      ) : (
        <div className="w-full text-center">
          <div className="py-2 px-4 rounded-xl bg-gray-800 text-gray-400 font-medium">
            {total > 0 ? `${Math.round((count / total) * 100)}%` : "0%"} &bull; {count} Stimmen
          </div>
        </div>
      )}
    </div>
  );
}
