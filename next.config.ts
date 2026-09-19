import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/report.",
        destination: "/report",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
