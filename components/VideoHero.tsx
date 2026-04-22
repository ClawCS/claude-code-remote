"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function VideoHero() {
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setPaused(true);
      setReducedMotion(true);
    }
    const handler = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
      if (e.matches) setPaused(true);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Countdown to 24.07.2026
  useEffect(() => {
    const target = new Date("2026-07-24T12:00:00").getTime();
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const playState = paused ? "paused" : "running";

  return (
    <section className="relative bg-black overflow-hidden">
      {/* Letterbox container — 21:9 cinematic ratio */}
      <div className="relative mx-auto w-full" style={{ maxWidth: "1400px" }}>
        {/* Top letterbox bar */}
        <div className="absolute top-0 left-0 right-0 h-6 md:h-10 bg-black z-30" />
        {/* Bottom letterbox bar */}
        <div className="absolute bottom-0 left-0 right-0 h-6 md:h-10 bg-black z-30" />

        {/* Main stage */}
        <div
          className="relative overflow-hidden"
          style={{ aspectRatio: "21/9", minHeight: "320px", maxHeight: "500px" }}
        >
          {/* Film grain overlay */}
          <div
            className="absolute inset-0 z-20 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
              backgroundSize: "128px 128px",
            }}
          />

          {/* ═══════════ STRIKERBALL ANIMATION STAGE ═══════════ */}
          <div className="absolute inset-0" style={{ animationPlayState: playState }}>

            {/* ─── SCENE 1 (0-4s): Stadium Dark → Spotlight Reveal ─── */}
            <div
              className="absolute inset-0 flex items-center justify-center z-10"
              style={{ animation: `sb-scene1 18s cubic-bezier(0.4,0,0.2,1) infinite`, animationPlayState: playState }}
            >
              {/* Stadium dark green gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#0a1a0a] via-[#0d2818] to-[#0a1a0a]" />
              {/* Stadium floodlights */}
              <div className="absolute top-0 left-[15%] w-40 h-full bg-gradient-to-b from-white/10 to-transparent" style={{ animation: `sb-floodlight 18s ease infinite`, animationPlayState: playState }} />
              <div className="absolute top-0 right-[15%] w-40 h-full bg-gradient-to-b from-white/10 to-transparent" style={{ animation: `sb-floodlight 18s ease infinite 0.5s`, animationPlayState: playState }} />
              {/* Lens flares */}
              <div className="absolute top-[10%] left-[20%] w-4 h-4 rounded-full bg-white/60" style={{ boxShadow: "0 0 40px 20px rgba(255,255,255,0.3)", animation: `sb-flare 18s ease infinite`, animationPlayState: playState }} />
              <div className="absolute top-[10%] right-[20%] w-4 h-4 rounded-full bg-white/60" style={{ boxShadow: "0 0 40px 20px rgba(255,255,255,0.3)", animation: `sb-flare 18s ease infinite 0.3s`, animationPlayState: playState }} />

              <div className="relative z-10 text-center">
                <p
                  className="text-sm md:text-lg tracking-[0.4em] uppercase text-white/40 mb-3"
                  style={{ animation: `sb-text-up 18s ease infinite`, animationPlayState: playState }}
                >
                  trinkgut Jammers prasentiert
                </p>
                <h2
                  className="text-4xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text"
                  style={{
                    backgroundImage: "linear-gradient(180deg, #FFD700 0%, #F59E0B 40%, #FF6B00 100%)",
                    textShadow: "0 0 40px rgba(245,158,11,0.5)",
                    WebkitBackgroundClip: "text",
                    animation: `sb-title-reveal 18s ease infinite`,
                    animationPlayState: playState,
                    filter: "drop-shadow(0 4px 20px rgba(245,158,11,0.4))",
                  }}
                >
                  STRIKERBALL
                </h2>
                <p
                  className="text-2xl md:text-4xl font-black text-white mt-1"
                  style={{
                    textShadow: "0 4px 20px rgba(0,0,0,0.8)",
                    animation: `sb-subtitle-reveal 18s ease infinite`,
                    animationPlayState: playState,
                  }}
                >
                  CHALLENGE
                </p>
              </div>
            </div>

            {/* ─── SCENE 2 (4-8s): Poster + Fire ─── */}
            <div
              className="absolute inset-0 flex items-center justify-center z-10"
              style={{ animation: `sb-scene2 18s cubic-bezier(0.4,0,0.2,1) infinite`, animationPlayState: playState }}
            >
              {/* Stadium green background with fire glow */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #0d2818 0%, #1a3d1a 30%, #0d2818 100%)" }} />
              {/* Fire glow from bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-orange-600/30 via-red-600/10 to-transparent" style={{ animation: `sb-fire-glow 2s ease-in-out infinite alternate`, animationPlayState: playState }} />

              {/* Fire particles */}
              {Array.from({ length: 25 }).map((_, i) => (
                <div
                  key={`fire-${i}`}
                  className="absolute rounded-full"
                  style={{
                    width: `${3 + (i % 5) * 2}px`,
                    height: `${3 + (i % 5) * 2}px`,
                    background: ["#FF4500", "#FF6B00", "#FFD700", "#FF8C00", "#FFFFFF"][i % 5],
                    left: `${5 + ((i * 3.7) % 90)}%`,
                    bottom: "0%",
                    borderRadius: "50%",
                    boxShadow: `0 0 ${4 + i % 6}px ${["#FF4500", "#FF6B00", "#FFD700"][i % 3]}`,
                    animation: `sb-fire-particle-${i % 5} 18s linear infinite`,
                    animationPlayState: playState,
                    opacity: 0,
                  }}
                />
              ))}

              {/* Poster image */}
              <div
                className="relative z-10 w-[180px] h-[260px] md:w-[220px] md:h-[310px] rounded-xl overflow-hidden shadow-2xl border-2 border-amber-500/40"
                style={{
                  animation: `sb-poster-reveal 18s ease infinite`,
                  animationPlayState: playState,
                  boxShadow: "0 0 60px rgba(245,158,11,0.3), 0 20px 40px rgba(0,0,0,0.5)",
                }}
              >
                <Image
                  src="/images/events/strikerball.png"
                  alt="Strikerball Challenge"
                  fill
                  className="object-cover"
                  sizes="220px"
                  unoptimized
                />
              </div>
              {/* Side text */}
              <div
                className="absolute right-[8%] md:right-[15%] z-10 text-right"
                style={{ animation: `sb-side-text 18s ease infinite`, animationPlayState: playState }}
              >
                <p className="text-3xl md:text-5xl font-black text-white" style={{ textShadow: "0 4px 20px rgba(0,0,0,0.8)" }}>
                  DEIN SCHUSS.
                </p>
                <p className="text-3xl md:text-5xl font-black text-amber-400 mt-1" style={{ textShadow: "0 4px 20px rgba(245,158,11,0.5)" }}>
                  DEIN GEWINN!
                </p>
              </div>
            </div>

            {/* ─── SCENE 3 (8-12s): Event Details + Countdown ─── */}
            <div
              className="absolute inset-0 flex items-center justify-center z-10"
              style={{ animation: `sb-scene3 18s cubic-bezier(0.4,0,0.2,1) infinite`, animationPlayState: playState }}
            >
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #DC2626 0%, #991B1B 50%, #7F1D1D 100%)" }} />
              {/* Embers */}
              {Array.from({ length: 15 }).map((_, i) => (
                <div
                  key={`ember-${i}`}
                  className="absolute rounded-full"
                  style={{
                    width: `${2 + (i % 3) * 2}px`,
                    height: `${2 + (i % 3) * 2}px`,
                    background: i % 2 === 0 ? "#FFD700" : "#FF6B00",
                    left: `${8 + ((i * 6.1) % 84)}%`,
                    bottom: "-5%",
                    boxShadow: `0 0 6px ${i % 2 === 0 ? "#FFD700" : "#FF6B00"}`,
                    animation: `sb-ember-${i % 4} 18s linear infinite`,
                    animationPlayState: playState,
                    opacity: 0,
                  }}
                />
              ))}

              <div className="relative z-10 text-center">
                <p
                  className="text-lg md:text-2xl font-bold text-white/80 tracking-widest uppercase mb-4"
                  style={{ animation: `sb-event-text1 18s ease infinite`, animationPlayState: playState }}
                >
                  24. Juli 2026 — trinkgut Jammers Goch
                </p>
                {/* Countdown */}
                <div className="flex justify-center gap-3 md:gap-6 mb-6" style={{ animation: `sb-countdown-reveal 18s ease infinite`, animationPlayState: playState }}>
                  {[
                    { val: countdown.days, label: "Tage" },
                    { val: countdown.hours, label: "Std" },
                    { val: countdown.mins, label: "Min" },
                    { val: countdown.secs, label: "Sek" },
                  ].map((u) => (
                    <div key={u.label} className="text-center">
                      <div className="text-3xl md:text-5xl font-black text-white tabular-nums" style={{ textShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
                        {String(u.val).padStart(2, "0")}
                      </div>
                      <div className="text-[10px] md:text-xs text-white/50 uppercase tracking-widest mt-1">{u.label}</div>
                    </div>
                  ))}
                </div>
                {/* Event highlights */}
                <div className="flex flex-wrap justify-center gap-4 md:gap-8" style={{ animation: `sb-highlights 18s ease infinite`, animationPlayState: playState }}>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">&#9917;</span>
                    <span className="text-white font-bold text-sm md:text-base">Volltreffer = 50&euro; Gutschein</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">&#127866;</span>
                    <span className="text-white font-bold text-sm md:text-base">Freibier</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">&#128293;</span>
                    <span className="text-white font-bold text-sm md:text-base">Live-Grillen</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── SCENE 4 (12-15s): Sponsor Logos + CTA ─── */}
            <div
              className="absolute inset-0 flex items-center justify-center z-10"
              style={{ animation: `sb-scene4 18s cubic-bezier(0.4,0,0.2,1) infinite`, animationPlayState: playState }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[#0a1a0a] via-[#1a3d1a] to-[#0a1a0a]" />
              <div className="relative z-10 text-center">
                <p className="text-xs md:text-sm text-white/40 tracking-[0.3em] uppercase mb-6">Mit freundlicher Unterstuetzung von</p>
                <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-8 max-w-lg mx-auto">
                  {["Bitburger", "Coca-Cola", "Veltins", "Frueh", "Herforder", "Estrella Galicia", "Gerolsteiner", "Vilsa"].map((brand) => (
                    <span key={brand} className="text-white/30 text-xs md:text-sm font-bold tracking-wider">{brand}</span>
                  ))}
                </div>
                <p
                  className="text-xl md:text-3xl font-black text-amber-400"
                  style={{ textShadow: "0 0 30px rgba(245,158,11,0.4)", animation: `sb-cta-pulse 2s ease-in-out infinite alternate`, animationPlayState: playState }}
                >
                  Sei dabei. 24. Juli 2026.
                </p>
              </div>
            </div>

            {/* ─── SCENE 5 (15-18s): Finale Brand ─── */}
            <div
              className="absolute inset-0 flex items-center justify-center z-10 bg-black"
              style={{ animation: `sb-scene5 18s cubic-bezier(0.4,0,0.2,1) infinite`, animationPlayState: playState }}
            >
              <div className="text-center">
                <h2
                  className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight"
                  style={{
                    animation: `sb-gold-shimmer 3s linear infinite, sb-scene5-text 18s ease infinite`,
                    animationPlayState: playState,
                    backgroundImage: "linear-gradient(90deg, #F59E0B 0%, #FFD700 25%, #F59E0B 50%, #FFD700 75%, #F59E0B 100%)",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Trinkgut Jammers
                </h2>
                <p className="text-white/60 text-sm md:text-base tracking-[0.2em] mt-4" style={{ animation: `sb-scene5-sub 18s ease infinite`, animationPlayState: playState }}>
                  Jurgenstr. 20 &middot; Goch &middot; Seit 2024 fuer euch da
                </p>
              </div>
            </div>
          </div>

          {/* Play/Pause button */}
          <button
            onClick={() => setPaused(!paused)}
            className="absolute bottom-3 right-3 md:bottom-5 md:right-5 z-30 w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white/70 hover:text-white hover:bg-black/70 transition-all duration-300"
            aria-label={paused ? "Animation abspielen" : "Animation pausieren"}
          >
            {paused ? (
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* ═══════════ KEYFRAME ANIMATIONS ═══════════ */}
      <style jsx>{`
        /* ── Scene 1: Stadium Reveal (0-4s → 0%-22%) ── */
        @keyframes sb-scene1 {
          0%      { opacity: 1; }
          18%     { opacity: 1; }
          22%     { opacity: 0; }
          78%     { opacity: 0; }
          85%     { opacity: 0; }
          92%     { opacity: 1; }
          100%    { opacity: 1; }
        }
        @keyframes sb-text-up {
          0%      { opacity: 0; transform: translateY(20px); }
          5%      { opacity: 1; transform: translateY(0); }
          18%     { opacity: 1; }
          22%     { opacity: 0; }
          85%     { opacity: 0; }
          93%     { opacity: 1; transform: translateY(0); }
          100%    { opacity: 1; }
        }
        @keyframes sb-title-reveal {
          0%      { opacity: 0; transform: scale(0.8); letter-spacing: 0.3em; }
          4%      { opacity: 1; transform: scale(1); letter-spacing: 0; }
          18%     { opacity: 1; }
          22%     { opacity: 0; }
          85%     { opacity: 0; }
          93%     { opacity: 1; transform: scale(1); }
          100%    { opacity: 1; }
        }
        @keyframes sb-subtitle-reveal {
          0%      { opacity: 0; transform: translateY(10px); }
          6%      { opacity: 1; transform: translateY(0); }
          18%     { opacity: 1; }
          22%     { opacity: 0; }
          85%     { opacity: 0; }
          95%     { opacity: 1; }
          100%    { opacity: 1; }
        }
        @keyframes sb-floodlight {
          0%      { opacity: 0; }
          3%      { opacity: 0.8; }
          5%      { opacity: 0.2; }
          8%      { opacity: 0.6; }
          18%     { opacity: 0.6; }
          22%     { opacity: 0; }
          85%     { opacity: 0; }
          92%     { opacity: 0.6; }
          100%    { opacity: 0.6; }
        }
        @keyframes sb-flare {
          0%      { opacity: 0; transform: scale(0); }
          4%      { opacity: 1; transform: scale(1); }
          5%      { opacity: 0.3; transform: scale(0.5); }
          8%      { opacity: 0.8; transform: scale(1.2); }
          18%     { opacity: 0.8; }
          22%     { opacity: 0; }
          85%     { opacity: 0; }
          92%     { opacity: 0.8; }
          100%    { opacity: 0.8; }
        }

        /* ── Scene 2: Poster + Fire (4-8s → 22%-44%) ── */
        @keyframes sb-scene2 {
          0%      { opacity: 0; }
          20%     { opacity: 0; }
          24%     { opacity: 1; }
          42%     { opacity: 1; }
          46%     { opacity: 0; }
          100%    { opacity: 0; }
        }
        @keyframes sb-poster-reveal {
          0%, 20% { opacity: 0; transform: scale(0.7) rotateY(15deg); }
          26%     { opacity: 1; transform: scale(1) rotateY(0deg); }
          42%     { opacity: 1; transform: scale(1.02); }
          46%     { opacity: 0; }
          100%    { opacity: 0; }
        }
        @keyframes sb-side-text {
          0%, 24% { opacity: 0; transform: translateX(40px); }
          30%     { opacity: 1; transform: translateX(0); }
          42%     { opacity: 1; }
          46%     { opacity: 0; }
          100%    { opacity: 0; }
        }
        @keyframes sb-fire-glow {
          0%      { opacity: 0.5; }
          100%    { opacity: 1; }
        }

        /* Fire particles (5 variants) */
        @keyframes sb-fire-particle-0 {
          0%, 21% { opacity: 0; transform: translateY(0) scale(1); }
          24%     { opacity: 0.9; }
          44%     { opacity: 0; transform: translateY(-400px) scale(0.2); }
          100%    { opacity: 0; }
        }
        @keyframes sb-fire-particle-1 {
          0%, 22% { opacity: 0; transform: translateY(0) scale(1); }
          25%     { opacity: 0.8; }
          43%     { opacity: 0; transform: translateY(-380px) scale(0.3); }
          100%    { opacity: 0; }
        }
        @keyframes sb-fire-particle-2 {
          0%, 23% { opacity: 0; transform: translateY(0) scale(1); }
          26%     { opacity: 0.85; }
          44%     { opacity: 0; transform: translateY(-420px) scale(0.1); }
          100%    { opacity: 0; }
        }
        @keyframes sb-fire-particle-3 {
          0%, 21.5% { opacity: 0; transform: translateY(0) scale(1); }
          24.5%   { opacity: 0.9; }
          42%     { opacity: 0; transform: translateY(-360px) scale(0.2); }
          100%    { opacity: 0; }
        }
        @keyframes sb-fire-particle-4 {
          0%, 22.5% { opacity: 0; transform: translateY(0) scale(1); }
          25.5%   { opacity: 0.75; }
          43%     { opacity: 0; transform: translateY(-440px) scale(0.15); }
          100%    { opacity: 0; }
        }

        /* ── Scene 3: Event Details (8-12s → 44%-67%) ── */
        @keyframes sb-scene3 {
          0%      { opacity: 0; }
          42%     { opacity: 0; }
          46%     { opacity: 1; }
          63%     { opacity: 1; }
          67%     { opacity: 0; }
          100%    { opacity: 0; }
        }
        @keyframes sb-event-text1 {
          0%, 44% { opacity: 0; transform: translateY(-20px); }
          48%     { opacity: 1; transform: translateY(0); }
          63%     { opacity: 1; }
          67%     { opacity: 0; }
          100%    { opacity: 0; }
        }
        @keyframes sb-countdown-reveal {
          0%, 46% { opacity: 0; transform: scale(0.9); }
          50%     { opacity: 1; transform: scale(1); }
          63%     { opacity: 1; }
          67%     { opacity: 0; }
          100%    { opacity: 0; }
        }
        @keyframes sb-highlights {
          0%, 48% { opacity: 0; transform: translateY(20px); }
          52%     { opacity: 1; transform: translateY(0); }
          63%     { opacity: 1; }
          67%     { opacity: 0; }
          100%    { opacity: 0; }
        }
        /* Embers (4 variants) */
        @keyframes sb-ember-0 {
          0%, 43% { opacity: 0; transform: translateY(0); }
          46%     { opacity: 0.8; }
          65%     { opacity: 0; transform: translateY(-500px) rotate(720deg); }
          100%    { opacity: 0; }
        }
        @keyframes sb-ember-1 {
          0%, 44% { opacity: 0; transform: translateY(0); }
          47%     { opacity: 0.7; }
          64%     { opacity: 0; transform: translateY(-480px) rotate(-540deg); }
          100%    { opacity: 0; }
        }
        @keyframes sb-ember-2 {
          0%, 45% { opacity: 0; transform: translateY(0); }
          48%     { opacity: 0.9; }
          66%     { opacity: 0; transform: translateY(-520px) rotate(600deg); }
          100%    { opacity: 0; }
        }
        @keyframes sb-ember-3 {
          0%, 43.5% { opacity: 0; transform: translateY(0); }
          46.5%   { opacity: 0.75; }
          63%     { opacity: 0; transform: translateY(-460px) rotate(-680deg); }
          100%    { opacity: 0; }
        }

        /* ── Scene 4: Sponsors (12-15s → 67%-83%) ── */
        @keyframes sb-scene4 {
          0%      { opacity: 0; }
          65%     { opacity: 0; }
          69%     { opacity: 1; }
          80%     { opacity: 1; }
          84%     { opacity: 0; }
          100%    { opacity: 0; }
        }
        @keyframes sb-cta-pulse {
          0%      { transform: scale(1); }
          100%    { transform: scale(1.05); text-shadow: 0 0 40px rgba(245,158,11,0.6); }
        }

        /* ── Scene 5: Finale (15-18s → 83%-100%) ── */
        @keyframes sb-scene5 {
          0%      { opacity: 0; }
          82%     { opacity: 0; }
          86%     { opacity: 1; }
          98%     { opacity: 1; }
          100%    { opacity: 0; }
        }
        @keyframes sb-scene5-text {
          0%, 82% { opacity: 0; transform: scale(0.85); }
          88%     { opacity: 1; transform: scale(1); }
          98%     { opacity: 1; }
          100%    { opacity: 0; }
        }
        @keyframes sb-scene5-sub {
          0%, 86% { opacity: 0; transform: translateY(10px); }
          90%     { opacity: 1; transform: translateY(0); }
          98%     { opacity: 1; }
          100%    { opacity: 0; }
        }
        @keyframes sb-gold-shimmer {
          0%      { background-position: 0% center; }
          100%    { background-position: 200% center; }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </section>
  );
}
