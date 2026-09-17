import type { NextConfig } from "next";

// Server routes keep their own authorization checks; no secrets reach the client bundle.
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
