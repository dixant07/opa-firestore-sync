import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // API routes handle OPA server communication directly
  // No rewrites needed - see src/app/api/opa/
};

export default nextConfig;
