"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Checkout text configuration from storefront-control
 * All fields are optional for backwards compatibility
 */
export interface CheckoutTextConfig {
	// Page & Header
	checkoutTitle?: string;
	secureCheckout?: string;
	
	// Breadcrumb steps
	shippingStep?: string;
	paymentStep?: string;
	confirmationStep?: string;
	
	// Contact Information Section
	contactInfoTitle?: string;
	contactInfoSubtitle?: string;
	accountLabel?: string;
	signOutButton?: string;
	guestEmailLabel?: string;
	guestEmailPlaceholder?: string;
	createAccountCheckbox?: string;
	passwordLabel?: string;
	
	// Shipping Address Section
	shippingAddressTitle?: string;
	shippingAddressSubtitle?: string;
	addAddressButton?: string;
	editAddressButton?: string;
	changeAddressButton?: string;
	
	// Address Form Fields
	firstNameLabel?: string;
	lastNameLabel?: string;
	companyLabel?: string;
	addressLine1Label?: string;
	addressLine2Label?: string;
	cityLabel?: string;
	countryLabel?: string;
	countryPlaceholder?: string;
	noCountryFound?: string;
	stateLabel?: string;
	postalCodeLabel?: string;
	phoneLabel?: string;
	saveAddressButton?: string;
	cancelButton?: string;
	
	// Localized Address Fields (country-specific variants)
	provinceLabel?: string;
	districtLabel?: string;
	zipCodeLabel?: string;
	postTownLabel?: string;
	prefectureLabel?: string;
	cityAreaLabel?: string;
	countryAreaLabel?: string;
	
	noShippingToCountry?: string;

	// Billing Address Section
	billingAddressTitle?: string;
	billingAddressSubtitle?: string;
	useSameAsShipping?: string;
	
	// Delivery Methods Section
	deliveryMethodsTitle?: string;
	deliveryMethodsSubtitle?: string;
	noShippingMethodsAvailable?: string;
	businessDaysText?: string;
	freeShippingLabel?: string;
	noDeliveryMethodsText?: string;
	fetchingShippingRates?: string;
	updatingShippingRates?: string;
	calculateShippingButton?: string;
	calculatingShippingText?: string;
	recalculateRatesButton?: string;
	addressChangedNotice?: string;
	shippingFetchErrorText?: string;
	shippingFetchErrorHint?: string;
	noShippingMethodsHint?: string;
	tryAgainButton?: string;
	shippingAddressDetected?: string;
	calculateShippingHint?: string;
	/** Shown when a free shipping voucher is applied but selected method has no isFree metadata */
	freeShippingVoucherNotApplicable?: string;
	/** Shown when a free shipping voucher is applied and selected method has isFree true */
	freeShippingAppliedWithMethod?: string;
	
	// Payment Section
	paymentTitle?: string;
	paymentSubtitle?: string;
	paymentMethodLabel?: string;
	payNowButton?: string;
	initializingPaymentText?: string;
	paymentSystemUnavailableError?: string;
	checkoutInfoMissingError?: string;
	paymentFormNotReadyError?: string;
	paymentValidationFailedError?: string;
	transactionCreationFailedError?: string;
	invalidPaymentDataError?: string;
	paymentInitIncompleteError?: string;
	paymentConfirmationFailedError?: string;
	paymentTimeoutError?: string;
	paymentFailedError?: string;
	unexpectedPaymentError?: string;
	paymentSuccessOrderFailedError?: string;

	// Payment Decline / Error Messages
	cardDeclinedError?: string;
	cardExpiredError?: string;
	insufficientFundsError?: string;
	invalidCardError?: string;
	transactionRefusedError?: string;
	verificationRequiredError?: string;
	paymentNotApprovedError?: string;
	paypalTemporaryError?: string;
	genericPaymentDeclineError?: string;

	// Order Summary Section
	orderSummaryTitle?: string;
	itemsCountSingular?: string;
	itemsCountPlural?: string;
	productsLabel?: string;
	quantityLabel?: string;
	addPromoCodeText?: string;
	promoCodeLabel?: string;
	promoCodePlaceholder?: string;
	applyPromoButton?: string;
	removePromoButton?: string;
	/** Hint: one voucher per order; gift cards can be combined */
	oneVoucherPerOrderHint?: string;
	/** Confirm when applying a new code and a voucher is already applied. Use {code} for current voucher code */
	replaceVoucherConfirm?: string;
	giftCardLabel?: string;
	eligibleForFreeShipping?: string;
	subtotalLabel?: string;
	shippingLabel?: string;
	taxLabel?: string;
	includesTaxText?: string;
	totalLabel?: string;
	
	// Place Order Section
	placeOrderButton?: string;
	processingOrderText?: string;
	doNotClosePageText?: string;
	agreementText?: string;
	
	// Order confirmation
	orderConfirmation?: string;
	thankYouTitle?: string;
	thankYouMessage?: string;
	orderNumberLabel?: string;
	continueShoppingButton?: string;
	viewOrderButton?: string;
	
	// Error messages
	requiredFieldError?: string;
	invalidEmailError?: string;
	invalidPhoneError?: string;
	selectDeliveryMethodError?: string;
	deliveryFreeShippingUnlocked?: string;
	deliveryFreeShippingNudge?: string;
	deliveryAddMoreForFreeShipping?: string;
	deliveryFreeShippingSelectMethods?: string;
	shippingSavingsMessage?: string;
	/** Shown when cart quantity change causes the selected delivery method to become unavailable */
	deliveryMethodUnavailable?: string;
	selectPaymentMethodError?: string;
	
	// Footer links
	privacyPolicy?: string;
	termsOfService?: string;
	securityNote?: string;
	
	// Legacy fields
	contactDetails?: string;
	shippingAddress?: string;
	shippingMethod?: string;
	paymentMethod?: string;
	orderSummary?: string;
	placeOrder?: string;
	
	// Sign In/Out
	signInTitle?: string;
	signInButton?: string;
	newCustomerText?: string;
	guestCheckoutButton?: string;
	forgotPasswordLink?: string;
	resendLink?: string;
	processingText?: string;
	orText?: string;
	continueWithGoogle?: string;
	signInWithGoogle?: string;
	alreadyHaveAccount?: string;
	
	// Guest User
	contactDetailsTitle?: string;
	createAccountLabel?: string;
	passwordMinChars?: string;
	
	// Reset Password
	resetPasswordTitle?: string;
	rememberedPasswordText?: string;
	provideNewPasswordText?: string;
	
	// Address List
	noSavedAddressesText?: string;
	useSavedAddressButton?: string;

	// Address Form Actions
	deleteAddressButton?: string;
	deleteAddressConfirmTitle?: string;
	deleteAddressConfirmMessage?: string;
	savingAddressText?: string;
	savedText?: string;
	createAddressTitle?: string;
	editAddressTitle?: string;
	addressSavedSuccess?: string;
	addressUpdatedSuccess?: string;
	cantShipToAddressText?: string;
	
	// Promo code error messages (mapped from Saleor API error codes)
	promoCodeVoucherNotApplicableError?: string;
	promoCodeGiftCardNotApplicableError?: string;
	promoCodeNotFoundError?: string;
	promoCodeInvalidError?: string;
	promoCodeGenericError?: string;
	promoCodeAppliedSuccess?: string;
	promoCodeRemovedSuccess?: string;
	promoCodeRemoveError?: string;

	// Voucher/Gift Card
	voucherLabel?: string;
	giftCardMaskedLabel?: string;
	
	// SSL/Security
	sslEncryptionText?: string;
	
	// Order Info
	orderDetailsTitle?: string;
	contactLabel?: string;
	
	// Payment Status
	authorizedStatus?: string;
	authorizedMessage?: string;
	paidStatus?: string;
	paidMessage?: string;
	overpaidStatus?: string;
	overpaidMessage?: string;
	processingStatus?: string;
	processingMessage?: string;
	
	// Order Confirmation
	almostDoneText?: string;
	orderReceiptTitle?: string;
	orderNumberPrefix?: string;
	orderConfirmedTitle?: string;
	orderConfirmedMessage?: string;
	confirmationSentTo?: string;
	customerLabel?: string;
	orderDateLabel?: string;
	whatsNextTitle?: string;
	orderProcessingStep?: string;
	orderProcessingMessage?: string;
	shippingNotificationStep?: string;
	shippingNotificationMessage?: string;
	deliveryStep?: string;
	deliveryMessage?: string;
	printReceiptButton?: string;
	thankYouPurchaseMessage?: string;

	// Account Created (post-checkout)
	accountCreatedTitle?: string;
	accountCreatedDescription?: string;

	// Empty Cart
	emptyCartTitle?: string;
	emptyCartMessage?: string;
	browseProductsButton?: string;
	goToHomepageButton?: string;
	needHelpText?: string;
	freeShippingBadge?: string;
	easyReturnsBadge?: string;
	securePaymentBadge?: string;
	
	// Order Not Found (failed checkout completion)
	orderNotFoundTitle?: string;
	orderNotFoundMessage?: string;

	// Page Not Found
	noCheckoutFoundTitle?: string;
	noCheckoutFoundMessage?: string;
	checkoutExpiredTitle?: string;
	checkoutExpiredMessage?: string;
	somethingWentWrongTitle?: string;
	somethingWentWrongMessage?: string;
	returnToCartButton?: string;

	// Continue Button (shared across steps)
	continueButtonText?: string;

	// Empty Cart Confirmation
	emptyCartConfirmTitle?: string;
	emptyCartConfirmMessage?: string;
	emptyCartConfirmButton?: string;
	emptyCartCancelButton?: string;
}

const defaultCheckoutText: CheckoutTextConfig = {
	// Page & Header
	checkoutTitle: "Checkout",
	secureCheckout: "Secure Checkout",
	
	// Breadcrumb steps
	shippingStep: "Shipping",
	paymentStep: "Payment",
	confirmationStep: "Confirmation",
	
	// Contact Information Section
	contactInfoTitle: "Contact Information",
	contactInfoSubtitle: "We'll use this to send order updates",
	accountLabel: "Account",
	signOutButton: "Sign out",
	guestEmailLabel: "Email",
	guestEmailPlaceholder: "Enter your email",
	createAccountCheckbox: "Create account for faster checkout",
	passwordLabel: "Password",
	
	// Shipping Address Section
	shippingAddressTitle: "Shipping Address",
	shippingAddressSubtitle: "Where should we deliver?",
	addAddressButton: "Add address",
	editAddressButton: "Edit",
	changeAddressButton: "Change",
	
	// Address Form Fields
	firstNameLabel: "First name",
	lastNameLabel: "Last name",
	companyLabel: "Company",
	addressLine1Label: "Street address",
	addressLine2Label: "Street address (continue)",
	cityLabel: "City",
	countryLabel: "Country",
	countryPlaceholder: "Search country...",
	noCountryFound: "No country found",
	stateLabel: "State",
	postalCodeLabel: "Postal code",
	phoneLabel: "Phone number",
	saveAddressButton: "Save address",
	cancelButton: "Cancel",
	
	// Localized Address Fields (country-specific variants)
	provinceLabel: "Province",
	districtLabel: "District",
	zipCodeLabel: "Zip code",
	postTownLabel: "Post town",
	prefectureLabel: "Prefecture",
	cityAreaLabel: "City area",
	countryAreaLabel: "Country area",
	
	// Billing Address Section
	billingAddressTitle: "Billing Address",
	billingAddressSubtitle: "For your invoice",
	useSameAsShipping: "Use shipping address as billing address",
	noShippingToCountry: "Sorry, we don't currently ship to {country}. Please use a different shipping address.",

	// Delivery Methods Section
	deliveryMethodsTitle: "Delivery methods",
	deliveryMethodsSubtitle: "Choose shipping speed",
	noShippingMethodsAvailable: "No shipping methods available for this address. Please try a different shipping address.",
	businessDaysText: "{min}-{max} business days",
	freeShippingLabel: "Free",
	updatingShippingRates: "Updating shipping rates for new address...",
	calculateShippingButton: "Calculate Shipping Rates",
	calculatingShippingText: "Calculating shipping rates...",
	recalculateRatesButton: "Recalculate",
	addressChangedNotice: "Shipping address changed since last calculation",
	shippingFetchErrorText: "Could not fetch shipping rates",
	shippingFetchErrorHint: "Please verify your shipping address is correct and try again.",
	noShippingMethodsHint: "Please check that your address details are correct, or try a different address.",
	tryAgainButton: "Try Again",
	shippingAddressDetected: "Shipping address detected",
	calculateShippingHint: "Click below to see available shipping options and pricing for your address.",
	noDeliveryMethodsText: "No delivery methods available",
	freeShippingVoucherNotApplicable:
		"Free shipping voucher is not applicable with this delivery method. Choose a free shipping method to use your voucher.",
	freeShippingAppliedWithMethod: "Free shipping applied with this method.",
	
	// Payment Section
	paymentTitle: "Payment",
	paymentSubtitle: "Select your payment method",
	paymentMethodLabel: "Payment methods",
	payNowButton: "Pay now",
	initializingPaymentText: "Initializing payment system...",
	paymentSystemUnavailableError: "Payment system is not available. Please try again later.",
	checkoutInfoMissingError: "Checkout information is missing. Please refresh the page.",
	paymentFormNotReadyError: "Payment form is not ready. Please refresh the page and try again.",
	paymentValidationFailedError: "Payment validation failed",
	transactionCreationFailedError: "Transaction could not be created. Please try again.",
	invalidPaymentDataError: "Invalid payment data received. Please try again.",
	paymentInitIncompleteError: "Payment initialization incomplete. The payment intent was created but the client secret is missing. Please try again.",
	paymentConfirmationFailedError: "Payment confirmation failed. Please try again.",
	paymentTimeoutError: "Payment timed out. Please try again.",
	paymentFailedError: "Payment failed",
	unexpectedPaymentError: "An unexpected error occurred with your payment",
	paymentSuccessOrderFailedError: "Payment was successful but order processing failed. Please contact support.",

	// Payment Decline / Error Messages
	cardDeclinedError: "Your payment method was declined. Please try a different payment method.",
	cardExpiredError: "Your card has expired. Please use a different card.",
	insufficientFundsError: "Insufficient funds. Please use a different payment method.",
	invalidCardError: "Invalid card number. Please check your card details and try again.",
	transactionRefusedError: "This transaction was refused. Please try a different payment method.",
	verificationRequiredError: "Additional verification is required. Please complete the verification step.",
	paymentNotApprovedError: "The payment was not approved. Please try again.",
	paypalTemporaryError: "PayPal is experiencing temporary issues. Please try again in a few minutes.",
	genericPaymentDeclineError: "Payment failed. Please try again or use a different payment method.",

	// Order Summary Section
	orderSummaryTitle: "Order Summary",
	itemsCountSingular: "1 item",
	itemsCountPlural: "{count} items",
	productsLabel: "Products",
	quantityLabel: "Quantity",
	addPromoCodeText: "Add promo code or gift card",
	promoCodeLabel: "Promo code or gift card",
	promoCodePlaceholder: "Enter code",
	applyPromoButton: "Apply",
	removePromoButton: "Remove",
	oneVoucherPerOrderHint: "One voucher per order. Gift cards can be combined.",
	replaceVoucherConfirm: "Only one voucher can be used per order. Applying this code will replace {code}. Continue?",
	giftCardLabel: "Gift card",
	eligibleForFreeShipping: "Eligible for free shipping",
	subtotalLabel: "Subtotal",
	shippingLabel: "Shipping",
	taxLabel: "Tax",
	includesTaxText: "Includes {amount} tax",
	totalLabel: "Total",
	
	// Place Order Section
	placeOrderButton: "Place Order",
	processingOrderText: "Processing your order...",
	doNotClosePageText: "Please do not close this page",
	agreementText: "By placing this order, you agree to our",
	
	// Legacy
	contactDetails: "Contact Details",
	shippingAddress: "Shipping Address",
	shippingMethod: "Shipping Method",
	paymentMethod: "Payment Method",
	orderSummary: "Order Summary",
	placeOrder: "Place Order",
	
	// Order confirmation
	orderConfirmation: "Order Confirmation",
	thankYouTitle: "Thank you for your order!",
	thankYouMessage: "We've received your order and will send you a confirmation email shortly.",
	orderNumberLabel: "Order number",
	continueShoppingButton: "Continue Shopping",
	viewOrderButton: "View Order",
	
	// Error messages
	requiredFieldError: "This field is required",
	invalidEmailError: "Please enter a valid email",
	invalidPhoneError: "Please enter a valid phone number",
	selectDeliveryMethodError: "Please select a delivery method",
	deliveryFreeShippingUnlocked: "Free shipping applied!",
	deliveryFreeShippingNudge: "You've unlocked free shipping! Switch to {methodName} to save {amount}",
	deliveryAddMoreForFreeShipping: "Add {amount} more for free shipping",
	deliveryMethodUnavailable: "Your selected shipping method is no longer available for the current cart. Please choose another.",
	selectPaymentMethodError: "Please select a payment method",
	
	// Sign In/Out
	signInTitle: "Sign in",
	signInButton: "Sign in",
	newCustomerText: "New customer?",
	guestCheckoutButton: "Guest checkout",
	forgotPasswordLink: "Forgot password?",
	resendLink: "Resend?",
	processingText: "Processing…",
	orText: "or",
	continueWithGoogle: "Continue with Google",
	signInWithGoogle: "Sign in with Google",
	alreadyHaveAccount: "Already have an account?",
	
	// Guest User
	contactDetailsTitle: "Contact details",
	createAccountLabel: "I want to create account",
	passwordMinChars: "Password (minimum 8 characters)",
	
	// Reset Password
	resetPasswordTitle: "Reset password",
	rememberedPasswordText: "Remembered your password?",
	provideNewPasswordText: "Provide a new password for your account",
	
	// Address List
	noSavedAddressesText: "You currently have no saved addresses.",
	
	// Address Form Actions
	deleteAddressButton: "Delete address",
	savingAddressText: "Saving…",
	savedText: "Saved",
	createAddressTitle: "Create address",
	editAddressTitle: "Edit address",
	addressSavedSuccess: "Address saved successfully!",
	addressUpdatedSuccess: "Address updated successfully!",
	cantShipToAddressText: "Can't ship to this address",
	
	// Promo code error messages
	promoCodeVoucherNotApplicableError: "This voucher is not applicable to your order",
	promoCodeGiftCardNotApplicableError: "This gift card is not applicable",
	promoCodeNotFoundError: "Code not found. Please check and try again",
	promoCodeInvalidError: "Invalid code",
	promoCodeGenericError: "Could not apply code. Please try again",
	promoCodeAppliedSuccess: "Promo code applied!",
	promoCodeRemovedSuccess: "Promo code removed",
	promoCodeRemoveError: "Failed to remove code",

	// Voucher/Gift Card
	voucherLabel: "Voucher:",
	giftCardMaskedLabel: "Gift Card: ••••",
	
	// SSL/Security
	sslEncryptionText: "Secure 256-bit SSL encryption",
	
	// Order Info
	orderDetailsTitle: "Order Details",
	contactLabel: "Contact",
	
	// Payment Status
	authorizedStatus: "Authorized",
	authorizedMessage: "We've received your payment authorization",
	paidStatus: "Paid",
	paidMessage: "We've received your payment",
	overpaidStatus: "Overpaid",
	overpaidMessage: "Contact support for refund assistance",
	processingStatus: "Processing",
	processingMessage: "Payment is being processed",
	
	// Order Confirmation
	almostDoneText: "Almost done…",
	orderReceiptTitle: "Order Receipt",
	orderNumberPrefix: "Order #",
	orderConfirmedTitle: "Order Confirmed",
	orderConfirmedMessage: "Thank you for your order! We've received it and will notify you when your package ships.",
	confirmationSentTo: "Confirmation sent to:",
	customerLabel: "Customer:",
	orderDateLabel: "Order Date:",
	whatsNextTitle: "What's Next?",
	orderProcessingStep: "Order Processing",
	orderProcessingMessage: "We're preparing your order for shipment.",
	shippingNotificationStep: "Shipping Notification",
	shippingNotificationMessage: "You'll receive tracking info when shipped.",
	deliveryStep: "Delivery",
	deliveryMessage: "Your order will arrive at your doorstep!",
	printReceiptButton: "Print Receipt",
	thankYouPurchaseMessage: "Thank you for your purchase! If you have any questions, please contact our support team.",
	
	// Empty Cart
	emptyCartTitle: "Your cart is empty",
	emptyCartMessage: "Looks like you haven't added anything to your cart yet. Explore our products and find something you'll love!",
	browseProductsButton: "Browse Products",
	goToHomepageButton: "Go to Homepage",
	needHelpText: "Need help?",
	freeShippingBadge: "Free shipping on orders over $50",
	easyReturnsBadge: "Easy 30-day returns",
	securePaymentBadge: "Secure payment processing",
	
	// Page Not Found
	noCheckoutFoundTitle: "No checkout found",
	noCheckoutFoundMessage: "It looks like you haven't started a checkout yet. Add some items to your cart first.",
	checkoutExpiredTitle: "Checkout expired or invalid",
	checkoutExpiredMessage: "This checkout session has expired or is no longer valid. Please return to your cart and try again.",
	somethingWentWrongTitle: "Something went wrong",
	somethingWentWrongMessage: "We couldn't load your checkout. Please return to your cart and try again.",
	returnToCartButton: "Return to Cart",

	// Continue Button (shared across steps)
	continueButtonText: "Continue",

	// Empty Cart Confirmation
	emptyCartConfirmTitle: "Remove last item?",
	emptyCartConfirmMessage: "This will empty your cart and take you back to the store.",
	emptyCartConfirmButton: "Empty cart",
	emptyCartCancelButton: "Keep shopping",
};

const CheckoutTextContext = createContext<CheckoutTextConfig>(defaultCheckoutText);

interface CheckoutTextProviderProps {
	children: ReactNode;
	config?: CheckoutTextConfig;
}

export function CheckoutTextProvider({ children, config }: CheckoutTextProviderProps) {
	// Merge provided config with defaults
	const mergedConfig = { ...defaultCheckoutText, ...config };
	
	return (
		<CheckoutTextContext.Provider value={mergedConfig}>
			{children}
		</CheckoutTextContext.Provider>
	);
}

export function useCheckoutText(): CheckoutTextConfig {
	return useContext(CheckoutTextContext);
}

/**
 * Helper to format text with placeholders
 * e.g., formatText("{min}-{max} business days", { min: 3, max: 5 }) => "3-5 business days"
 */
export function formatText(template: string, values: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`));
}
