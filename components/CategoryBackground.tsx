"use client";

import { useState, useEffect } from "react";

/**
 * Kategorie-spezifischer, animierter Hintergrund (Gradient + Glow + CSS-Partikel).
 * Partikel werden bewusst erst clientseitig (nach Mount) erzeugt, damit keine
 * Hydration-Mismatches durch Math.random() zwischen Server und Client entstehen.
 */
const CATEGORY_CONFIG: Record<string, {
  gradient: string;
  particleColor: string;
  particleType: "bubbles" | "drops" | "sparkles" | "smoke" | "leaves" | "pearls";
  accentGlow: string;
  overlayGradient: string;
}> = {
  bier: {
    gradient: "linear-gradient(135deg, #92400E 0%, #78350F 30%, #451A03 100%)",
    particleColor: "rgba(251, 191, 36, 0.6)",
    particleType: "bubbles",
    accentGlow: "rgba(251, 191, 36, 0.15)",
    overlayGradient: "linear-gradient(to bottom, rgba(69,26,3,0.3) 0%, rgba(69,26,3,0.7) 60%, rgba(69,26,3,0.9) 100%)",
  },
  alkoholfrei: {
    gradient: "linear-gradient(135deg, #0C4A6E 0%, #0E7490 30%, #164E63 100%)",
    particleColor: "rgba(147, 197, 253, 0.6)",
    particleType: "drops",
    accentGlow: "rgba(56, 189, 248, 0.15)",
    overlayGradient: "linear-gradient(to bottom, rgba(12,74,110,0.3) 0%, rgba(12,74,110,0.7) 60%, rgba(12,74,110,0.9) 100%)",
  },
  wein: {
    gradient: "linear-gradient(135deg, #4C1D95 0%, #7C2D6F 30%, #581C87 100%)",
    particleColor: "rgba(196, 130, 196, 0.5)",
    particleType: "sparkles",
    accentGlow: "rgba(168, 85, 247, 0.15)",
    overlayGradient: "linear-gradient(to bottom, rgba(76,29,149,0.3) 0%, rgba(76,29,149,0.7) 60%, rgba(76,29,149,0.9) 100%)",
  },
  sekt: {
    gradient: "linear-gradient(135deg, #92400E 0%, #B45309 30%, #78350F 100%)",
    particleColor: "rgba(253, 224, 71, 0.6)",
    particleType: "pearls",
    accentGlow: "rgba(253, 224, 71, 0.2)",
    overlayGradient: "linear-gradient(to bottom, rgba(146,64,14,0.3) 0%, rgba(146,64,14,0.7) 60%, rgba(146,64,14,0.9) 100%)",
  },
  spirituosen: {
    gradient: "linear-gradient(135deg, #451A03 0%, #292524 30%, #1C1917 100%)",
    particleColor: "rgba(217, 119, 6, 0.4)",
    particleType: "smoke",
    accentGlow: "rgba(217, 119, 6, 0.1)",
    overlayGradient: "linear-gradient(to bottom, rgba(28,25,23,0.3) 0%, rgba(28,25,23,0.7) 60%, rgba(28,25,23,0.9) 100%)",
  },
  lebensmittel: {
    gradient: "linear-gradient(135deg, #365314 0%, #3F6212 30%, #1A2E05 100%)",
    particleColor: "rgba(134, 239, 172, 0.4)",
    particleType: "leaves",
    accentGlow: "rgba(74, 222, 128, 0.1)",
    overlayGradient: "linear-gradient(to bottom, rgba(26,46,5,0.3) 0%, rgba(26,46,5,0.7) 60%, rgba(26,46,5,0.9) 100%)",
  },
};

type Particle = { id: number; x: number; size: number; delay: number; duration: number; opacity: number };

function generateParticles(count: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: i,
      x: Math.random() * 100,
      size: 3 + Math.random() * 8,
      delay: Math.random() * 8,
      duration: 4 + Math.random() * 6,
      opacity: 0.2 + Math.random() * 0.5,
    });
  }
  return particles;
}

export default function CategoryBackground({ slug }: { slug: string }) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  const config = CATEGORY_CONFIG[slug];

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);

    // Partikel erst clientseitig erzeugen (kein SSR-Mismatch). Weniger auf Mobile.
    if (!mq.matches) {
      const count = window.innerWidth < 768 ? 8 : 20;
      setParticles(generateParticles(count));
    } else {
      setParticles([]);
    }

    return () => mq.removeEventListener("change", handler);
  }, [slug]);

  if (!config) return null;

  // Reduced motion: nur statischer Gradient
  if (reducedMotion) {
    return <div className="absolute inset-0 z-0" style={{ background: config.gradient }} />;
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      {/* Basis-Gradient */}
      <div className="absolute inset-0" style={{ background: config.gradient }} />

      {/* Ambient-Glow */}
      <div
        className="absolute inset-0 animate-mesh"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, ${config.accentGlow} 0%, transparent 50%),
                       radial-gradient(ellipse at 70% 80%, ${config.accentGlow} 0%, transparent 50%)`,
        }}
      />

      {/* CSS-Partikel (clientseitig) */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: config.particleColor,
              opacity: p.opacity,
              animationName:
                config.particleType === "drops" || config.particleType === "leaves"
                  ? "catBgDrop"
                  : "catBgRise",
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              ...(config.particleType === "sparkles" || config.particleType === "pearls"
                ? { borderRadius: "50%", boxShadow: `0 0 ${p.size * 2}px ${config.particleColor}` }
                : {}),
              ...(config.particleType === "smoke"
                ? {
                    borderRadius: "50%",
                    width: `${p.size * 4}px`,
                    height: `${p.size * 4}px`,
                    filter: `blur(${p.size}px)`,
                  }
                : {}),
            }}
          />
        ))}
      </div>

      {/* Gradient-Overlay für Lesbarkeit */}
      <div className="absolute inset-0" style={{ background: config.overlayGradient }} />

      {/* Film-Grain */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />
    </div>
  );
}
