import { type Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class ProductDetailPage extends BasePage {
	constructor(page: Page, channel?: string) {
		super(page, channel);
	}

	async gotoProduct(slug: string) {
		await this.goto(`/products/${slug}`);
	}

	/** Product name heading. */
	get productName() {
		return this.page.locator("h1").first();
	}

	/** Current (sale) price. */
	get currentPrice() {
		return this.page.locator('[data-testid="pdp-price"]').or(
			this.page.locator("span.text-2xl.font-bold").first(),
		);
	}

	/** The "Add to Cart" button. */
	get addToCartButton() {
		return this.page.locator('[data-testid="pdp-add-to-cart"]').or(
			this.page.getByRole("button", { name: /add to cart/i }),
		);
	}

	/** Variant/size selector buttons. */
	variantButton(label: string) {
		return this.page.getByRole("button", { name: label, exact: true });
	}

	/** Select the first available variant (not disabled). */
	async selectFirstAvailableVariant() {
		// Look for variant selector buttons that aren't disabled
		const variants = this.page.locator(
			'[data-testid="pdp-variant-selector"] button:not([disabled]), .variant-selector button:not([disabled])',
		);
		const count = await variants.count();
		if (count > 0) {
			await variants.first().click();
		}
	}

	/** Add the current product to cart. */
	async addToCart() {
		await expect(this.addToCartButton).toBeEnabled({ timeout: 10_000 });
		await this.addToCartButton.click();
	}

	/** Verify the product page loaded with content. */
	async expectProductLoaded() {
		await expect(this.productName).toBeVisible({ timeout: 15_000 });
		const name = await this.productName.textContent();
		expect(name?.trim().length).toBeGreaterThan(0);
	}
}
