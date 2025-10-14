import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "brbqduswpnlcafksjsjo.supabase.co",
        pathname: "/**",
      },
    ],
    imageSizes: [16, 32, 48, 64],
    deviceSizes: [
      16, 32, 48, 64, 96, 128, 256, 384, 512, 640, 750, 828, 1080, 1200, 1920,
      2048, 3840,
    ],
    qualities: [40, 60, 75],
  },
};

export default nextConfig;
