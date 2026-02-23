/**
 * Check installed Saleor apps and their webhook registrations.
 * Run: node e2e/scripts/check-apps.mjs
 */
const API_URL = process.env.SALEOR_API_URL || "http://localhost:8000/graphql/";

async function gql(query, variables, token) {
	const headers = { "Content-Type": "application/json" };
	if (token) headers["Authorization"] = `Bearer ${token}`;
	const resp = await fetch(API_URL, {
		method: "POST",
		headers,
		body: JSON.stringify({ query, variables }),
	});
	return resp.json();
}

async function run() {
	// Login as admin
	const loginData = await gql(
		`mutation TokenCreate($email: String!, $password: String!) {
			tokenCreate(email: $email, password: $password) {
				token
				errors { field message }
			}
		}`,
		{ email: "admin@example.com", password: "admin" },
	);
	const token = loginData.data?.tokenCreate?.token;
	if (!token) {
		console.log("Login failed:", JSON.stringify(loginData));
		return;
	}
	console.log("Logged in as admin\n");

	// Query installed apps with webhooks
	const appsData = await gql(
		`{
			apps(first: 20) {
				edges {
					node {
						id
						name
						identifier
						isActive
						webhooks {
							id
							name
							syncEvents { eventType }
							asyncEvents { eventType }
							targetUrl
							isActive
						}
					}
				}
			}
		}`,
		{},
		token,
	);

	if (appsData.errors) {
		console.log("GraphQL errors:", JSON.stringify(appsData.errors, null, 2));
		return;
	}

	const apps = appsData.data.apps.edges.map((e) => e.node);
	console.log(`=== ${apps.length} Installed Apps ===\n`);

	for (const app of apps) {
		console.log(`${app.name} (active: ${app.isActive})`);
		console.log(`  identifier: ${app.identifier}`);
		console.log(`  id: ${app.id}`);

		if (app.webhooks?.length > 0) {
			for (const wh of app.webhooks) {
				const syncEvents = (wh.syncEvents || []).map((e) => e.eventType);
				const asyncEvents = (wh.asyncEvents || []).map((e) => e.eventType);
				const allEvents = [...syncEvents, ...asyncEvents];
				console.log(
					`  webhook: ${wh.name} (active: ${wh.isActive})`,
				);
				console.log(`    target: ${wh.targetUrl}`);
				console.log(`    sync events: ${syncEvents.join(", ") || "(none)"}`);
				console.log(`    async events: ${asyncEvents.join(", ") || "(none)"}`);
			}
		} else {
			console.log("  (no webhooks)");
		}
		console.log("");
	}
}

run().catch(console.error);
