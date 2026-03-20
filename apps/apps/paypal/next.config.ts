import { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: [
    "@saleor/apps-logger",
    "@saleor/apps-shared",
    "@saleor/apps-trpc",
  ],
  bundlePagesRouterDependencies: true,
  ...(process.env.NODE_ENV === "development" && {
    allowedDevOrigins: [
      "*.trycloudflare.com",
      "localhost",
      "127.0.0.1",
    ],
  }),
};

export default nextConfig;
