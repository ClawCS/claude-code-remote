"use client";

import { useState, useEffect } from "react";

export default function VideoHero() {
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

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

  return (
    <section className="relative bg-black overflow-hidden">
      {/* Letterbox container — 21:9 cinematic ratio */}
      <div
        className="relative mx-auto w-full"
        style={{ maxWidth: "1400px" }}
      >
        {/* Top letterbox bar */}
        <div className="absolute top-0 left-0 right-0 h-6 md:h-10 bg-black z-30" />
        {/* Bottom letterbox bar */}
        <div className="absolute bottom-0 left-0 right-0 h-6 md:h-10 bg-black z-30" />

        {/* Main stage */}
        <div
          className="relative overflow-hidden"
          style={{
            aspectRatio: "21/9",
            minHeight: "320px",
            maxHeight: "500px",
          }}
        >
          {/* Film grain overlay */}
          <div
            className="absolute inset-0 z-20 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
              backgroundSize: "128px 128px",
            }}
          />

          {/* ═══════════ ANIMATION STAGE ═══════════ */}
          <div
            className="absolute inset-0"
            style={{
              animationPlayState: paused ? "paused" : "running",
            }}
          >
            {/* ─── SCENE 1 (0-3s): Brand Reveal ─── */}
            <div
              className="absolute inset-0 flex items-center justify-center z-10"
              style={{
                animation: "vh-scene1-bg 15s cubic-bezier(0.4,0,0.2,1) infinite",
                animationPlayState: paused ? "paused" : "running",
              }}
            >
              <div
                className="text-center"
                style={{
                  animation: "vh-scene1-text 15s cubic-bezier(0.4,0,0.2,1) infinite",
                  animationPlayState: paused ? "paused" : "running",
                }}
              >
                <h2
                  className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight"
                  style={{
                    textShadow: "0 4px 20px rgba(0,0,0,0.8), 0 1px 0 rgba(0,0,0,0.5), inset 0 -2px 4px rgba(0,0,0,0.3)",
                  }}
                >
                  TRINKGUT JAMMERS
                </h2>
                <p
                  className="text-sm md:text-lg text-white/60 tracking-[0.3em] mt-3 uppercase"
                  style={{
                    animation: "vh-scene1-sub 15s cubic-bezier(0.4,0,0.2,1) infinite",
                    animationPlayState: paused ? "paused" : "running",
                  }}
                >
                  Dein Moment. Unser Markt.
                </p>
              </div>
            </div>

            {/* ─── SCENE 2 (3-6s): Product Showcase ─── */}
            <div
              className="absolute inset-0 flex items-center justify-center z-10"
              style={{
                animation: "vh-scene2-container 15s cubic-bezier(0.4,0,0.2,1) infinite",
                animationPlayState: paused ? "paused" : "running",
              }}
            >
              {/* Amber gradient background */}
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(135deg, #D97706 0%, #92400E 50%, #78350F 100%)",
                  animation: "vh-scene2-bg 15s cubic-bezier(0.4,0,0.2,1) infinite",
                  animationPlayState: paused ? "paused" : "running",
                }}
              />
              {/* Sliding bottle silhouettes */}
              <div
                className="absolute inset-0 flex items-center gap-16 md:gap-24"
                style={{
                  animation: "vh-bottles-slide 15s linear infinite",
                  animationPlayState: paused ? "paused" : "running",
                }}
              >
                {/* Beer bottle SVG */}
                <svg className="w-16 h-28 md:w-20 md:h-36 text-white/20 flex-shrink-0" viewBox="0 0 60 120" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 10 L22 30 L15 45 L15 110 L45 110 L45 45 L38 30 L38 10 Z" />
                  <path d="M22 10 L38 10" />
                  <ellipse cx="30" cy="10" rx="8" ry="3" />
                </svg>
                {/* Wine glass SVG */}
                <svg className="w-14 h-28 md:w-18 md:h-36 text-white/20 flex-shrink-0" viewBox="0 0 60 120" fill="none" stroke="currentColor" strokeWidth="2">
                  <ellipse cx="30" cy="30" rx="20" ry="25" />
                  <line x1="30" y1="55" x2="30" y2="95" />
                  <ellipse cx="30" cy="100" rx="18" ry="5" />
                </svg>
                {/* Cocktail glass SVG */}
                <svg className="w-14 h-28 md:w-18 md:h-36 text-white/20 flex-shrink-0" viewBox="0 0 60 120" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 15 L55 15 L30 65 Z" />
                  <line x1="30" y1="65" x2="30" y2="100" />
                  <ellipse cx="30" cy="105" rx="18" ry="5" />
                  <line x1="40" y1="5" x2="50" y2="15" />
                  <circle cx="40" cy="5" r="4" />
                </svg>
                {/* Duplicate set for seamless scroll */}
                <svg className="w-16 h-28 md:w-20 md:h-36 text-white/20 flex-shrink-0" viewBox="0 0 60 120" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 10 L22 30 L15 45 L15 110 L45 110 L45 45 L38 30 L38 10 Z" />
                  <ellipse cx="30" cy="10" rx="8" ry="3" />
                </svg>
                <svg className="w-14 h-28 md:w-18 md:h-36 text-white/20 flex-shrink-0" viewBox="0 0 60 120" fill="none" stroke="currentColor" strokeWidth="2">
                  <ellipse cx="30" cy="30" rx="20" ry="25" />
                  <line x1="30" y1="55" x2="30" y2="95" />
                  <ellipse cx="30" cy="100" rx="18" ry="5" />
                </svg>
              </div>
              {/* Counter text */}
              <div className="relative z-10 text-center">
                <div
                  className="text-5xl md:text-7xl font-black text-white"
                  style={{
                    textShadow: "0 4px 20px rgba(0,0,0,0.5)",
                    animation: "vh-counter 15s cubic-bezier(0.4,0,0.2,1) infinite",
                    animationPlayState: paused ? "paused" : "running",
                  }}
                >
                  7.000+
                </div>
                <p
                  className="text-lg md:text-2xl text-white/80 mt-2 tracking-wide"
                  style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
                >
                  Artikel. Eine Leidenschaft.
                </p>
              </div>
            </div>

            {/* ─── SCENE 3 (6-9s): World Map ─── */}
            <div
              className="absolute inset-0 flex items-center justify-center z-10"
              style={{
                animation: "vh-scene3-container 15s cubic-bezier(0.4,0,0.2,1) infinite",
                animationPlayState: paused ? "paused" : "running",
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(135deg, #1E3A5F 0%, #0F172A 50%, #1E293B 100%)",
                  animation: "vh-scene3-bg 15s cubic-bezier(0.4,0,0.2,1) infinite",
                  animationPlayState: paused ? "paused" : "running",
                }}
              />
              {/* Map dots representing countries */}
              <div className="absolute inset-0">
                {/* Germany */}
                <div
                  className="absolute rounded-full bg-white"
                  style={{
                    width: "12px", height: "12px",
                    top: "35%", left: "48%",
                    animation: "vh-dot-pulse 15s cubic-bezier(0.4,0,0.2,1) infinite",
                    animationDelay: "6.2s",
                    animationPlayState: paused ? "paused" : "running",
                    boxShadow: "0 0 20px 8px rgba(255,255,255,0.4)",
                  }}
                />
                {/* Italy */}
                <div
                  className="absolute rounded-full bg-white"
                  style={{
                    width: "10px", height: "10px",
                    top: "48%", left: "50%",
                    animation: "vh-dot-pulse 15s cubic-bezier(0.4,0,0.2,1) infinite",
                    animationDelay: "6.6s",
                    animationPlayState: paused ? "paused" : "running",
                    boxShadow: "0 0 20px 8px rgba(255,255,255,0.4)",
                  }}
                />
                {/* France */}
                <div
                  className="absolute rounded-full bg-white"
                  style={{
                    width: "10px", height: "10px",
                    top: "40%", left: "43%",
                    animation: "vh-dot-pulse 15s cubic-bezier(0.4,0,0.2,1) infinite",
                    animationDelay: "7.0s",
                    animationPlayState: paused ? "paused" : "running",
                    boxShadow: "0 0 20px 8px rgba(255,255,255,0.4)",
                  }}
                />
                {/* Spain */}
                <div
                  className="absolute rounded-full bg-white"
                  style={{
                    width: "10px", height: "10px",
                    top: "50%", left: "38%",
                    animation: "vh-dot-pulse 15s cubic-bezier(0.4,0,0.2,1) infinite",
                    animationDelay: "7.4s",
                    animationPlayState: paused ? "paused" : "running",
                    boxShadow: "0 0 20px 8px rgba(255,255,255,0.4)",
                  }}
                />
                {/* Scotland */}
                <div
                  className="absolute rounded-full bg-white"
                  style={{
                    width: "10px", height: "10px",
                    top: "25%", left: "42%",
                    animation: "vh-dot-pulse 15s cubic-bezier(0.4,0,0.2,1) infinite",
                    animationDelay: "7.8s",
                    animationPlayState: paused ? "paused" : "running",
                    boxShadow: "0 0 20px 8px rgba(255,255,255,0.4)",
                  }}
                />
                {/* Connecting lines (decorative arcs) */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" fill="none" preserveAspectRatio="none">
                  <path d="M48 35 Q45 30 42 25" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3" strokeDasharray="1 1" />
                  <path d="M48 35 Q46 40 43 40" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3" strokeDasharray="1 1" />
                  <path d="M48 35 Q49 42 50 48" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3" strokeDasharray="1 1" />
                  <path d="M48 35 Q43 42 38 50" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3" strokeDasharray="1 1" />
                </svg>
              </div>
              <div className="relative z-10 text-center">
                <h3
                  className="text-3xl md:text-5xl lg:text-6xl font-black text-white"
                  style={{ textShadow: "0 4px 20px rgba(0,0,0,0.6)" }}
                >
                  Aus aller Welt.
                </h3>
                <p
                  className="text-xl md:text-3xl text-white/70 mt-2"
                  style={{ textShadow: "0 2px 10px rgba(0,0,0,0.5)" }}
                >
                  Für dich.
                </p>
              </div>
            </div>

            {/* ─── SCENE 4 (9-12s): Party ─── */}
            <div
              className="absolute inset-0 flex items-center justify-center z-10"
              style={{
                animation: "vh-scene4-container 15s cubic-bezier(0.4,0,0.2,1) infinite",
                animationPlayState: paused ? "paused" : "running",
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(135deg, #DC2626 0%, #991B1B 50%, #7F1D1D 100%)",
                  animation: "vh-scene4-bg 15s cubic-bezier(0.4,0,0.2,1) infinite",
                  animationPlayState: paused ? "paused" : "running",
                }}
              />
              {/* Confetti particles */}
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute hidden md:block"
                  style={{
                    width: `${6 + (i % 4) * 3}px`,
                    height: `${6 + (i % 3) * 3}px`,
                    background: ["#F59E0B", "#FFFFFF", "#DC2626", "#F59E0B", "#FFD700"][i % 5],
                    left: `${5 + (i * 4.7) % 90}%`,
                    top: "-10%",
                    borderRadius: i % 3 === 0 ? "50%" : "2px",
                    animation: `vh-confetti-${i % 5} 15s linear infinite`,
                    animationPlayState: paused ? "paused" : "running",
                    opacity: 0,
                  }}
                />
              ))}
              {/* Mobile: fewer confetti */}
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={`m${i}`}
                  className="absolute md:hidden"
                  style={{
                    width: `${5 + (i % 3) * 2}px`,
                    height: `${5 + (i % 3) * 2}px`,
                    background: ["#F59E0B", "#FFFFFF", "#DC2626", "#F59E0B"][i % 4],
                    left: `${10 + (i * 11) % 80}%`,
                    top: "-10%",
                    borderRadius: i % 2 === 0 ? "50%" : "2px",
                    animation: `vh-confetti-${i % 5} 15s linear infinite`,
                    animationPlayState: paused ? "paused" : "running",
                    opacity: 0,
                  }}
                />
              ))}
              {/* Light flash overlay */}
              <div
                className="absolute inset-0 bg-white pointer-events-none"
                style={{
                  animation: "vh-flash 15s ease infinite",
                  animationPlayState: paused ? "paused" : "running",
                }}
              />
              <div className="relative z-10 text-center">
                <div className="flex flex-wrap justify-center gap-x-4 md:gap-x-6">
                  {["Events.", "Vermietung.", "Party."].map((word, i) => (
                    <span
                      key={word}
                      className="text-3xl md:text-5xl lg:text-6xl font-black text-white block"
                      style={{
                        textShadow: "0 4px 20px rgba(0,0,0,0.5)",
                        animation: `vh-word-stagger 15s cubic-bezier(0.34,1.56,0.64,1) infinite`,
                        animationDelay: `${i * 0.3}s`,
                        animationPlayState: paused ? "paused" : "running",
                      }}
                    >
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ─── SCENE 5 (12-15s): Finale ─── */}
            <div
              className="absolute inset-0 flex items-center justify-center z-10 bg-black"
              style={{
                animation: "vh-scene5-container 15s cubic-bezier(0.4,0,0.2,1) infinite",
                animationPlayState: paused ? "paused" : "running",
              }}
            >
              <div className="text-center">
                <h2
                  className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight"
                  style={{
                    animation: "vh-gold-shimmer 3s linear infinite, vh-scene5-text 15s cubic-bezier(0.4,0,0.2,1) infinite",
                    animationPlayState: paused ? "paused" : "running",
                    backgroundImage: "linear-gradient(90deg, #F59E0B 0%, #FFD700 25%, #F59E0B 50%, #FFD700 75%, #F59E0B 100%)",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Trinkgut Jammers
                </h2>
                <div
                  className="mt-4 space-y-1"
                  style={{
                    animation: "vh-scene5-info 15s cubic-bezier(0.4,0,0.2,1) infinite",
                    animationPlayState: paused ? "paused" : "running",
                  }}
                >
                  <p className="text-white/60 text-sm md:text-base tracking-[0.2em]">
                    Jurgenstr. 20 &middot; Goch
                  </p>
                  <p className="text-white/40 text-xs md:text-sm tracking-[0.15em]">
                    Seit 2024 für euch da
                  </p>
                </div>
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
              <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ═══════════ KEYFRAME ANIMATIONS ═══════════ */}
      <style jsx>{`
        /* ── Scene 1: Brand Reveal (0-3s visible) ── */
        @keyframes vh-scene1-bg {
          0%      { opacity: 1; background: radial-gradient(circle at center, #DC2626 0%, #000 100%); background-size: 100% 100%; }
          2%      { background: radial-gradient(circle at center, #DC2626 0%, #DC2626 30%, #000 100%); }
          10%     { opacity: 1; background: radial-gradient(circle at center, #DC2626 0%, #DC2626 60%, #000 100%); }
          18%     { opacity: 1; }
          22%     { opacity: 0; }
          78%     { opacity: 0; }
          85%     { opacity: 0; }
          92%     { opacity: 1; background: radial-gradient(circle at center, #DC2626 0%, #DC2626 30%, #000 100%); }
          100%    { opacity: 1; background: radial-gradient(circle at center, #DC2626 0%, #000 100%); }
        }
        @keyframes vh-scene1-text {
          0%      { opacity: 0; transform: scale(0.9); }
          5%      { opacity: 1; transform: scale(1); }
          15%     { opacity: 1; transform: scale(1); }
          20%     { opacity: 0; transform: scale(1.05); }
          80%     { opacity: 0; }
          90%     { opacity: 0; transform: scale(0.9); }
          95%     { opacity: 1; transform: scale(1); }
          100%    { opacity: 1; transform: scale(1); }
        }
        @keyframes vh-scene1-sub {
          0%      { opacity: 0; transform: translateY(10px); }
          7%      { opacity: 1; transform: translateY(0); }
          15%     { opacity: 1; }
          20%     { opacity: 0; }
          80%     { opacity: 0; }
          93%     { opacity: 0; transform: translateY(10px); }
          97%     { opacity: 1; transform: translateY(0); }
          100%    { opacity: 1; }
        }

        /* ── Scene 2: Products (3-6s → 20%-40%) ── */
        @keyframes vh-scene2-container {
          0%      { opacity: 0; }
          18%     { opacity: 0; }
          22%     { opacity: 1; }
          38%     { opacity: 1; }
          42%     { opacity: 0; }
          100%    { opacity: 0; }
        }
        @keyframes vh-scene2-bg {
          0%      { opacity: 0; }
          20%     { opacity: 1; }
          40%     { opacity: 1; }
          42%     { opacity: 0; }
          100%    { opacity: 0; }
        }
        @keyframes vh-bottles-slide {
          0%      { transform: translateX(100%); }
          20%     { transform: translateX(50%); }
          40%     { transform: translateX(-30%); }
          100%    { transform: translateX(-30%); }
        }
        @keyframes vh-counter {
          0%      { opacity: 0; }
          22%     { opacity: 0; transform: scale(0.8); }
          26%     { opacity: 1; transform: scale(1); }
          38%     { opacity: 1; }
          42%     { opacity: 0; }
          100%    { opacity: 0; }
        }

        /* ── Scene 3: World (6-9s → 40%-60%) ── */
        @keyframes vh-scene3-container {
          0%      { opacity: 0; }
          38%     { opacity: 0; }
          42%     { opacity: 1; }
          58%     { opacity: 1; }
          62%     { opacity: 0; }
          100%    { opacity: 0; }
        }
        @keyframes vh-scene3-bg {
          0%      { opacity: 0; }
          40%     { opacity: 1; }
          60%     { opacity: 1; }
          62%     { opacity: 0; }
          100%    { opacity: 0; }
        }
        @keyframes vh-dot-pulse {
          0%, 40% { opacity: 0; transform: scale(0); }
          42%     { opacity: 0; transform: scale(0); }
          45%     { opacity: 1; transform: scale(1.5); }
          48%     { transform: scale(1); }
          58%     { opacity: 1; }
          62%     { opacity: 0; }
          100%    { opacity: 0; }
        }

        /* ── Scene 4: Party (9-12s → 60%-80%) ── */
        @keyframes vh-scene4-container {
          0%      { opacity: 0; }
          58%     { opacity: 0; }
          62%     { opacity: 1; }
          78%     { opacity: 1; }
          82%     { opacity: 0; }
          100%    { opacity: 0; }
        }
        @keyframes vh-scene4-bg {
          0%      { opacity: 0; }
          60%     { opacity: 1; }
          80%     { opacity: 1; }
          82%     { opacity: 0; }
          100%    { opacity: 0; }
        }
        @keyframes vh-word-stagger {
          0%, 58%   { opacity: 0; transform: translateY(40px) rotateX(-15deg); }
          64%       { opacity: 1; transform: translateY(0) rotateX(0deg); }
          78%       { opacity: 1; }
          82%       { opacity: 0; }
          100%      { opacity: 0; }
        }
        @keyframes vh-flash {
          0%, 60%   { opacity: 0; }
          63%       { opacity: 0.3; }
          64%       { opacity: 0; }
          70%       { opacity: 0; }
          71%       { opacity: 0.15; }
          72%       { opacity: 0; }
          100%      { opacity: 0; }
        }

        /* Confetti variants */
        @keyframes vh-confetti-0 {
          0%, 59%   { opacity: 0; transform: translateY(0) rotate(0deg); }
          62%       { opacity: 0.9; }
          80%       { opacity: 0.9; transform: translateY(500px) rotate(720deg); }
          82%       { opacity: 0; }
          100%      { opacity: 0; }
        }
        @keyframes vh-confetti-1 {
          0%, 60%   { opacity: 0; transform: translateY(0) rotate(0deg); }
          63%       { opacity: 0.8; }
          79%       { opacity: 0.8; transform: translateY(480px) rotate(-540deg); }
          82%       { opacity: 0; }
          100%      { opacity: 0; }
        }
        @keyframes vh-confetti-2 {
          0%, 61%   { opacity: 0; transform: translateY(0) rotate(0deg); }
          64%       { opacity: 0.85; }
          78%       { opacity: 0.85; transform: translateY(520px) rotate(600deg); }
          82%       { opacity: 0; }
          100%      { opacity: 0; }
        }
        @keyframes vh-confetti-3 {
          0%, 59.5% { opacity: 0; transform: translateY(0) rotate(0deg); }
          62.5%     { opacity: 0.9; }
          80%       { opacity: 0.9; transform: translateY(460px) rotate(-680deg); }
          82%       { opacity: 0; }
          100%      { opacity: 0; }
        }
        @keyframes vh-confetti-4 {
          0%, 60.5% { opacity: 0; transform: translateY(0) rotate(0deg); }
          63.5%     { opacity: 0.75; }
          79%       { opacity: 0.75; transform: translateY(500px) rotate(580deg); }
          82%       { opacity: 0; }
          100%      { opacity: 0; }
        }

        /* ── Scene 5: Finale (12-15s → 80%-100%) ── */
        @keyframes vh-scene5-container {
          0%      { opacity: 0; }
          78%     { opacity: 0; }
          82%     { opacity: 1; }
          98%     { opacity: 1; }
          100%    { opacity: 0; }
        }
        @keyframes vh-scene5-text {
          0%, 78% { opacity: 0; transform: scale(0.85); }
          84%     { opacity: 1; transform: scale(1); }
          98%     { opacity: 1; }
          100%    { opacity: 0; }
        }
        @keyframes vh-scene5-info {
          0%, 82% { opacity: 0; transform: translateY(10px); }
          88%     { opacity: 1; transform: translateY(0); }
          98%     { opacity: 1; }
          100%    { opacity: 0; }
        }
        @keyframes vh-gold-shimmer {
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
