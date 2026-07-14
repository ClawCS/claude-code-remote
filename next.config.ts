import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ];
  },
};

export default nextConfig;
