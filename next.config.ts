import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["lucide-react"],
  serverExternalPackages: ["lucide-react"],
};

export default nextConfig;
