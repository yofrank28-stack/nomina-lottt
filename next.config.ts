import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["lucide-react"],
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
