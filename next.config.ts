import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force Webpack and explicitly disable Turbopack for CPU compatibility
  turbopack: false,
};

export default nextConfig;
