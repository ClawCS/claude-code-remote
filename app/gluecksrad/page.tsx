"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

/* ─── Segment definitions ─── */
type Segment = {
  label: string;
  color: string;
  textColor: string;
  weight: number; // higher = more likely
  isJackpot?: boolean;
};

const segments: Segment[] = [
  { label: "10% auf\neinen Kasten", color: "#EAB308", textColor: "#1a1a00", weight: 9 },
  { label: "Gratis\nEnergy Drink", color: "#22C55E", textColor: "#ffffff", weight: 9 },
  { label: "Trinkgut\nSchlüsselband", color: "#3B82F6", textColor: "#ffffff", weight: 9 },
  { label: "Gratis\nLikör 2cl", color: "#8B5CF6", textColor: "#ffffff", weight: 9 },
  { label: "Niete\nNächstes Mal!", color: "#6B7280", textColor: "#ffffff", weight: 14 },
  { label: "5€\nGutschein", color: "#D4A017", textColor: "#1a1a00", weight: 5 },
  { label: "Gratis\nWasser 0.5L", color: "#06B6D4", textColor: "#ffffff", weight: 9 },
  { label: "Niete\nFast!", color: "#6B7280", textColor: "#ffffff", weight: 13 },
  { label: "2 für 1 auf\nSoftdrinks", color: "#F97316", textColor: "#ffffff", weight: 5 },
  { label: "Trinkgut Jammers\nSticker", color: "#EC4899", textColor: "#ffffff", weight: 9 },
  { label: "Niete\nSo knapp!", color: "#6B7280", textColor: "#ffffff", weight: 13 },
  { label: "JACKPOT!\n1 Kasten gratis!", color: "#DC2626", textColor: "#ffffff", weight: 5, isJackpot: true },
];

const TOTAL_WEIGHT = segments.reduce((s, seg) => s + seg.weight, 0);
const SEGMENT_ANGLE = 360 / segments.length;
const LS_SPIN = "gluecksrad-data";

type SpinRecord = {
  contact: string;
  prize: string;
  date: string;
};

/* ─── Confetti ─── */
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ["#DC2626", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#FFD700"];
  return (
    <div className="fixed inset-0 pointer-events-none z-50" aria-hidden>
      {Array.from({ length: 80 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.6;
        const dur = 1.5 + Math.random() * 2;
        const color = colors[i % colors.length];
        const size = 6 + Math.random() * 10;
        return (
          <span
            key={i}
            className="absolute top-0 rounded-sm"
            style={{
              left: `${left}%`,
              width: size,
              height: size * 0.6,
              background: color,
              animation: `glueckConfetti ${dur}s ${delay}s ease-in forwards`,
              opacity: 0,
            }}
          />
        );
      })}
    </div>
  );
}

/* ─── Weighted random ─── */
function pickSegment(): number {
  let r = Math.random() * TOTAL_WEIGHT;
  for (let i = 0; i < segments.length; i++) {
    r -= segments[i].weight;
    if (r <= 0) return i;
  }
  return 0;
}

/* ─── Main ─── */
export default function GluecksradPage() {
  const [mounted, setMounted] = useState(false);
  const [contact, setContact] = useState("");
  const [contactError, setContactError] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<Segment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState("");
  const wheelRef = useRef<HTMLDivElement>(null);

  /* Check cooldown */
  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(LS_SPIN);
      if (raw) {
        const data: SpinRecord = JSON.parse(raw);
        const lastSpin = new Date(data.date).getTime();
        const diff = Date.now() - lastSpin;
        if (diff < 86400000) {
          setCooldown(true);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  /* Cooldown timer */
  useEffect(() => {
    if (!cooldown) return;
    function update() {
      try {
        const raw = localStorage.getItem(LS_SPIN);
        if (!raw) return;
        const data: SpinRecord = JSON.parse(raw);
        const lastSpin = new Date(data.date).getTime();
        const diff = 86400000 - (Date.now() - lastSpin);
        if (diff <= 0) {
          setCooldown(false);
          setCooldownRemaining("");
          return;
        }
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setCooldownRemaining(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      } catch {
        /* ignore */
      }
    }
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [cooldown]);

  const validateContact = useCallback((val: string) => {
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phone = /^[\d+\s()-]{8,}$/;
    return email.test(val) || phone.test(val);
  }, []);

  const handleSpin = useCallback(() => {
    if (spinning || cooldown) return;
    if (!validateContact(contact.trim())) {
      setContactError("Bitte gib eine gültige E-Mail oder WhatsApp-Nummer ein.");
      return;
    }
    setContactError("");
    setSpinning(true);

    const winIndex = pickSegment();
    // Calculate rotation: pointer is at the top (12 o'clock).
    // The winning segment's center must align with the pointer.
    // CSS rotates the wheel clockwise, so we subtract the segment position.
    const segmentMiddle = winIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const fullSpins = (5 + Math.floor(Math.random() * 3)) * 360; // 5-7 full spins
    const targetRotation = rotation + fullSpins + (360 - segmentMiddle);

    setRotation(targetRotation);

    setTimeout(() => {
      setSpinning(false);
      const won = segments[winIndex];
      setResult(won);
      setShowModal(true);

      // Save to localStorage
      const record: SpinRecord = {
        contact: contact.trim(),
        prize: won.label.replace("\n", " "),
        date: new Date().toISOString(),
      };
      localStorage.setItem(LS_SPIN, JSON.stringify(record));
      setCooldown(true);

      // Confetti for wins (not for Nieten)
      if (!won.label.toLowerCase().includes("niete")) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3500);
      }
    }, 4500);
  }, [spinning, cooldown, contact, rotation, validateContact]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @keyframes glueckConfetti {
          0% { opacity: 1; transform: translateY(-10px) rotate(0deg); }
          100% { opacity: 0; transform: translateY(100vh) rotate(720deg); }
        }
        @keyframes jackpotBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spinPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(220,38,38,0.4); }
          50% { transform: scale(1.05); box-shadow: 0 0 40px rgba(220,38,38,0.7); }
        }
      `}</style>

      <Confetti active={showConfetti} />

      {/* Red Hero Banner */}
      <div className="page-hero-banner py-16 md:py-24">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <nav className="text-sm text-white/60 mb-4"><a href="/" className="hover:text-white">Home</a> <span className="mx-1">/</span> <span className="text-white">Glücksrad</span></nav>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg mb-3">Glücksrad</h1>
          <p className="text-white/80 max-w-lg mx-auto text-lg">Drehe das Rad und gewinne tolle Preise!</p>
        </div>
      </div>

      {/* Win Modal */}
      {showModal && result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="text-5xl mb-4">
              {result.label.toLowerCase().includes("niete") ? "😅" : "🎉"}
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              {result.label.toLowerCase().includes("niete") ? "Leider nichts gewonnen!" : "Herzlichen Glückwunsch!"}
            </h3>
            <div
              className="inline-block px-4 py-2 rounded-lg text-lg font-bold mb-4"
              style={{ background: result.color, color: result.textColor }}
            >
              {result.label.replace("\n", " ")}
            </div>
            {!result.label.toLowerCase().includes("niete") && (
              <p className="text-gray-400 text-sm mb-4">
                Zeige diesen Bildschirm bei deinem n&auml;chsten Besuch im Trinkgut Jammers Goch vor, um deinen Gewinn einzul&ouml;sen!
              </p>
            )}
            <button
              onClick={() => setShowModal(false)}
              className="mt-2 px-6 py-3 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Schlie&szlig;en
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-950 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-0 left-1/3 w-96 h-96 rounded-full bg-purple-600/10 blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 rounded-full bg-red-600/10 blur-3xl" />

        {/* Wheel Section */}
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-4 pb-8">
          {/* Pointer (fixed at top) */}
          <div className="relative flex justify-center mb-[-12px] z-20">
            <div
              className="w-0 h-0"
              style={{
                borderLeft: "16px solid transparent",
                borderRight: "16px solid transparent",
                borderTop: "28px solid #FFD700",
                filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
              }}
            />
          </div>

          {/* Wheel container */}
          <div className="relative mx-auto" style={{ width: "min(85vw, 380px)", height: "min(85vw, 380px)" }}>
            <div
              ref={wheelRef}
              className="w-full h-full rounded-full border-[6px] border-amber-400 shadow-[0_0_30px_rgba(255,215,0,0.3)]"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? "transform 4.5s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* SVG Wheel */}
              <svg viewBox="0 0 400 400" className="w-full h-full" style={{ display: "block" }}>
                {segments.map((seg, i) => {
                  const startAngle = i * SEGMENT_ANGLE - 90; // -90 so segment 0 starts at top
                  const endAngle = startAngle + SEGMENT_ANGLE;
                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;
                  const cx = 200;
                  const cy = 200;
                  const r = 194;
                  const x1 = cx + r * Math.cos(startRad);
                  const y1 = cy + r * Math.sin(startRad);
                  const x2 = cx + r * Math.cos(endRad);
                  const y2 = cy + r * Math.sin(endRad);
                  const largeArc = SEGMENT_ANGLE > 180 ? 1 : 0;
                  const midAngle = ((startAngle + endAngle) / 2) * (Math.PI / 180);
                  const textR = r * 0.62;
                  const tx = cx + textR * Math.cos(midAngle);
                  const ty = cy + textR * Math.sin(midAngle);
                  const textRotation = (startAngle + endAngle) / 2 + 90;
                  const lines = seg.label.split("\n");
                  return (
                    <g key={i}>
                      <path
                        d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`}
                        fill={seg.color}
                        stroke="#1f2937"
                        strokeWidth="1.5"
                        style={seg.isJackpot ? { animation: "jackpotBlink 1s ease-in-out infinite" } : undefined}
                      />
                      <text
                        x={tx}
                        y={ty}
                        textAnchor="middle"
                        fill={seg.textColor}
                        fontSize="11"
                        fontWeight="bold"
                        transform={`rotate(${textRotation}, ${tx}, ${ty})`}
                      >
                        {lines.map((line, li) => (
                          <tspan key={li} x={tx} dy={li === 0 ? (lines.length > 1 ? "-0.4em" : "0.35em") : "1.15em"}>
                            {line}
                          </tspan>
                        ))}
                      </text>
                    </g>
                  );
                })}
                {/* Center circle */}
                <circle cx="200" cy="200" r="30" fill="#1f2937" stroke="#FFD700" strokeWidth="3" />
                <text x="200" y="205" textAnchor="middle" fill="#FFD700" fontSize="10" fontWeight="bold">
                  DREH!
                </text>
              </svg>
            </div>
          </div>

          {/* Contact Input */}
          <div className="mt-8 max-w-sm mx-auto">
            {!cooldown && (
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2 text-center">
                  E-Mail oder WhatsApp-Nummer eingeben (Pflicht)
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => {
                    setContact(e.target.value);
                    setContactError("");
                  }}
                  placeholder="name@email.de oder +49..."
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-colors text-center"
                  disabled={spinning}
                />
                {contactError && <p className="text-red-400 text-xs mt-1 text-center">{contactError}</p>}
              </div>
            )}

            {/* Spin button */}
            {cooldown ? (
              <div className="text-center">
                <div className="px-6 py-4 bg-gray-900 border border-gray-700 rounded-xl">
                  <p className="text-gray-400 text-sm mb-1">Du hast heute schon gedreht!</p>
                  <p className="text-amber-400 font-mono font-bold text-lg">
                    N&auml;chster Versuch in: {cooldownRemaining}
                  </p>
                </div>
              </div>
            ) : (
              <button
                onClick={handleSpin}
                disabled={spinning}
                className={`w-full py-4 rounded-xl text-white font-extrabold text-xl tracking-wider transition-all ${
                  spinning
                    ? "bg-gray-700 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 active:scale-95"
                }`}
                style={!spinning ? { animation: "spinPulse 2s ease-in-out infinite" } : undefined}
              >
                {spinning ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Dreht sich...
                  </span>
                ) : (
                  "🎰 DREHEN!"
                )}
              </button>
            )}
          </div>

          {/* Info */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-xs">
              1x pro Tag drehen &bull; Gewinne im Markt einl&ouml;sbar &bull; Trinkgut Jammers Goch
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
