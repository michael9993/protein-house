import { type Page, expect } from "@playwright/test";
import { STRIPE_TEST_CARD } from "../fixtures/test-data";

export interface TestAddress {
	firstName: string;
	lastName: string;
	streetAddress1: string;
	streetAddress2?: string;
	city: string;
	postalCode: string;
	country: string;
	countryArea?: string;
	phone: string;
	companyName?: string;
}

/**
 * Page object for the checkout-v2 accordion checkout.
 *
 * Key DOM contracts from the implementation:
 *  - Accordion step buttons: id="checkout-step-{N}-header"
 *  - Accordion step panels:  id="checkout-step-{N}-panel"  (role="region", hidden when inactive)
 *  - Continue buttons in each step: text "Continue", type="submit" or button[type="button"]
 *  - Delivery radios: input[type="radio"][name="deliveryMethod"] inside step-2 panel
 *  - Summary sidebar: <aside> element
 */
export class CheckoutV2Page {
	readonly page: Page;
	readonly channel: string;

	constructor(page: Page, channel: string) {
		this.page = page;
		this.channel = channel;
	}

	// ---------------------------------------------------------------------------
	// Accordion structure
	// ---------------------------------------------------------------------------

	stepPanel(step: 0 | 1 | 2 | 3) {
		return this.page.locator(`#checkout-step-${step}-panel`);
	}

	stepHeader(step: 0 | 1 | 2 | 3) {
		return this.page.locator(`#checkout-step-${step}-header`);
	}

	/**
	 * Returns true if the V2 accordion is rendered on the page.
	 * Distinguishes V2 from legacy checkout by checking for the accordion header IDs.
	 */
	async isV2Active(): Promise<boolean> {
		try {
			await this.page
				.locator("#checkout-step-0-header")
				.waitFor({ state: "attached", timeout: 5_000 });
			return true;
		} catch {
			return false;
		}
	}

	// ---------------------------------------------------------------------------
	// Summary sidebar
	// ---------------------------------------------------------------------------

	get summaryAside() {
		return this.page.locator("aside").first();
	}

	// ---------------------------------------------------------------------------
	// Step 0: Contact
	// ---------------------------------------------------------------------------

	get emailInput() {
		return this.stepPanel(0).locator('input[type="email"]');
	}

	/**
	 * Fill the email field in Contact step and click "Continue".
	 * Waits for the email input to appear (step 0 should be active by default).
	 */
	async fillContactEmail(email: string) {
		await this.emailInput.waitFor({ state: "visible", timeout: 15_000 });
		await this.emailInput.fill(email);
		await this.stepPanel(0).getByRole("button", { name: "Continue" }).click();
	}

	// ---------------------------------------------------------------------------
	// Step 1: Shipping address
	// ---------------------------------------------------------------------------

	/**
	 * Fill the shipping address form in step 1 and click "Continue".
	 * Expects step 1 panel to already be visible (unlocked by completing step 0).
	 */
	async fillShippingAddress(address: TestAddress) {
		const panel = this.stepPanel(1);
		await panel.waitFor({ state: "visible", timeout: 15_000 });

		const textFields: Array<[string, string]> = [
			["firstName", address.firstName],
			["lastName", address.lastName],
			["streetAddress1", address.streetAddress1],
			["city", address.city],
			["postalCode", address.postalCode],
			["phone", address.phone],
		];
		if (address.streetAddress2) textFields.push(["streetAddress2", address.streetAddress2]);
		if (address.companyName) textFields.push(["companyName", address.companyName]);

		for (const [name, value] of textFields) {
			const input = panel.locator(`input[name="${name}"]`);
			if (await input.isVisible().catch(() => false)) {
				await input.fill(value);
			}
		}

		// Country select (may be a <select> or custom combobox)
		const countrySelect = panel.locator('select[name="countryCode"]').first();
		if (await countrySelect.isVisible().catch(() => false)) {
			await countrySelect.selectOption({ value: address.country }).catch(() => {});
		}

		// State / countryArea
		if (address.countryArea) {
			const stateEl = panel.locator(
				'select[name="countryArea"], input[name="countryArea"]',
			);
			if (await stateEl.isVisible().catch(() => false)) {
				const tag = await stateEl.evaluate((el) => el.tagName);
				if (tag === "SELECT") {
					await stateEl.selectOption({ value: address.countryArea }).catch(() => {});
				} else {
					await stateEl.fill(address.countryArea);
				}
			}
		}

		await panel.getByRole("button", { name: "Continue" }).click();
	}

	// ---------------------------------------------------------------------------
	// Step 2: Delivery methods
	// ---------------------------------------------------------------------------

	/** All radio inputs inside the delivery step panel. */
	get deliveryMethodRadios() {
		return this.stepPanel(2).locator('input[type="radio"][name="deliveryMethod"]');
	}

	/**
	 * Wait for at least `minCount` delivery method radios to appear.
	 * Returns the total count found.
	 */
	async waitForDeliveryMethods(minCount = 1): Promise<number> {
		const panel = this.stepPanel(2);
		await panel.waitFor({ state: "visible", timeout: 30_000 });
		await expect(this.deliveryMethodRadios.first()).toBeVisible({ timeout: 20_000 });
		const count = await this.deliveryMethodRadios.count();
		expect(count).toBeGreaterThanOrEqual(minCount);
		return count;
	}

	/** Select the first delivery method and click "Continue". */
	async selectFirstDeliveryMethod() {
		await this.waitForDeliveryMethods(1);
		// force:true because radio inputs styled with `accent-neutral-900` may be visually hidden
		await this.deliveryMethodRadios.first().click({ force: true });
		await this.stepPanel(2).getByRole("button", { name: "Continue" }).click();
	}

	// ---------------------------------------------------------------------------
	// Step 3: Payment (Stripe)
	// ---------------------------------------------------------------------------

	/** Fill Stripe Payment Element iframe with test card details. */
	async fillStripeCard(card = STRIPE_TEST_CARD) {
		const panel = this.stepPanel(3);
		await panel.waitFor({ state: "visible", timeout: 15_000 });

		const stripeFrame = this.page
			.frameLocator('iframe[name*="__privateStripeFrame"], iframe[title*="Secure payment"]')
			.first();

		const cardInput = stripeFrame
			.locator('[name="number"], [placeholder*="Card number"], input')
			.first();
		await cardInput.waitFor({ state: "visible", timeout: 15_000 });
		await cardInput.fill(card.number);

		const expiryInput = stripeFrame
			.locator('[name="expiry"], [placeholder*="MM / YY"]')
			.first();
		await expiryInput.fill(card.expiry);

		const cvcInput = stripeFrame.locator('[name="cvc"], [placeholder*="CVC"]').first();
		await cvcInput.fill(card.cvc);

		const zipInput = stripeFrame.locator('[name="postalCode"], [placeholder*="ZIP"]');
		if (await zipInput.isVisible().catch(() => false)) {
			await zipInput.fill(card.zip);
		}
	}

	/** Click the "Place Order" button in step 3. */
	async placeOrder() {
		const btn = this.page.getByRole("button", {
			name: /place order|pay now|complete order/i,
		});
		await expect(btn).toBeEnabled({ timeout: 10_000 });
		await btn.click();
	}

	// ---------------------------------------------------------------------------
	// Order confirmation (V2 — OrderConfirmation.tsx)
	// ---------------------------------------------------------------------------

	/** The "Order Confirmed" / "Thank you" heading shown after a successful order. */
	get confirmationHeading() {
		return this.page.getByRole("heading", { name: /order confirmed|thank you/i });
	}

	/** Wait for the V2 order confirmation page to render. */
	async expectOrderConfirmation() {
		await expect(this.confirmationHeading).toBeVisible({ timeout: 30_000 });
	}

	// ---------------------------------------------------------------------------
	// Promo code (in summary sidebar)
	// ---------------------------------------------------------------------------

	/** The button that expands the promo code input. */
	get promoToggleButton() {
		return this.page.getByRole("button", { name: /add promo|promo code|gift card/i }).first();
	}

	/** The promo code text input (visible after expanding). */
	get promoCodeInput() {
		return this.page.locator(
			'input[aria-label*="Promo code"], input[aria-label*="promo"], input[placeholder*="Enter code"]',
		);
	}

	/** The "Apply" button for submitting a promo code. */
	get promoApplyButton() {
		return this.page.getByRole("button", { name: "Apply" });
	}

	/** Expand the promo input, type `code`, click Apply. */
	async applyPromoCode(code: string) {
		await this.promoToggleButton.click();
		await this.promoCodeInput.waitFor({ state: "visible", timeout: 5_000 });
		await this.promoCodeInput.fill(code);
		await this.promoApplyButton.click();
	}

	/** Collapse the promo input (click Cancel). */
	async cancelPromoInput() {
		const cancelBtn = this.page.getByRole("button", { name: "Cancel" });
		if (await cancelBtn.isVisible().catch(() => false)) {
			await cancelBtn.click();
		}
	}
}
