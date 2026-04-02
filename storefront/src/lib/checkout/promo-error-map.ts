/** Maps a Saleor CheckoutErrorCode to a translatable promo code error message. */
export function mapPromoCodeError(
	errorCode: string,
	texts: {
		promoCodeVoucherNotApplicableError?: string;
		promoCodeGiftCardNotApplicableError?: string;
		promoCodeNotFoundError?: string;
		promoCodeInvalidError?: string;
		promoCodeGenericError?: string;
	},
): string {
	switch (errorCode) {
		case "VOUCHER_NOT_APPLICABLE":
			return texts.promoCodeVoucherNotApplicableError ?? "This voucher is not applicable to your order";
		case "GIFT_CARD_NOT_APPLICABLE":
			return texts.promoCodeGiftCardNotApplicableError ?? "This gift card is not applicable";
		case "NOT_FOUND":
			return texts.promoCodeNotFoundError ?? "Code not found. Please check and try again";
		case "INVALID":
			return texts.promoCodeInvalidError ?? "Invalid code";
		default:
			return texts.promoCodeGenericError ?? "Could not apply code. Please try again";
	}
}
