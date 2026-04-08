import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
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
};

export default nextConfig;
