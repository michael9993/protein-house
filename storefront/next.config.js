/**
 * @type {import('next').NextConfig}
 * Note: "Preloaded using link preload but not used" warnings for layout.css are a known
 * Next.js issue (NEXT-1307). They often appear in dev with HMR; production is less affected.
 * See: https://github.com/vercel/next.js/issues/51524
 */
import path from "path";
import { fileURLToPath } from "url";
import { withSentryConfig } from "@sentry/nextjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
	// Transpile the shared config package (imported as source via volume mount)
	transpilePackages: ["@saleor/apps-storefront-config"],
	// Turbopack config (Next.js 16 default bundler)
	turbopack: {
		resolveAlias: {
			// Resolve zod from storefront's node_modules so the shared package can use it
			zod: path.resolve(__dirname, "node_modules/zod"),
		},
	},
	// Webpack config (fallback bundler, used with --no-turbopack)
	webpack: (config) => {
		config.resolve.alias.zod = path.resolve(__dirname, "node_modules/zod");
		config.resolve.modules = [
			path.resolve(__dirname, "node_modules"),
			...(config.resolve.modules || ["node_modules"]),
		];
		return config;
	},
	images: {
		remotePatterns: [
			// Docker service name for server-side image optimization
			{
				protocol: "http",
				hostname: "saleor-api",
				port: "8000",
			},
			// Localhost for development
			{
				protocol: "http",
				hostname: "localhost",
			},
			// Saleor Cloud (if using hosted Saleor)
			{
				hostname: "**.saleor.cloud",
			},
		],
		// Disable image optimization in development to avoid Docker localhost issues
		unoptimized: process.env.NODE_ENV === "development",
	},
	typedRoutes: false,
	// Standalone output for Docker production builds
	output:
		process.env.NEXT_OUTPUT === "standalone"
			? "standalone"
			: process.env.NEXT_OUTPUT === "export"
			  ? "export"
			  : undefined,
};

export default withSentryConfig(config, {
	// Suppress source map upload logs except in CI
	silent: !process.env.CI,

	// Route browser Sentry requests through Next.js server to avoid ad-blockers
	tunnelRoute: "/monitoring",

	// Tree-shake Sentry debug logs in production
	webpack: {
		treeshake: {
			removeDebugLogging: true,
		},
	},

	// Disable source map upload (no SENTRY_AUTH_TOKEN configured yet)
	sourcemaps: {
		disable: !process.env.SENTRY_AUTH_TOKEN,
	},
});
