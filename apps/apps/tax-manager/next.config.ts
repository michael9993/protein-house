import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
transpilePackages: [
    "@saleor/apps-shared",
    "@saleor/apps-ui",
    "@saleor/react-hook-form-macaw",
  ],
  bundlePagesRouterDependencies: true,
};

export default nextConfig;
