import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundles app with all required dependencies included and puts compiled app files
  // .next/standalone directory along with package.json and minimal set of node_modules
  output: "standalone",
};

export default nextConfig;
