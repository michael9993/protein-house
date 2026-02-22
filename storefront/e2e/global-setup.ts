import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

async function globalSetup() {
	const storefrontUrl = process.env.STOREFRONT_URL || "http://localhost:3000";
	const apiUrl = process.env.SALEOR_API_URL || "http://localhost:8000/graphql/";

	// Check storefront is reachable
	const storefrontOk = await fetch(storefrontUrl)
		.then((r) => r.ok || r.status === 307) // redirects are OK
		.catch(() => false);

	if (!storefrontOk) {
		throw new Error(
			`Storefront not reachable at ${storefrontUrl}. ` +
				`Start with: docker compose -f infra/docker-compose.dev.yml up -d saleor-storefront-dev`,
		);
	}

	// Check API is reachable
	const apiOk = await fetch(apiUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ query: "{ shop { name } }" }),
	})
		.then((r) => r.ok)
		.catch(() => false);

	if (!apiOk) {
		throw new Error(
			`Saleor API not reachable at ${apiUrl}. ` +
				`Start with: docker compose -f infra/docker-compose.dev.yml up -d saleor-api-dev`,
		);
	}

	console.log(`✓ Storefront ready at ${storefrontUrl}`);
	console.log(`✓ API ready at ${apiUrl}`);
}

export default globalSetup;
