import { withSentryConfig } from "@sentry/nextjs";
import { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    // vitest/vite version type incompatibility doesn't affect runtime
    ignoreBuildErrors: true,
  },
  /* Allow production build when ESLint has style-only violations (run `pnpm run lint:fix` to fix) */
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: [
    "@saleor/apps-logger",
    "@saleor/apps-otel",
    "@saleor/apps-shared",
    "@saleor/apps-trpc",
  ],
  experimental: {
    optimizePackageImports: ["@sentry/nextjs", "@sentry/node"],
  },
  bundlePagesRouterDependencies: true,
  // Allow cross-origin requests from tunnel URLs in development
  // This silences the warning about cross-origin requests to /_next/* resources
  ...(process.env.NODE_ENV === "development" && {
    allowedDevOrigins: [
      "*.trycloudflare.com",
      "localhost",
      "127.0.0.1",
    ],
  }),
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore opentelemetry warnings - https://github.com/open-telemetry/opentelemetry-js/issues/4173
      config.ignoreWarnings = [{ module: /require-in-the-middle/ }];
    }

    return config;
  },
};

// Make sure to export sentry config as the last one - https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#apply-instrumentation-to-your-app
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  disableLogger: true,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
});
