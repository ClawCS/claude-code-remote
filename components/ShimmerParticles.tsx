/**
 * Floating shimmer particles for hero banners.
 * Drop into any `position: relative; overflow: hidden` container.
 */
export default function ShimmerParticles({ count = 20 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: `${3 + (i % 4) * 2}px`,
            height: `${3 + (i % 4) * 2}px`,
            background:
              i % 3 === 0
                ? "rgba(245, 158, 11, 0.6)"
                : "rgba(255, 255, 255, 0.4)",
            left: `${2 + ((i * 3.3) % 96)}%`,
            top: `${5 + ((i * 6.7) % 88)}%`,
            boxShadow:
              i % 3 === 0
                ? "0 0 6px rgba(245, 158, 11, 0.4)"
                : "0 0 4px rgba(255, 255, 255, 0.3)",
            animation: `particleFloat ${5 + (i % 4) * 2}s ease-in-out ${(i * 0.5) % 5}s infinite`,
          }}
        />
      ))}
    </>
  );
}
