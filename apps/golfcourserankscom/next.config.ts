import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/leaderboard",
        destination: "/rankings",
        permanent: true
      }
    ];
  }
};

export default nextConfig;
