import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.infrastructureLogging = { level: 'error' };
    return config;
  },
};

export default nextConfig;
