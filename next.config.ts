import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.0.116"],
  experimental: {
    cpus: 1,
    turbopackMemoryLimit: 512,
  }
};

export default nextConfig;
