import dotenv from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, ".env") });

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

	// Provision E2E test user if it doesn't exist
	const email = process.env.E2E_USER_EMAIL || "e2e-test@example.com";
	const password = process.env.E2E_USER_PASSWORD || "Test1234!";

	const tokenResp = await fetch(apiUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			query: `mutation($email: String!, $password: String!) {
				tokenCreate(email: $email, password: $password) {
					token
					errors { field message }
				}
			}`,
			variables: { email, password },
		}),
	}).then((r) => r.json() as Promise<{ data: { tokenCreate: { token: string | null; errors: Array<{ field: string; message: string }> } } }>);

	if (tokenResp.data?.tokenCreate?.token) {
		console.log(`✓ Test user ${email} already exists and can login`);
	} else {
		console.log(`⚠ Test user ${email} cannot login — create it via: docker exec saleor-api-dev python manage.py shell -c "..."`);
		console.log(`  Run: docker exec saleor-api-dev python manage.py shell -c "from saleor.account.models import User; u = User.objects.create(email='${email}', is_active=True, is_confirmed=True, first_name='E2E', last_name='Test'); u.set_password('${password}'); u.save(); print(f'Created {u.email}')"`);
	}
}

export default globalSetup;
