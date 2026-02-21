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

// Build dynamic remotePatterns from NEXT_PUBLIC_SALEOR_API_URL
const apiRemotePatterns = [];
try {
	const apiUrl = process.env.NEXT_PUBLIC_SALEOR_API_URL;
	if (apiUrl) {
		const parsed = new URL(apiUrl);
		apiRemotePatterns.push({
			protocol: parsed.protocol.replace(":", ""),
			hostname: parsed.hostname,
			...(parsed.port ? { port: parsed.port } : {}),
		});
	}
} catch {
	// Ignore invalid URL
}

const config = {
	// Skip type checking during build — run type-check separately
	typescript: {
		ignoreBuildErrors: true,
	},
	// Transpile the shared config package (imported as source via volume mount)
	transpilePackages: ["@saleor/apps-storefront-config"],
	// Turbopack config (Next.js 16 default bundler)
	turbopack: {
		resolveAlias: {
			// Resolve zod from storefront's node_modules so the shared package can use it
			zod: path.resolve(__dirname, "node_modules/zod"),
		},
	},
	// Webpack config (fallback bundler, used with --no-turbopack and production builds)
	webpack: (config) => {
		config.resolve.alias.zod = path.resolve(__dirname, "node_modules/zod");
		// Resolve shared config package (volume-mounted, not in node_modules)
		config.resolve.alias["@saleor/apps-storefront-config"] = path.resolve(
			__dirname,
			"../apps/packages/storefront-config/src/index.ts",
		);
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
			// Public API domain (from NEXT_PUBLIC_SALEOR_API_URL, e.g. api.halacosmetics.org)
			...apiRemotePatterns,
			// External product image sources (imported/dropshipped products)
			{
				protocol: "https",
				hostname: "media.easy.co.il",
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
