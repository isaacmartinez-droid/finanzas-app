import type { NextConfig } from "next";

// Frontend-only prototype: no API routes, no server actions, no persistence.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
