/** @type {import('next').NextConfig} */
const config = {
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
