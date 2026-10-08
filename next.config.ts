import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the live production preview intact while iterating locally.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/*": ["./data/editorial/**/*.json"],
    "/api/{rentals,rental-admin}/**": ["./assets/fonts/rental-document/**/*"],
    "/{,nl,angebote,handzettel,produkte,kategorie/*,api/content/current,api/content/flyers,api/content/offers,api/handzettel/fetch}": ["./data/weekly-offer-layout.json", "./data/weekly-offers.json", "./data/editorial/weekly-publications/*.json", "./public/handzettel/20*/**/*.pdf", "./public/images/content/**/*", "./public/images/offers/**/*"],
  },
  experimental: {
    inlineCss: true,
  },
  outputFileTracingExcludes: {
    "/api/content/current": ["assets/source/preislisten/**/*"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 768, 1024, 1280, 1440, 1920, 2560],
    imageSizes: [32, 48, 64, 96, 128, 256, 360, 390, 512],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.trinkgut.de",
      },
      {
        protocol: "https",
        hostname: "www.trinkgut.de",
      },
      {
        protocol: "https",
        hostname: "werbung.trinkgut.de",
      },
      {
        protocol: "https",
        hostname: "www.thecocktaildb.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "www.instagram.com",
      },
      {
        protocol: "https",
        hostname: "*.cdninstagram.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'") + "; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-src 'self' https://werbung.trinkgut.de; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      ...["de", "nl", "extracted"].map(legacy => ({
        source: `/handzettel/${legacy}/:path*`,
        headers: [{key:"X-Robots-Tag",value:"noindex, noarchive"}],
      })),
      ...["mietbestellung", "markt", "api/rentals", "api/rental-admin"].map(section => ({
        source: `/${section}/:path*`,
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }, { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }, { key: "Cache-Control", value: "private, no-store" }],
      })),
      {
        source:"/handzettel/manifest.json",
        headers:[{key:"X-Robots-Tag",value:"noindex, noarchive"}],
      },
    ];
  },
};

export default nextConfig;
