import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.animetom.live" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
    minimumCacheTTL: 86_400,
  },
  poweredByHeader: false,
};

export default nextConfig;
