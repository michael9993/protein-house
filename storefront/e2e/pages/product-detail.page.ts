import { type Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class ProductDetailPage extends BasePage {
	constructor(page: Page, channel?: string) {
		super(page, channel);
	}

	async gotoProduct(slug: string, variantId?: string) {
		const qs = variantId ? `?variant=${encodeURIComponent(variantId)}` : "";
		await this.goto(`/products/${slug}${qs}`);
	}

	/** Product name heading. */
	get productName() {
		return this.page.locator("h1").first();
	}

	/** The "Add to Cart" button — text changes based on variant selection state. */
	get addToCartButton() {
		return this.page.getByRole("button", { name: /add to cart/i });
	}

	/**
	 * Select all required variants by clicking color + size buttons.
	 * Falls back gracefully if the product doesn't have selectors.
	 */
	async selectAllVariants() {
		// Select color — find the "Select Color" label's parent, then click the first button
		const colorLabel = this.page.locator("text=/^Select Color/i").first();
		if (await colorLabel.isVisible({ timeout: 3_000 }).catch(() => false)) {
			const colorBtn = colorLabel.locator("~ button").first()
				.or(colorLabel.locator("..").locator("> button").first());
			if (await colorBtn.first().isVisible({ timeout: 2_000 }).catch(() => false)) {
				await colorBtn.first().click();
				await this.page.waitForTimeout(500);
			}
		}

		// Select size — look for size buttons (S, M, L, XL, etc.)
		const sizeLabels = ["S", "M", "L", "XL", "2XL", "XS", "36", "37", "38", "39", "40", "41", "42"];
		for (const size of sizeLabels) {
			const btn = this.page.getByRole("button", { name: size, exact: true });
			if (await btn.isVisible({ timeout: 1_000 }).catch(() => false)) {
				const disabled = await btn.isDisabled();
				if (!disabled) {
					await btn.click();
					await this.page.waitForTimeout(500);
					break;
				}
			}
		}
	}

	/** Add the current product to cart. Waits for button to become enabled. */
	async addToCart() {
		await expect(this.addToCartButton).toBeEnabled({ timeout: 15_000 });
		await this.addToCartButton.click();
	}

	/** Verify the product page loaded with content. */
	async expectProductLoaded() {
		await expect(this.productName).toBeVisible({ timeout: 15_000 });
		const name = await this.productName.textContent();
		expect(name?.trim().length).toBeGreaterThan(0);
	}
}
