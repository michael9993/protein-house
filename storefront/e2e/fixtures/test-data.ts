/**
 * Shared test data and configuration.
 */
export const TEST_CONFIG = {
	channel: process.env.E2E_CHANNEL || "default-channel",
	userEmail: process.env.E2E_USER_EMAIL || "e2e-test@example.com",
	userPassword: process.env.E2E_USER_PASSWORD || "Test1234!",
	/** Generate a unique email for register tests */
	uniqueEmail: () => `e2e-${Date.now()}@test.local`,
};

/**
 * Stripe test card for checkout E2E.
 * @see https://docs.stripe.com/testing#cards
 */
export const STRIPE_TEST_CARD = {
	number: "4242424242424242",
	expiry: "12/30",
	cvc: "123",
	zip: "10001",
};

/**
 * US test address for checkout.
 */
export const TEST_ADDRESS = {
	firstName: "E2E",
	lastName: "TestUser",
	streetAddress1: "123 Test Street",
	streetAddress2: "",
	city: "New York",
	postalCode: "10001",
	country: "US",
	countryArea: "NY",
	phone: "+12125551234",
	companyName: "",
};
