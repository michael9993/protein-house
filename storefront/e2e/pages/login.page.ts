import { type Page, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class LoginPage extends BasePage {
	constructor(page: Page, channel?: string) {
		super(page, channel);
	}

	async gotoLogin() {
		await this.goto("/login");
	}

	// --- Form elements ---

	get emailInput() {
		return this.page.getByRole("textbox", { name: /email/i }).first();
	}

	get passwordInput() {
		return this.page.getByRole("textbox", { name: /^password$/i }).first();
	}

	/** The main form submit button (not the tab button). */
	get submitButton() {
		// There are two "Sign In" buttons — one is a tab, one is the submit.
		// The submit button has an svg icon inside it and is within the form.
		return this.page.locator("button").filter({ hasText: /^sign in$|^sign up$|^create account$/i })
			.filter({ has: this.page.locator("svg, img") })
			.first();
	}

	get errorMessage() {
		// Error messages appear as alert/error text near the form
		return this.page.locator("[role='alert'], .text-red-600, .text-red-500, [class*='error']").first();
	}

	get forgotPasswordLink() {
		return this.page.getByRole("link", { name: /forgot password/i });
	}

	// --- Register mode fields ---

	get firstNameInput() {
		return this.page.getByRole("textbox", { name: /first name/i });
	}

	get lastNameInput() {
		return this.page.getByRole("textbox", { name: /last name/i });
	}

	get confirmPasswordInput() {
		return this.page.getByRole("textbox", { name: /confirm password/i });
	}

	// --- Tab switching ---

	/** Switch to the "Sign Up" (register) tab. */
	async switchToRegister() {
		const tab = this.page.getByRole("button", { name: /sign up/i }).first();
		await tab.click();
		// Wait for the register form fields to appear
		await this.page.waitForTimeout(500);
	}

	/** Switch to the "Sign In" (login) tab. */
	async switchToLogin() {
		const tab = this.page.getByRole("button", { name: /sign in/i }).first();
		await tab.click();
		await expect(this.emailInput).toBeVisible();
	}

	// --- Actions ---

	/** Fill and submit the login form. */
	async login(email: string, password: string) {
		await this.emailInput.fill(email);
		await this.passwordInput.fill(password);
		await this.submitButton.click();
	}

	/** Fill and submit the registration form. */
	async register(data: {
		firstName: string;
		lastName: string;
		email: string;
		password: string;
	}) {
		await this.switchToRegister();
		await this.firstNameInput.fill(data.firstName);
		await this.lastNameInput.fill(data.lastName);
		await this.emailInput.fill(data.email);
		await this.passwordInput.fill(data.password);

		// Confirm password may not exist in all forms
		const confirmPwd = this.confirmPasswordInput;
		if (await confirmPwd.isVisible({ timeout: 2_000 }).catch(() => false)) {
			await confirmPwd.fill(data.password);
		}

		await this.submitButton.click();
	}

	/** Expect a successful login redirected to account page. */
	async expectLoggedIn() {
		await this.page.waitForURL(
			(url) => url.pathname.includes("/account") || !url.pathname.includes("/login"),
			{ timeout: 15_000 },
		);
	}

	/** Expect a login error message to be visible. */
	async expectLoginError() {
		await expect(this.errorMessage).toBeVisible({ timeout: 10_000 });
	}
}
