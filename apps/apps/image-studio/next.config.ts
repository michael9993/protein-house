import { NextConfig } from "next";

const nextConfig = (): NextConfig => {
  return {
    reactStrictMode: true,
    typescript: {
      // fabric.js v6 has type incompatibilities that don't affect runtime
      ignoreBuildErrors: true,
    },
    transpilePackages: [
      "@saleor/apps-shared",
      "@saleor/apps-ui",
      "@saleor/react-hook-form-macaw",
    ],
    bundlePagesRouterDependencies: true,
  };
};

export default nextConfig();
