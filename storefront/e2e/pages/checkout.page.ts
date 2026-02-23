import { type Page, expect } from "@playwright/test";
import { TEST_ADDRESS, STRIPE_TEST_CARD } from "../fixtures/test-data";

export class CheckoutPage {
	readonly page: Page;
	readonly channel: string;

	constructor(page: Page, channel: string) {
		this.page = page;
		this.channel = channel;
	}

	/** Navigate to checkout (requires a checkout ID in cookie). */
	async goto() {
		// Checkout auto-reads checkoutId from cookie and redirects
		await this.page.goto(`/${this.channel}/checkout`);
		await this.page.waitForLoadState("domcontentloaded");
	}

	// --- Sections ---

	get shippingAddressSection() {
		return this.page.locator('[data-testid="shippingAddressSection"]');
	}

	get deliveryMethodsSection() {
		return this.page.locator('[data-testid="deliveryMethods"]');
	}

	get paymentSection() {
		return this.page.locator('[data-testid="paymentMethods"]');
	}

	get orderSummary() {
		return this.page.locator('[data-testid="SummaryProductList"]');
	}

	get totalPrice() {
		return this.page.locator('[data-testid="totalOrderPrice"]');
	}

	// --- Contact / Guest email ---

	get emailInput() {
		return this.page.locator('input[name="email"]').first();
	}

	/** Fill the guest email field. */
	async fillEmail(email: string) {
		await this.emailInput.waitFor({ state: "visible", timeout: 15_000 });
		await this.emailInput.fill(email);
		// Tab away to trigger blur validation
		await this.emailInput.press("Tab");
	}

	// --- Shipping Address ---

	/** Fill the shipping address form. */
	async fillShippingAddress(address = TEST_ADDRESS) {
		await this.shippingAddressSection.waitFor({ state: "visible", timeout: 15_000 });

		// Fill basic text fields
		const fields: Array<[string, string]> = [
			["firstName", address.firstName],
			["lastName", address.lastName],
			["streetAddress1", address.streetAddress1],
			["city", address.city],
			["postalCode", address.postalCode],
			["phone", address.phone],
		];

		if (address.companyName) {
			fields.push(["companyName", address.companyName]);
		}
		if (address.streetAddress2) {
			fields.push(["streetAddress2", address.streetAddress2]);
		}

		for (const [name, value] of fields) {
			const input = this.shippingAddressSection.locator(`input[name="${name}"]`);
			if (await input.isVisible().catch(() => false)) {
				await input.fill(value);
			}
		}

		// Country select — try to select by value
		const countrySelect = this.shippingAddressSection.locator('select, [role="combobox"]').first();
		if (await countrySelect.isVisible().catch(() => false)) {
			await countrySelect.selectOption({ value: address.country }).catch(() => {
				// If it's a custom dropdown, try clicking and selecting
			});
		}

		// Country area / state — similar approach
		const stateSelect = this.shippingAddressSection.locator('select[name="countryArea"], input[name="countryArea"]');
		if (await stateSelect.isVisible().catch(() => false)) {
			if ((await stateSelect.evaluate((el) => el.tagName)) === "SELECT") {
				await stateSelect.selectOption({ value: address.countryArea }).catch(() => {});
			} else {
				await stateSelect.fill(address.countryArea);
			}
		}
	}

	// --- Delivery Methods ---

	/** Select the first available shipping method. */
	async selectFirstShippingMethod() {
		await this.deliveryMethodsSection.waitFor({ state: "visible", timeout: 15_000 });
		// Click the first radio-style button in delivery methods
		const method = this.deliveryMethodsSection.locator("button, label, [role='radio']").first();
		await method.click();
	}

	/** Get all shipping method labels (radio-style labels). */
	get shippingMethodLabels() {
		return this.deliveryMethodsSection.locator("label");
	}

	/** Select a shipping method by index (0-based). */
	async selectShippingMethodByIndex(index: number) {
		await this.deliveryMethodsSection.waitFor({ state: "visible", timeout: 15_000 });
		const label = this.shippingMethodLabels.nth(index);
		await label.click();
	}

	/** Get the shipping cost from the order summary (aria-label="shipping cost"). */
	get shippingCost() {
		return this.page.locator('[aria-label="shipping cost"]');
	}

	/** Read the shipping cost text from the summary. */
	async getShippingCostText(): Promise<string> {
		await this.shippingCost.waitFor({ state: "visible", timeout: 15_000 });
		return (await this.shippingCost.textContent()) || "";
	}

	/** Get the total price text from the summary. */
	async getTotalPriceText(): Promise<string> {
		await this.totalPrice.waitFor({ state: "visible", timeout: 15_000 });
		return (await this.totalPrice.textContent()) || "";
	}

	/** Get the "no shipping methods" warning message. */
	get noShippingMethodsMessage() {
		return this.deliveryMethodsSection.locator("text=/no shipping methods/i");
	}

	// --- Payment (Stripe) ---

	/** Fill Stripe card details via the Stripe iframe. */
	async fillStripeCard(card = STRIPE_TEST_CARD) {
		await this.paymentSection.waitFor({ state: "visible", timeout: 15_000 });

		// Stripe uses an iframe — find it
		const stripeFrame = this.page.frameLocator('iframe[name*="__privateStripeFrame"], iframe[title*="Secure payment"]').first();

		// Card number
		const cardInput = stripeFrame.locator('[name="number"], [placeholder*="Card number"], input').first();
		await cardInput.waitFor({ state: "visible", timeout: 15_000 });
		await cardInput.fill(card.number);

		// Expiry
		const expiryInput = stripeFrame.locator('[name="expiry"], [placeholder*="MM / YY"]').first();
		await expiryInput.fill(card.expiry);

		// CVC
		const cvcInput = stripeFrame.locator('[name="cvc"], [placeholder*="CVC"]').first();
		await cvcInput.fill(card.cvc);

		// ZIP (if visible — Stripe sometimes requests it)
		const zipInput = stripeFrame.locator('[name="postalCode"], [placeholder*="ZIP"]');
		if (await zipInput.isVisible().catch(() => false)) {
			await zipInput.fill(card.zip);
		}
	}

	// --- Submit ---

	/** Click the "Place Order" / submit button. */
	async placeOrder() {
		const submitBtn = this.page.getByRole("button", { name: /place order|pay|complete/i });
		await expect(submitBtn).toBeEnabled({ timeout: 10_000 });
		await submitBtn.click();
	}

	// --- Order Confirmation ---

	/** The order confirmation title (note: typo in data-testid is intentional). */
	get confirmationTitle() {
		return this.page.locator('[data-testid="orderConfrmationTitle"]');
	}

	/** Wait for the order confirmation page. */
	async expectOrderConfirmation() {
		await expect(this.confirmationTitle).toBeVisible({ timeout: 30_000 });
	}
}
