/**
 * @type {import('next').NextConfig}
 * Note: "Preloaded using link preload but not used" warnings for layout.css are a known
 * Next.js issue (NEXT-1307). They often appear in dev with HMR; production is less affected.
 * See: https://github.com/vercel/next.js/issues/51524
 */
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
	// Transpile the shared config package (imported as source via volume mount)
	transpilePackages: ["@saleor/apps-storefront-config"],
	webpack: (config) => {
		// Resolve zod from storefront's node_modules so the shared package can use it
		config.resolve.alias.zod = path.resolve(__dirname, "node_modules/zod");
		// Ensure storefront's node_modules is searched first for volume-mounted packages
		config.resolve.modules = [
			path.resolve(__dirname, "node_modules"),
			...(config.resolve.modules || ["node_modules"]),
		];
		return config;
	},
	images: {
		remotePatterns: [
			{
				hostname: "*",
			},
			// Allow Docker service name for server-side image optimization
			{
				protocol: "http",
				hostname: "saleor-api",
				port: "8000",
			},
		],
		// Disable image optimization in development to avoid Docker localhost issues
		// Images will load directly from localhost:8000 (browser can access it)
		unoptimized: process.env.NODE_ENV === "development",
	},
	experimental: {
		typedRoutes: false,
	},
	// Disable ESLint during build to focus on type errors only
	// ESLint errors are mostly style issues that don't affect functionality
	eslint: {
		// Only run ESLint in development
		ignoreDuringBuilds: process.env.NODE_ENV === "production",
	},
	// used in the Dockerfile
	output:
		process.env.NEXT_OUTPUT === "standalone"
			? "standalone"
			: process.env.NEXT_OUTPUT === "export"
			  ? "export"
			  : undefined,
};

export default config;
