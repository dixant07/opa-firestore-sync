import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/opa/:path*',
        destination: 'http://139.59.91.77:8181/:path*',
      },
    ];
  },
};

export default nextConfig;
