import type { NextConfig } from "next";

const CANONICAL_ORIGIN = "https://ai-prototypes-golfcourserankscom.vercel.app";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/",
        destination: `${CANONICAL_ORIGIN}/`,
        permanent: true
      },
      {
        source: "/:path*",
        destination: `${CANONICAL_ORIGIN}/:path*`,
        permanent: true
      }
    ];
  }
};

export default nextConfig;
