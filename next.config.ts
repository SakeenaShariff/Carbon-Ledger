import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["googleapis", "xlsx", "bcryptjs"],
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
