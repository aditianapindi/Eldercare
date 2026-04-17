import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/fraudguard",
        destination: "/saaya",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
