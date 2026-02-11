import { z } from "zod";

// ============================================
// CONTENT/TEXT SCHEMA
// ============================================
export const CartTextSchema = z.object({
  emptyCartTitle: z.string(),
  emptyCartMessage: z.string(),
  cartTitle: z.string(),
  checkoutButton: z.string(),
  continueShoppingButton: z.string(),
  // Selection controls
  selectAllButton: z.string(),            // "Select All"
  deselectAllButton: z.string(),          // "Deselect All"
  selectAllItemsButton: z.string(),       // "Select all items"
  selectItemsToCheckout: z.string(),      // "Select items to proceed to checkout"
  // Free shipping message
  freeShippingMessage: z.string(),       // "Add {amount} more for free shipping" or "You qualify for free shipping!"
  freeShippingThresholdReached: z.string(), // "You've qualified for free shipping!"
  addXMoreForFreeShipping: z.string(),    // "Add {amount} more for FREE shipping!"
  unlockedFreeShipping: z.string(),       // "You've unlocked FREE shipping!"
  // Item actions
  saveForLaterButton: z.string(),         // "Save for Later"
  moveToCartButton: z.string(),           // "Move to Cart"
  deleteButton: z.string(),               // "Delete"
  // Labels and text
  itemSingular: z.string(),               // "item"
  itemPlural: z.string(),                 // "items"
  orderSummaryTitle: z.string(),          // "Order Summary"
  itemsSelectedText: z.string(),          // "{count} {singular|plural} selected"
  eachLabel: z.string(),                  // "each"
  availableLabel: z.string(),             // "available"
  outOfStockLabel: z.string(),            // "Out of stock"
  // Loading states
  loadingCheckoutTitle: z.string(),       // "Loading Checkout..."
  loadingCheckoutMessage: z.string(),     // "Please wait while we prepare your checkout"
  // Error messages
  quantityMinError: z.string(),           // "Quantity must be at least 1"
  onlyXItemsAvailable: z.string(),        // "Only {count} items available in stock"
  useDeleteButtonMessage: z.string(),     // "Use the Delete button to remove items from cart"
  failedToUpdateQuantity: z.string(),     // "Failed to update quantity"
  onlyXAvailable: z.string(),             // "Only {count} available"
  // Success messages
  quantityUpdatedSuccess: z.string(),     // "Quantity updated!"
  // Promo code section
  promoCodeLabel: z.string(),             // "Promo Code"
  promoCodePlaceholder: z.string(),       // "Enter code"
  promoCodeApplyButton: z.string(),       // "Apply"
  eligibleForFreeShipping: z.string().optional(),  // "Eligible for free shipping" (when shipping voucher applied)
  // Order summary
  subtotalLabel: z.string(),              // "Subtotal"
  subtotalLabelWithCount: z.string(),     // "Subtotal ({count} items)"
  shippingLabel: z.string(),              // "Shipping"
  shippingFree: z.string(),               // "FREE"
  shippingCalculatedAtCheckout: z.string(), // "Calculated at checkout"
  totalLabel: z.string(),                 // "Total"
  // Checkout button states
  selectItemsButton: z.string(),          // "Select Items"
  preparingCheckout: z.string(),          // "Preparing..."
  loadingCheckout: z.string(),            // "Loading..."
  // Price breakdown labels
  originalSubtotalLabel: z.string().optional(),    // "Subtotal" (before discount)
  discountedSubtotalLabel: z.string().optional(),  // "Your price" (after discount)
  // Trust badges
  secureCheckoutText: z.string(),         // "Secure Checkout"
  sslEncryptedText: z.string(),           // "SSL Encrypted"
  // Payment methods
  acceptedPaymentMethods: z.string(),     // "Accepted Payment Methods"
  providedByStripe: z.string(),           // "Provided by Stripe"
  // Saved for later
  itemsSavedForLater: z.string(),         // "{count} item(s) saved for later"
  // Additional cart UI fields
  viewCartButton: z.string().optional(),           // "View Full Cart"
  shippingNote: z.string().optional(),             // "Shipping and taxes calculated at checkout"
  youSaveLabel: z.string().optional(),             // "You save"
  // Gift lines (order promotion GIFT reward)
  giftLabel: z.string().optional(),               // "Gift" badge next to gift line
  giftAddedMessage: z.string().optional(),         // Toast: "A free gift has been added to your cart."
  giftRemoveHint: z.string().optional(),           // "(You can remove it)" or empty to hide
});

export const ProductTextSchema = z.object({
  addToCartButton: z.string(),
  buyNowButton: z.string(),
  outOfStockText: z.string(),
  lowStockText: z.string(),
  inStockText: z.string(),
  saleBadgeText: z.string(),
  newBadgeText: z.string(),
  reviewsTitle: z.string(),
  writeReviewButton: z.string(),
  noReviewsText: z.string(),
  // Button states
  addingButton: z.string(),               // "Adding..."
  addedToCartButton: z.string(),          // "Added to Cart!"
  selectOptionsButton: z.string(),        // "Select Options"
  viewCartLink: z.string(),               // "View Cart â†’"
  // Quick view modal
  quickAddButton: z.string(),             // "Quick add" (product card button)
  viewFullPageLink: z.string(),           // "View full page" (quick view modal link)
  loadingProductText: z.string(),         // "Loading product..." (quick view modal loader)
  productDetailsTitle: z.string().optional(),  // "Product Details" (modal title when loading)
  closeButton: z.string().optional(),     // "Close" (modal/error close button)
  productNotFoundText: z.string().optional(), // "Product not found" (modal error)
  errorLoadingProductText: z.string().optional(), // "Failed to load product" (modal error)
});

export const AccountTextSchema = z.object({
  signInTitle: z.string(),
  signUpTitle: z.string(),
  signInButton: z.string(),
  signUpButton: z.string(),
  signOutButton: z.string(),
  forgotPasswordLink: z.string(),
  myAccountTitle: z.string(),
  ordersTitle: z.string(),
  addressesTitle: z.string(),
  wishlistTitle: z.string(),
  settingsTitle: z.string(),
  // Extended fields for account sidebar
  dashboardTitle: z.string(),
  needHelpTitle: z.string(),
  needHelpDescription: z.string(),
  contactSupportButton: z.string(),
  // Login page text
  signInSubtitle: z.string(), // "Sign in to access your orders, wishlist and personalized recommendations"
  signUpSubtitle: z.string(), // "Join us to enjoy exclusive benefits and faster checkout"
  orContinueWith: z.string(), // "or continue with"
  whyCreateAccount: z.string(), // "Why create an account?"
  benefitFasterCheckout: z.string(), // "Faster checkout with saved details"
  benefitTrackOrders: z.string(), // "Track your orders in real-time"
  benefitWishlist: z.string(), // "Save items to your wishlist"
  benefitDiscounts: z.string(), // "Exclusive member discounts & offers"
  termsAgreement: z.string(), // "By continuing, you agree to our"
  termsOfService: z.string(), // "Terms of Service"
  privacyPolicy: z.string(), // "Privacy Policy"
  emailLabel: z.string(), // "Email Address"
  emailPlaceholder: z.string(), // "you@example.com"
  passwordLabel: z.string(), // "Password"
  passwordPlaceholder: z.string(), // "Enter your password"
  confirmPasswordLabel: z.string(), // "Confirm Password"
  confirmPasswordPlaceholder: z.string(), // "Confirm your password"
  firstNameLabel: z.string(), // "First Name"
  lastNameLabel: z.string(), // "Last Name"
  createAccountButton: z.string(), // "Create Account"
  processingText: z.string(), // "Processing..."
  emailConfirmedMessage: z.string(), // "Your email has been confirmed successfully!"
  canNowSignIn: z.string(), // "You can now sign in to your account."
  switchToSignIn: z.string(), // "Switch to Sign In â†’"
  accountExistsMessage: z.string(), // "You already have an account with this email..."
  // Forgot / reset password
  forgotPasswordTitle: z.string(),
  forgotPasswordSubtitle: z.string(),
  sendResetLinkButton: z.string(),
  forgotPasswordSuccessMessage: z.string(),
  resetPasswordTitle: z.string(),
  resetPasswordSubtitle: z.string(),
  newPasswordLabel: z.string(),
  newPasswordPlaceholder: z.string(),
  invalidResetLinkMessage: z.string(),
  resetLinkExpiredError: z.string(),
  // Verify email page
  verifyEmailTitle: z.string(),
  verifyEmailSubtitle: z.string(),
  verifyEmailSentTo: z.string(),
  verifyEmailInstructions: z.string(),
  verifyEmailNotReceived: z.string(),
  verifyEmailNotReceivedTitle: z.string(),
  verifyEmailNotReceivedIntro: z.string(),
  verifyEmailCheckSpam: z.string(),
  verifyEmailWaitMinutes: z.string(),
  verifyEmailSignInToResend: z.string(),
  resendConfirmationButton: z.string(),
  resendSendingText: z.string(),
  resendSuccessMessage: z.string(),
  backToSignIn: z.string(),
  signInToResendEmail: z.string(),
  signInFirstToResend: z.string(),
  verifyEmailExpiryHelp: z.string(),
  verifyEmailRequiredError: z.string(),
  // Confirm email page (link landing)
  confirmAccountTitle: z.string(),
  confirmAccountSubtitle: z.string(),
  confirmAccountLinkExpiredError: z.string(),
  confirmAccountRequestNewLink: z.string(),
  confirmAccountUnexpectedError: z.string(),
  confirmAccountAlreadyConfirmed: z.string(),
  confirmAccountEmailLabel: z.string(),
  confirmAccountEmailPlaceholder: z.string(),
  confirmAccountTokenLabel: z.string(),
  confirmAccountTokenPlaceholder: z.string(),
  confirmAccountTokenHint: z.string(),
  confirmAccountButton: z.string(),
  confirmAccountBackToSignIn: z.string(),
  confirmAccountConfirmingText: z.string(),
  confirmAccountSuccessMessage: z.string(),
  confirmAccountCheckingMessage: z.string(),
  confirmAccountAutoLoginHint: z.string(),
  // Error messages
  loginInvalidCredentialsError: z.string(), // "Please, enter valid credentials"
  loginEmailPasswordRequiredError: z.string(), // "Email and password are required"
  loginGenericError: z.string(), // "An error occurred during login. Please try again."
  registerEmailPasswordRequiredError: z.string(), // "Email and password are required"
  registerFailedError: z.string(), // "Registration failed"
  registerAccountExistsError: z.string(), // "An account with this email already exists. Please sign in instead."
  registerGenericError: z.string(), // "An error occurred during registration. Please try again."
  passwordMismatchError: z.string(), // "Passwords do not match. Please try again."
  passwordTooShortError: z.string(), // "Password must be at least 8 characters."
  // Rate limiting messages
  passwordResetRateLimitError: z.string(), // "You've already requested a password reset recently..."
  passwordResetRateLimitInfo: z.string(), // "If you don't receive an email..."
});

export const GeneralTextSchema = z.object({
  searchPlaceholder: z.string(),
  newsletterTitle: z.string(),
  newsletterDescription: z.string(),
  newsletterButton: z.string(),
  newsletterSuccess: z.string(),
  newsletterPlaceholder: z.string(), // "Enter your email"
  newsletterNoSpam: z.string(), // "No spam, ever"
  newsletterWeeklyUpdates: z.string(), // "Weekly updates"
  newsletterExclusiveOffers: z.string(), // "Exclusive offers"
  newsletterAlreadySubscribed: z.string(), // "You're subscribed to our newsletter!"
  loadMoreButton: z.string(),
  viewAllButton: z.string(),
  backButton: z.string(),
  closeButton: z.string(),
  saveButton: z.string(),
  cancelButton: z.string(),
  confirmButton: z.string(),
  deleteButton: z.string(),
  editButton: z.string(),
  // Breadcrumbs
  homeLabel: z.string(),                // "Home" (for breadcrumbs)
});

// Homepage section titles
export const HomepageTextSchema = z.object({
  newArrivalsTitle: z.string(),
  newArrivalsSubtitle: z.string(),
  bestSellersTitle: z.string(),
  bestSellersSubtitle: z.string(),
  onSaleTitle: z.string(),
  onSaleSubtitle: z.string(),
  featuredTitle: z.string(),
  featuredSubtitle: z.string(),
  categoriesTitle: z.string(),
  categoriesSubtitle: z.string(),
  viewAllCategoriesButton: z.string(), // "View All Categories"
  subcategoriesLabel: z.string(),      // "Subcategories"
  viewCategoryButton: z.string(),      // "View All"
  productsLabel: z.string(),           // "products"
  brandsTitle: z.string(),
  brandsSubtitle: z.string(),
  testimonialsTitle: z.string(),
  testimonialsSubtitle: z.string(),
  // Trust badges labels
  averageRatingLabel: z.string(),         // "Average Rating"
  happyCustomersLabel: z.string(),        // "Happy Customers"
  satisfactionRateLabel: z.string(),      // "Satisfaction Rate"
  ordersDeliveredLabel: z.string(),       // "Orders Delivered"
  // Testimonials labels
  verifiedPurchaseLabel: z.string(),      // "Verified Purchase"
  loadingReviewsText: z.string(),         // "Loading reviews..."
  noReviewsAvailableText: z.string(),     // "No reviews available yet. Be the first to review our products!"
  noReviewsSubtext: z.string(),           // "Reviews will appear here once customers start leaving feedback."
  noApprovedReviewsText: z.string(),      // "No approved reviews with 4+ stars yet. {count} review(s) pending approval."
  heroCtaText: z.string(),
  heroSecondaryCtaText: z.string(),
  // Hero section stats and labels
  exploreBrandsButton: z.string(),        // "Explore brands"
  brandsStatLabel: z.string(),            // "Brands" (stat label)
  stylesStatLabel: z.string(),            // "Styles" (stat label)
  ratingStatLabel: z.string(),            // "Rating" (stat label)
  heroDefaultTitle: z.string(),           // Default hero title when no CMS banner
  heroDefaultSubtitle: z.string(),        // Default hero subtitle
  watchVideoButton: z.string(),           // "Watch Video" (for hero video section)
  // Category cards
  shopNowButton: z.string(),              // "Shop Now"
  exploreText: z.string(),                // "Explore" (for category cards)
  productCountText: z.string(),           // "Products" or "{count} Products"
  // Newsletter
  newsletterEmailPlaceholder: z.string(), // "Enter your email"

  // V6 Homepage Section Labels
  curatedLabel: z.string(),               // "Curated" (section header label)
  viewDetailsButton: z.string(),          // "View details" (product card hover)
  viewAllBrandsButton: z.string(),        // "View all brands"
  viewAllOffersButton: z.string(),        // "View all offers" (flash deals)
  allCollectionsButton: z.string(),       // "All Collections" (collection mosaic)
  itemsText: z.string(),                  // "items" (e.g., "{count} items")
  stylesText: z.string(),                 // "styles" (e.g., "{count} styles")
  performanceLineupText: z.string(),      // "Performance lineup" (brand card)
  brandLabel: z.string(),                 // "Brand" (brand card label)
  performanceFallback: z.string(),        // "Performance" (fallback for category)

  // Product Badge Labels
  saleBadgeLabel: z.string(),             // "Sale" (fallback when no discount %)
  saleBadgeOffText: z.string(),           // "OFF" (used in "-20% OFF" badge)
  newBadgeLabel: z.string(),              // "New"
  featuredBadgeLabel: z.string(),         // "Featured"
  outOfStockBadgeLabel: z.string(),       // "Out of stock"
  lowStockBadgeLabel: z.string(),         // "Low stock"

  // Flash Deals / Sale Section
  itemsOnSaleText: z.string(),            // "{count} items on sale"
  savePercentText: z.string(),            // "Save {discount}%"
  upToPercentOffText: z.string(),         // "Up to {discount}% Off"

  // Customer Feedback / Testimonials
  reviewedProductLabel: z.string(),       // "Reviewed Product"
  verifiedBuyerLabel: z.string(),         // "Verified Buyer"
  anonymousLabel: z.string(),             // "Anonymous"

  // Collection Mosaic
  shopCollectionButton: z.string(),       // "Shop collection"
  featuredCollectionLabel: z.string(),    // "Featured Collection"

  // Promotion Banner
  specialOfferText: z.string(),           // "Special Offer" (badge)
  dontMissOutTitle: z.string(),           // "Don't miss out" (promo title)
  shopSaleItemsButton: z.string(),        // "Shop Sale Items"
  allProductsButton: z.string(),          // "All Products"
  promoDescriptionFallback: z.string(),   // "Premium performance gear for run, court, and studio. Limited time collection."

  // Recently Viewed Products
  recentlyViewedSubLabel: z.string(),     // "Your History" (small label above title)
  recentlyViewedTitle: z.string(),        // "Recently Viewed"
  recentlyViewedSubtitle: z.string(),     // "Products you've looked at recently"
});

// Checkout text
export const CheckoutTextSchema = z.object({
  // Page title
  checkoutTitle: z.string().optional(),           // "Checkout"
  // Secure checkout badge
  secureCheckout: z.string(),
  // Breadcrumb steps
  shippingStep: z.string().optional(),            // "Shipping"
  paymentStep: z.string().optional(),             // "Payment"
  confirmationStep: z.string().optional(),        // "Confirmation"

  // Contact Information Section
  contactInfoTitle: z.string().optional(),        // "Contact Information"
  contactInfoSubtitle: z.string().optional(),     // "We'll use this to send order updates"
  accountLabel: z.string().optional(),            // "Account"
  signOutButton: z.string().optional(),           // "Sign out"
  guestEmailLabel: z.string().optional(),         // "Email"
  guestEmailPlaceholder: z.string().optional(),   // "Enter your email"
  createAccountCheckbox: z.string().optional(),   // "Create account for faster checkout"
  passwordLabel: z.string().optional(),           // "Password"

  // Shipping Address Section
  shippingAddressTitle: z.string().optional(),    // "Shipping Address"
  shippingAddressSubtitle: z.string().optional(), // "Where should we deliver?"
  addAddressButton: z.string().optional(),        // "Add address"
  editAddressButton: z.string().optional(),       // "Edit"
  changeAddressButton: z.string().optional(),     // "Change"

  // Address Form Fields
  firstNameLabel: z.string().optional(),          // "First name"
  lastNameLabel: z.string().optional(),           // "Last name"
  companyLabel: z.string().optional(),            // "Company (optional)"
  addressLine1Label: z.string().optional(),       // "Address"
  addressLine2Label: z.string().optional(),       // "Apartment, suite, etc. (optional)"
  cityLabel: z.string().optional(),               // "City"
  countryLabel: z.string().optional(),            // "Country"
  stateLabel: z.string().optional(),              // "State/Province"
  postalCodeLabel: z.string().optional(),         // "Postal code"
  phoneLabel: z.string().optional(),              // "Phone"
  saveAddressButton: z.string().optional(),       // "Save address"
  cancelButton: z.string().optional(),            // "Cancel"

  // Localized Address Fields (country-specific variants)
  provinceLabel: z.string().optional(),           // "Province"
  districtLabel: z.string().optional(),           // "District"
  zipCodeLabel: z.string().optional(),            // "Zip code"
  postTownLabel: z.string().optional(),           // "Post town"
  prefectureLabel: z.string().optional(),         // "Prefecture"
  cityAreaLabel: z.string().optional(),           // "City area"
  countryAreaLabel: z.string().optional(),        // "Country area"

  // Billing Address Section
  billingAddressTitle: z.string().optional(),     // "Billing Address"
  billingAddressSubtitle: z.string().optional(),  // "For your invoice"
  useSameAsShipping: z.string().optional(),       // "Use shipping address as billing address"

  // Delivery Methods Section
  deliveryMethodsTitle: z.string().optional(),    // "Delivery methods"
  businessDaysText: z.string().optional(),        // "{min}-{max} business days"
  freeShippingLabel: z.string().optional(),       // "Free"
  noDeliveryMethodsText: z.string().optional(),   // "No delivery methods available"
  freeShippingVoucherNotApplicable: z.string().optional(),  // When voucher is shipping but selected method has no isFree
  freeShippingAppliedWithMethod: z.string().optional(),      // When voucher is shipping and selected method has isFree true

  // Payment Section
  paymentTitle: z.string().optional(),            // "Payment"
  paymentSubtitle: z.string().optional(),         // "Select your payment method"
  paymentMethodLabel: z.string().optional(),      // "Payment method"
  payNowButton: z.string().optional(),            // "Pay now"
  initializingPaymentText: z.string().optional(), // "Initializing payment system..."
  paymentSystemUnavailableError: z.string().optional(), // "Payment system is not available..."
  checkoutInfoMissingError: z.string().optional(), // "Checkout information is missing..."
  paymentFormNotReadyError: z.string().optional(), // "Payment form is not ready..."
  paymentValidationFailedError: z.string().optional(), // "Payment validation failed"
  transactionCreationFailedError: z.string().optional(), // "Transaction could not be created..."
  invalidPaymentDataError: z.string().optional(), // "Invalid payment data received..."
  paymentInitIncompleteError: z.string().optional(), // "Payment initialization incomplete..."
  paymentConfirmationFailedError: z.string().optional(), // "Payment confirmation failed..."
  paymentFailedError: z.string().optional(),      // "Payment failed"
  unexpectedPaymentError: z.string().optional(),  // "An unexpected error occurred..."
  paymentSuccessOrderFailedError: z.string().optional(), // "Payment was successful but order processing failed..."

  // Order Summary Section  
  orderSummaryTitle: z.string().optional(),       // "Order Summary"
  itemsCountSingular: z.string().optional(),      // "1 item"
  itemsCountPlural: z.string().optional(),        // "{count} items"
  productsLabel: z.string().optional(),           // "Products"
  quantityLabel: z.string().optional(),           // "Quantity"
  addPromoCodeText: z.string().optional(),        // "Add promo code or gift card"
  promoCodeLabel: z.string().optional(),          // "Promo code"
  promoCodePlaceholder: z.string().optional(),    // "Enter code"
  applyPromoButton: z.string().optional(),        // "Apply"
  removePromoButton: z.string().optional(),       // "Remove"
  oneVoucherPerOrderHint: z.string().optional(),  // "One voucher per order. Gift cards can be combined."
  replaceVoucherConfirm: z.string().optional(),    // "Only one voucher... Replace {code}. Continue?" (use {code})
  eligibleForFreeShipping: z.string().optional(), // "Eligible for free shipping" (when shipping voucher applied)
  giftCardLabel: z.string().optional(),           // "Gift card"
  subtotalLabel: z.string().optional(),           // "Subtotal"
  shippingLabel: z.string().optional(),           // "Shipping"
  taxLabel: z.string().optional(),                // "Tax"
  includesTaxText: z.string().optional(),         // "Includes {amount} tax"
  totalLabel: z.string().optional(),              // "Total"

  // Form sections (legacy - keeping for backwards compatibility)
  contactDetails: z.string(),
  shippingAddress: z.string(),
  shippingMethod: z.string(),
  paymentMethod: z.string(),
  orderSummary: z.string(),
  placeOrder: z.string(),

  // Place Order Section
  placeOrderButton: z.string().optional(),        // "Place Order"
  processingOrderText: z.string().optional(),     // "Processing your order..."
  agreementText: z.string().optional(),           // "By placing this order, you agree to our"

  // Order confirmation
  almostDoneText: z.string().optional(),          // "Almost doneâ€¦"
  orderConfirmation: z.string(),
  thankYouTitle: z.string(),
  thankYouMessage: z.string(),
  orderNumberLabel: z.string().optional(),        // "Order number"
  continueShoppingButton: z.string().optional(),  // "Continue Shopping"
  viewOrderButton: z.string().optional(),         // "View Order"
  orderReceiptTitle: z.string().optional(),       // "Order Receipt"
  orderNumberPrefix: z.string().optional(),       // "Order #"
  orderConfirmedTitle: z.string().optional(),     // "Order Confirmed"
  orderConfirmedMessage: z.string().optional(),   // "Thank you for your order!..."
  confirmationSentTo: z.string().optional(),      // "Confirmation sent to:"
  customerLabel: z.string().optional(),           // "Customer:"
  orderDateLabel: z.string().optional(),          // "Order Date:"
  whatsNextTitle: z.string().optional(),          // "What's Next?"
  orderProcessingStep: z.string().optional(),     // "Order Processing"
  orderProcessingMessage: z.string().optional(),  // "We're preparing your order for shipment."
  shippingNotificationStep: z.string().optional(), // "Shipping Notification"
  shippingNotificationMessage: z.string().optional(), // "You'll receive tracking info when shipped."
  deliveryStep: z.string().optional(),            // "Delivery"
  deliveryMessage: z.string().optional(),         // "Your order will arrive at your doorstep!"
  printReceiptButton: z.string().optional(),      // "Print Receipt"
  thankYouPurchaseMessage: z.string().optional(), // "Thank you for your purchase!..."

  // Order Info Section (confirmation page)
  orderDetailsTitle: z.string().optional(),       // "Order Details"
  contactLabel: z.string().optional(),            // "Contact"
  authorizedStatus: z.string().optional(),        // "Authorized"
  authorizedMessage: z.string().optional(),       // "We've received your payment authorization"
  paidStatus: z.string().optional(),              // "Paid"
  paidMessage: z.string().optional(),             // "We've received your payment"
  overpaidStatus: z.string().optional(),          // "Overpaid"
  overpaidMessage: z.string().optional(),         // "Contact support for refund assistance"
  processingStatus: z.string().optional(),        // "Processing"
  processingMessage: z.string().optional(),       // "Payment is being processed"

  // Error messages
  requiredFieldError: z.string().optional(),      // "This field is required"
  invalidEmailError: z.string().optional(),       // "Please enter a valid email"
  invalidPhoneError: z.string().optional(),       // "Please enter a valid phone number"
  selectDeliveryMethodError: z.string().optional(), // "Please select a delivery method"
  selectPaymentMethodError: z.string().optional(), // "Please select a payment method"

  // No checkout found / Error pages (checkout not found, expired, or generic error)
  noCheckoutFoundTitle: z.string().optional(),    // "No checkout found"
  noCheckoutFoundMessage: z.string().optional(),  // "It looks like you haven't started a checkout yet..."
  returnToCartButton: z.string().optional(),       // "Return to Cart"
  checkoutExpiredTitle: z.string().optional(),    // "Checkout expired or invalid"
  checkoutExpiredMessage: z.string().optional(),  // "This checkout session has expired..."
  somethingWentWrongTitle: z.string().optional(),  // "Something went wrong"
  somethingWentWrongMessage: z.string().optional(), // "We couldn't load your checkout..."

  // Address Form Actions
  deleteAddressButton: z.string().optional(),     // "Delete address"
  savingAddressText: z.string().optional(),       // "Savingâ€¦"
  savedText: z.string().optional(),               // "Saved"
  createAddressTitle: z.string().optional(),      // "Create address"
  editAddressTitle: z.string().optional(),        // "Edit address"
  addressSavedSuccess: z.string().optional(),     // "Address saved successfully!"
  addressUpdatedSuccess: z.string().optional(),   // "Address updated successfully!"
  cantShipToAddressText: z.string().optional(),   // "Can't ship to this address"

  // Sign In/Out
  signInTitle: z.string().optional(),             // "Sign in"
  signInButton: z.string().optional(),            // "Sign in"
  newCustomerText: z.string().optional(),         // "New customer?"
  guestCheckoutButton: z.string().optional(),     // "Guest checkout"
  forgotPasswordLink: z.string().optional(),      // "Forgot password?"
  resendLink: z.string().optional(),              // "Resend?"
  processingText: z.string().optional(),          // "Processingâ€¦"
  orText: z.string().optional(),                  // "or"
  continueWithGoogle: z.string().optional(),      // "Continue with Google"
  signInWithGoogle: z.string().optional(),        // "Sign in with Google"
  alreadyHaveAccount: z.string().optional(),      // "Already have an account?"

  // Guest User
  contactDetailsTitle: z.string().optional(),     // "Contact details"
  createAccountLabel: z.string().optional(),      // "I want to create account"
  passwordMinChars: z.string().optional(),        // "Password (minimum 8 characters)"

  // SSL/Security
  sslEncryptionText: z.string().optional(),       // "Secure 256-bit SSL encryption"

  // Footer links
  privacyPolicy: z.string().optional(),           // "Privacy Policy"
  termsOfService: z.string().optional(),          // "Terms of Service"
  securityNote: z.string().optional(),            // "Protected by SSL encryption â€¢ Your payment info is safe"
  // Legacy fields (for backward compatibility)
  privacyPolicyLinkText: z.string().optional(),
  termsOfServiceLinkText: z.string().optional(),
  sslEncryptionMessage: z.string().optional(),
});

// Filters/Sort/Product List Text
export const FiltersTextSchema = z.object({
  // Section titles
  sectionTitle: z.string(),           // "Filters"
  clearAllButton: z.string(),         // "Clear All Filters"
  showResultsButton: z.string(),      // "Show Results"
  filtersButtonText: z.string(),       // "Filters" (for category pages)

  // Filter headings
  categoryTitle: z.string(),          // "Category"
  collectionTitle: z.string(),        // "Collection"
  brandTitle: z.string(),             // "Brand"
  sizeTitle: z.string(),              // "Size"
  colorTitle: z.string(),             // "Color"
  priceTitle: z.string(),             // "Price"
  ratingTitle: z.string(),            // "Rating"
  availabilityTitle: z.string(),      // "Availability"

  // Sort dropdown
  sortByLabel: z.string(),            // "Sort by:" or "Sort by" (RTL-aware)
  searchForText: z.string(),          // "for" (text between count and search query)

  // Availability options
  inStockOnly: z.string(),            // "In Stock Only"
  onSale: z.string(),                 // "On Sale"

  // Active filters summary
  activeFiltersLabel: z.string(),     // "Active Filters:"
  categorySingular: z.string(),       // "category"
  categoryPlural: z.string(),         // "categories"
  collectionSingular: z.string(),     // "collection"
  collectionPlural: z.string(),       // "collections"
  brandSingular: z.string(),          // "brand"
  brandPlural: z.string(),            // "brands"
  colorSingular: z.string(),          // "color"
  colorPlural: z.string(),            // "colors"
  sizeSingular: z.string(),           // "size"
  sizePlural: z.string(),             // "sizes"

  // Sort options
  sortAtoZ: z.string(),               // "A to Z"
  sortZtoA: z.string(),               // "Z to A"
  sortPriceLowHigh: z.string(),       // "Price: Low to High"
  sortPriceHighLow: z.string(),       // "Price: High to Low"
  sortNewest: z.string(),             // "Newest"
  sortSale: z.string(),               // "Sale"

  // Empty/loading states
  noProductsTitle: z.string(),        // "No products found"
  noProductsWithFilters: z.string(),  // "Try adjusting your filters"
  noProductsEmpty: z.string(),        // "Check back later for new products"
  filteringProducts: z.string(),      // "Filtering products..."
  loadingMore: z.string(),            // "Loading more products..."
  seenAllProducts: z.string(),        // "You've seen all {count} products"
  tryAdjustingFilters: z.string(),    // "Try adjusting your filters to see more"

  // Search (products page search bar + nav search)
  searchPlaceholder: z.string(),      // "Search Products"
  searchClearAriaLabel: z.string().optional(),   // "Clear search" (aria-label for clear button)
  searchInputAriaLabel: z.string().optional(),   // "Search products" (aria-label for search input)
  searchProductsTitle: z.string(),    // "Search Products"
  searchResultsTitle: z.string(),    // "Search Results"
  resultsCountText: z.string(),       // "Found {count} result(s)" (template, RTL-aware)
  noResultsMessage: z.string(),        // "No results found for \"{query}\""

  // Results text
  resultsText: z.string(),            // "results"
  itemsAvailable: z.string(),         // "items available"
  productsPageTitle: z.string(),      // "All Products"
  discoverProducts: z.string(),       // "Discover Products" (for empty states)

  // Quick filters
  shopAllButton: z.string(),          // "Shop All"
  quickAddButton: z.string(),         // "Quick Add"
  scrollLeftAriaLabel: z.string(),    // "Scroll left"
  scrollRightAriaLabel: z.string(),   // "Scroll right"
  checkOutOurProducts: z.string(),    // "Check Out Our Products" - title above quick filters

  // Rating filter
  minimumRating: z.string(),          // "Minimum Rating"
  starsAndUp: z.string(),             // "{count} stars & up"
  starAndUp: z.string(),              // "1 star & up"
  clearRatingFilter: z.string(),      // "Clear"

  // Price filter
  minPriceLabel: z.string(),          // "Min Price"
  maxPriceLabel: z.string(),          // "Max Price"
  quickMinLabel: z.string(),          // "Quick Min"
  quickMaxLabel: z.string(),          // "Quick Max"
  clearPriceFilter: z.string(),       // "Clear"
  applyPriceFilter: z.string(),      // "Apply"
  priceUnderLabel: z.string(),       // "Under" (preset range prefix, e.g. "Under 50")
  priceAboveLabel: z.string(),       // "+" or "and above" (preset range suffix, e.g. "500+")
});

// Product Detail Page Text
export const ProductDetailTextSchema = z.object({
  // Trust badges
  freeShipping: z.string(),           // "Free Shipping"
  securePayment: z.string(),          // "Secure Payment"
  easyReturns: z.string(),            // "Easy Returns"

  // Tab labels
  descriptionTab: z.string(),         // "Description"
  shippingTab: z.string(),            // "Shipping"
  reviewsTab: z.string(),             // "Reviews"
  noDescriptionAvailable: z.string(), // "No description available for this product."

  // Product info
  qtyLabel: z.string(),               // "Qty"
  qtyLabelWithColon: z.string(),      // "Qty:"
  shareButton: z.string(),            // "Share"

  // Variant selection labels
  colorLabel: z.string(),             // "Color"
  sizeLabel: z.string(),              // "Size"
  selectOptionLabel: z.string(),      // "Select Option"
  pleaseSelectSize: z.string(),       // "Please select a size"
  pleaseSelectOption: z.string(),     // "Please select an option"

  // Stock messages
  onlyXLeft: z.string(),              // "Only {count} left!"
  inStockWithCount: z.string(),       // "In Stock ({count} available)"
  sellingFast: z.string(),            // "Selling fast!"
  savePercent: z.string(),            // "Save {percent}%"

  // Review pluralization
  reviewSingular: z.string(),         // "review"
  reviewPlural: z.string(),           // "reviews"

  // Image gallery labels
  zoomInLabel: z.string(),            // "Zoom in"
  zoomOutLabel: z.string(),           // "Zoom out"
  previousImageLabel: z.string(),     // "Previous image"
  nextImageLabel: z.string(),         // "Next image"

  // Reviews section
  noReviewsYet: z.string(),           // "No reviews yet. Be the first to review this product!"
  writeReviewTitle: z.string(),       // "Write a Review"

  // Review form
  ratingRequired: z.string(),         // "Rating *"
  reviewTitleRequired: z.string(),    // "Review Title *"
  reviewTitlePlaceholder: z.string(), // "Summarize your review"
  reviewRequired: z.string(),         // "Review *"
  reviewPlaceholder: z.string(),      // "Share your experience with this product..."
  characterCount: z.string(),         // "{count} / 2000 characters"
  imagesOptional: z.string(),         // "Images (Optional)"
  noFileChosen: z.string(),           // "No file chosen"
  uploadImagesHint: z.string(),       // "Upload up to 5 images (max 5MB each)"
  submitReviewButton: z.string(),     // "Submit Review"

  // Review display
  helpfulCount: z.string(),           // "{count} people found this helpful"
  helpfulButton: z.string(),          // "Helpful"
  helpfulButtonWithCount: z.string(), // "Helpful ({count})"
  verifiedPurchase: z.string(),       // "Verified Purchase"
  editReview: z.string(),             // "Edit"
  deleteReview: z.string(),           // "Delete"

  // Review filters
  allRatings: z.string(),             // "All Ratings"
  verifiedOnly: z.string(),           // "Verified Only"

  // Review delete modal
  deleteReviewTitle: z.string(),      // "Delete Review"
  deleteReviewMessage: z.string(),    // "Are you sure you want to delete this review? This action cannot be undone."
  cancelButton: z.string(),           // "Cancel"
  deletingButton: z.string(),         // "Deleting..."

  // Review time formatting
  justNow: z.string(),                // "just now"
  minutesAgo: z.string(),             // "{count} minutes ago"
  hoursAgo: z.string(),               // "{count} hours ago"
  daysAgo: z.string(),                // "{count} days ago"

  // Shipping information
  freeStandardShippingTitle: z.string(),      // "Free Standard Shipping"
  freeStandardShippingDescription: z.string(), // "On orders over $75. Delivery in 5-7 business days."
  expressShippingTitle: z.string(),           // "Express Shipping"
  expressShippingDescription: z.string(),     // "{price}. Delivery in 2-3 business days."

  // Review list and loading states
  loadingReviews: z.string(),                 // "Loading reviews..."
  reviewCountText: z.string(),                // "{count} review" or "{count} reviews" (handled by pluralization)
  noReviewsMatchFilters: z.string(),          // "No reviews match your filters."
  clearFilters: z.string(),                   // "Clear Filters"
  clearFiltersLowercase: z.string(),          // "Clear filters"
  tryAgain: z.string(),                       // "Try again"
  failedToLoadReviews: z.string(),            // "Failed to load reviews. Please try again."
  loadMoreReviews: z.string(),                // "Load More Reviews"
  starsLabel: z.string(),                     // "{count} Stars" or "{count} Star" (for filter dropdown)

  // Review form labels (for edit form)
  ratingLabel: z.string(),                    // "Rating"
  titleLabel: z.string(),                     // "Title"
  reviewLabel: z.string(),                    // "Review"

  // Review form states and messages
  uploadingImages: z.string(),                // "Uploading and compressing images..."
  savingButton: z.string(),                   // "Saving..."
  saveButton: z.string(),                     // "Save"
  submittingButton: z.string(),               // "Submitting..."
  thankYouMessage: z.string(),                // "Thank you for your review!"
  reviewSubmittedMessage: z.string(),         // "Your review has been submitted and will be visible after moderation."

  // Review form validation messages
  pleaseSelectRating: z.string(),             // "Please select a rating"
  pleaseEnterReviewTitle: z.string(),         // "Please enter a review title"
  pleaseEnterReviewBody: z.string(),          // "Please enter a review body"
  maxImagesError: z.string(),                 // "Maximum 5 images allowed per review"
  onlyXMoreImagesError: z.string(),           // "Only {count} more image(s) can be uploaded (max 5 total)"
  failedToSubmitReview: z.string(),           // "Failed to submit review"
  failedToSubmitReviewRetry: z.string(),      // "Failed to submit review. Please try again."
  mustBeLoggedInToReview: z.string(),         // "You must be logged in to submit a review. Please log in and try again."
  failedToUpdateReview: z.string(),           // "Failed to update review"
  failedToDeleteReview: z.string(),           // "Failed to delete review"
  failedToUploadImages: z.string(),           // "Failed to upload images"

  // Size guide
  sizeGuideButton: z.string().optional(),            // "Size Guide"
  sizeGuideTitle: z.string().optional(),             // "Size Guide"
  sizeGuideSubtitle: z.string().optional(),          // "Find your perfect fit"
  sizeGuideMensTab: z.string().optional(),           // "Men's"
  sizeGuideWomensTab: z.string().optional(),         // "Women's"
  sizeGuideKidsTab: z.string().optional(),           // "Kids'"
  sizeGuideHowToMeasure: z.string().optional(),      // "How to Measure"
  sizeGuideMeasureTip: z.string().optional(),        // "Stand on a piece of paper..."
  sizeGuideProTip: z.string().optional(),            // "Pro Tip: Measure your feet in the evening..."
  sizeGuideShoesCategory: z.string().optional(),    // "Shoes"
  sizeGuideClothingCategory: z.string().optional(), // "Clothing"
  sizeGuideClothingMeasureTip: z.string().optional(), // "Use a soft tape measure..."
  sizeGuideClothingProTip: z.string().optional(),     // "Pro Tip: If you're between sizes..."

  // Specifications & Attributes
  specificationsTab: z.string().optional(),           // "Specifications"
  noSpecifications: z.string().optional(),            // "No specifications available."
  selectAttributeLabel: z.string().optional(),        // "Select {attribute}"
  pleaseSelectAttribute: z.string().optional(),       // "Please select {attribute}"

  // Enhanced stock messages
  unlimitedStock: z.string().optional(),              // "In Stock"
  selectOptionsForStock: z.string().optional(),       // "Select options to see availability"
  maxPerCustomer: z.string().optional(),              // "Limit {count} per customer"
  unavailableForSelection: z.string().optional(),     // "Unavailable for current selection"

  // Related products section (on product detail page)
  relatedProductsTitle: z.string().optional(),       // "You May Also Like"
  relatedProductsSubtitle: z.string().optional(),    // "Customers also viewed these products"
  relatedViewDetailsButton: z.string().optional(),   // "View details"
  relatedPreviousLabel: z.string().optional(),       // "Previous products"
  relatedNextLabel: z.string().optional(),           // "Next products"

  // Stock Alert / Notify Me
  notifyMeButton: z.string().optional(),             // "Notify me when back in stock"
  notifyMeTitle: z.string().optional(),              // "Notify me when back in stock"
  notifyMeDescription: z.string().optional(),        // "Get notified when {variant} is available"
  notifyMeDescriptionGeneric: z.string().optional(), // "Get notified when this item is available"
  notifyMeEmailPlaceholder: z.string().optional(),   // "Enter your email"
  notifyMeSubmitButton: z.string().optional(),       // "Notify Me"
  notifyMeSubmitting: z.string().optional(),         // "Subscribing..."
  notifyMeSuccess: z.string().optional(),            // "You'll be notified when this item is back in stock"
  notifyMeAlreadySubscribed: z.string().optional(),  // "You're already subscribed for this item"
  notifyMeUnsubscribe: z.string().optional(),        // "Unsubscribe"
  notifyMeInvalidEmail: z.string().optional(),       // "Please enter a valid email address"
  notifyMeError: z.string().optional(),              // "Failed to subscribe. Please try again."
  notifyMeCancel: z.string().optional(),             // "Cancel"
});

// Account Dashboard Text
export const AccountDashboardTextSchema = z.object({
  totalOrders: z.string(),            // "Total Orders"
  wishlistItems: z.string(),          // "Wishlist Items"
  savedAddresses: z.string(),         // "Saved Addresses"
  memberSince: z.string(),            // "Member Since"
  welcomeBack: z.string(),            // "Welcome back, {name}"
  welcomeBackMessage: z.string(),     // "Here's what's happening with your account today."
  accountSummary: z.string(),         // "here's what's happening with your account today"
  recentOrders: z.string(),           // "Recent Orders"
  viewAllButton: z.string(),           // "View All â†’"
  viewButton: z.string(),             // "View"
  orderLabel: z.string(),             // "Order"
  orderNumberPrefix: z.string(),      // "Order #"
  noOrdersYet: z.string(),            // "No orders yet"
  whenYouPlaceOrder: z.string(),      // "When you place an order, it will appear here."
  noRecentOrders: z.string(),         // "No recent orders"
  startShopping: z.string(),          // "Start Shopping"
});

// Order Tracking Text (for non-logged-in users)
export const OrderTrackingTextSchema = z.object({
  title: z.string(),                           // "Track Your Order"
  description: z.string(),                     // "Enter your order number and email address..."
  orderNumberLabel: z.string(),                // "Order Number"
  orderNumberPlaceholder: z.string(),          // "e.g., 12345"
  orderNumberHelp: z.string(),                 // "You can find your order number in your confirmation email."
  emailLabel: z.string(),                      // "Email Address"
  emailPlaceholder: z.string(),                // "your@email.com"
  emailHelp: z.string(),                       // "The email address you used when placing the order."
  trackButton: z.string(),                     // "Track Order"
  trackingButton: z.string(),                  // "Tracking..."
  errorNotFound: z.string(),                   // "Order not found. Please check your order number and email address."
  errorGeneric: z.string(),                    // "An error occurred while tracking your order. Please try again."
  backToTracking: z.string(),                  // "Track Another Order"
  orderFoundTitle: z.string(),                 // "Order Details"
  createAccountTitle: z.string(),              // "Create an Account"
  createAccountDescription: z.string(),        // "Sign up to track all your orders, save your addresses, and enjoy faster checkout."
  createAccountButton: z.string(),             // "Create Account"
  needHelpText: z.string(),                    // "Need help?"
  contactSupportLink: z.string(),              // "Contact Support"
});

// FAQ Item Schema
export const FAQItemSchema = z.object({
  question: z.string(),                       // "What are your shipping times?"
  answer: z.string(),                          // "Most orders ship within 24 hours..."
});

// Contact Page Text
export const ContactTextSchema = z.object({
  heroTitle: z.string(),                       // "Get in Touch"
  heroDescription: z.string(),                 // "Have a question or need help? We're here for you. Reach out through any of the channels below or fill out the contact form."
  // Contact method labels
  emailLabel: z.string(),                      // "Email"
  phoneLabel: z.string(),                      // "Phone"
  addressLabel: z.string(),                    // "Address"
  // Contact form
  formTitle: z.string(),                       // "Send Us a Message"
  formDescription: z.string(),                 // "We'll get back to you within 24 hours."
  nameLabel: z.string(),                       // "Your Name"
  namePlaceholder: z.string(),                 // "John Doe"
  emailLabelForm: z.string(),                  // "Email Address" (for form field)
  emailPlaceholder: z.string(),                // "john@example.com"
  subjectLabel: z.string(),                    // "Subject"
  subjectPlaceholder: z.string(),              // "How can we help?"
  messageLabel: z.string(),                    // "Message"
  messagePlaceholder: z.string(),              // "Tell us more about your inquiry..."
  sendButton: z.string(),                      // "Send Message"
  sendingButton: z.string(),                   // "Sending..."
  successTitle: z.string(),                    // "Message Sent!"
  successDescription: z.string(),              // "Thank you for reaching out. We'll be in touch soon."
  sendAnotherMessage: z.string(),              // "Send another message"
  // FAQs
  faqsTitle: z.string(),                       // "Frequently Asked Questions"
  faqsDescription: z.string(),                 // "Find quick answers to common questions."
  faqs: z.array(FAQItemSchema).optional(),     // Array of FAQ items
  viewAllFaqs: z.string(),                     // "View All FAQs"
  // Social section
  followUsTitle: z.string(),                   // "Follow Us"
  followUsDescription: z.string(),             // "Stay connected for updates, tips, and exclusive offers."
});

// Orders Page Text
export const OrdersTextSchema = z.object({
  myOrdersTitle: z.string(),           // "My Orders"
  ordersPlacedCount: z.string(),       // "{count} order(s) placed"
  orderNumber: z.string(),            // "Order Number"
  orderLabel: z.string(),             // "Order"
  orderNumberPrefix: z.string(),      // "Order #"
  datePlaced: z.string(),             // "Date Placed"
  totalLabel: z.string(),             // "TOTAL"
  getInvoice: z.string(),             // "Get Invoice"
  downloadInvoice: z.string(),        // "Download Invoice"
  viewDetails: z.string(),            // "View Details"
  trackPackage: z.string(),           // "Track Package"
  buyAgain: z.string(),              // "Buy Again"
  showAllOrders: z.string(),          // "Show All Orders ({count})"
  showLess: z.string(),               // "Show Less"
  ordersPlaced: z.string(),           // "Orders Placed"
  noOrders: z.string(),               // "No orders yet"
  noOrdersMessage: z.string(),        // "When you place an order, it will appear here"
  noOrdersYetMessage: z.string(),     // "Looks like you haven't placed any orders yet. Start shopping to see your orders here!"
  orderStatus: z.string(),            // "Status"
  trackOrder: z.string(),             // "Track Order"
  qtyLabel: z.string(),               // "Qty:"
  remainingItems: z.string(),         // "+{count}"
  generatingInvoice: z.string(),      // "Generating Invoice..."
  generateDownloadInvoice: z.string(), // "Generate & Download Invoice"
  invoiceAvailable: z.string(),       // "Invoice Available"
  invoiceAvailableMessage: z.string(), // "Click below to generate and download your invoice as a PDF."
  invoicePending: z.string(),          // "Invoice Pending"
  invoicePendingMessage: z.string(),   // "Invoices are generated once payment is completed..."
  invoiceWillBeGenerated: z.string(),  // "Your invoice will be generated instantly and downloaded as a PDF."
  needInvoiceSooner: z.string(),       // "Need your invoice sooner? Please contact our support team."
  close: z.string(),                   // "Close"
  invoiceModalTitle: z.string(),       // "Invoice"
  trackingModalTitle: z.string(),      // "Track Package"
  trackingNumberLabel: z.string(),     // "Tracking Number"
  statusLabel: z.string(),             // "Status:"
  trackPackageDescription: z.string(), // "Track your package using any of the services below:"
  universalTrackers: z.string(),       // "Universal Trackers (Recommended)"
  directCarrierLinks: z.string(),      // "Direct Carrier Links"
  loading: z.string(),                 // "Loading..."
  // Order Details Page
  backToOrders: z.string(),            // "Back to Orders"
  placedOn: z.string(),                // "Placed on"
  orderItemsTitle: z.string(),         // "Order Items ({count})"
  viewProduct: z.string(),             // "View Product"
  orderSummaryTitle: z.string(),       // "Order Summary"
  subtotalLabel: z.string(),           // "Subtotal"
  shippingLabel: z.string(),           // "Shipping"
  shippingFree: z.string(),            // "Free"
  totalLabelDetails: z.string(),       // "Total"
  shippingAddressTitle: z.string(),    // "Shipping Address"
  billingAddressTitle: z.string(),     // "Billing Address"
  shipmentTrackingTitle: z.string(),   // "Shipment Tracking"
  statusLabelDetails: z.string(),      // "Status"
  trackingNumberLabelDetails: z.string(), // "Tracking #"
  invoiceTitle: z.string(),            // "Invoice"
  invoiceNumberPrefix: z.string(),     // "Invoice #"
  downloadButton: z.string(),          // "Download"
  generatingText: z.string(),          // "Generating..."
  unavailableText: z.string(),         // "Unavailable"
  quickActionsTitle: z.string(),       // "Quick Actions"
  needHelpTitle: z.string(),           // "Need Help?"
  contactSupportButton: z.string(),    // "Contact Support"
  viewFaqsButton: z.string(),          // "View FAQs"
  // Order Status Labels
  statusProcessing: z.string(),        // "Processing"
  statusPartiallyShipped: z.string(),  // "Partially Shipped"
  statusShipped: z.string(),           // "Shipped"
  statusDelivered: z.string(),         // "Delivered"
  statusCanceled: z.string(),          // "Canceled"
  statusReturned: z.string(),          // "Returned"
  // Payment Status Labels
  paymentPending: z.string(),          // "Pending"
  paymentPartiallyPaid: z.string(),    // "Partially Paid"
  paymentPaid: z.string(),             // "Paid"
  paymentPartiallyRefunded: z.string(), // "Partially Refunded"
  paymentRefunded: z.string(),         // "Refunded"
  paymentFailed: z.string(),           // "Payment Failed"
  paymentCancelled: z.string(),        // "Cancelled"
  // Reorder Button
  reorderItems: z.string(),            // "Reorder Items ({count})"
  addingToCart: z.string(),            // "Adding to Cart..."
  itemsAddedToCart: z.string(),        // "{count} item(s) added to cart!"
  redirectingToCart: z.string(),       // "Redirecting to cart..."
  tryAgain: z.string(),                // "Try Again"
});

// Addresses Page Text
export const AddressesTextSchema = z.object({
  myAddresses: z.string(),            // "My Addresses"
  addressesCount: z.string(),         // "{count} address(es) saved"
  noAddressesYet: z.string(),         // "No addresses saved yet"
  addAddressButton: z.string(),       // "Add Address"
  defaultShipping: z.string(),        // "Default Shipping"
  defaultBilling: z.string(),         // "Default Billing"
  shippingAndBilling: z.string(),     // "Shipping & Billing"
  shippingAddress: z.string(),        // "Shipping Address"
  billingAddress: z.string(),        // "Billing Address"
  savedAddress: z.string(),           // "Saved Address"
  setAsDefault: z.string(),           // "Set as Default"
  noAddresses: z.string(),            // "No addresses saved"
  noAddressesMessage: z.string(),     // "Add your first address to speed up checkout"
  noAddressesCheckoutMessage: z.string(), // "Your shipping and billing addresses will be saved here when you complete checkout."
  // Form and actions
  addNewAddressTitle: z.string(),    // "Add New Address"
  addAddressDescription: z.string(), // "Adding new addresses requires going through checkout. Your addresses will be saved automatically when you complete a purchase."
  editButton: z.string(),             // "Edit"
  deleteButton: z.string(),          // "Delete"
  continueShoppingButton: z.string(), // "Continue Shopping" (in addresses context)
  startShopping: z.string(),         // "Start Shopping"
  cancel: z.string(),                 // "Cancel"
});

// Wishlist Page Text
export const WishlistTextSchema = z.object({
  myWishlistTitle: z.string(),         // "My Wishlist"
  itemsCount: z.string(),              // "{count} item(s) saved"
  loadingWishlist: z.string(),        // "Loading wishlist..."
  emptyWishlistTitle: z.string(),     // "Your wishlist is empty"
  emptyWishlistMessage: z.string(),   // "Save items you love by clicking the heart icon on any product."
  discoverProductsButton: z.string(), // "Discover Products"
  clearAllButton: z.string(),         // "Clear All"
  itemsSaved: z.string(),             // "{count} item(s) saved"
  viewProduct: z.string(),            // "View Product"
  viewDetails: z.string(),            // "View Details" (when out of stock)
  outOfStock: z.string(),             // "Out of Stock"
  addedOn: z.string(),                // "Added {date}"
  removeFromWishlist: z.string(),     // "Remove"
  moveToCart: z.string(),             // "Add to Cart"
  removeFromWishlistTooltip: z.string(), // "Remove from wishlist"
});

// Settings Page Text
export const SettingsTextSchema = z.object({
  // Page header
  accountSettings: z.string(),         // "Account Settings"
  settingsSubtitle: z.string(),        // "Manage your profile, security, and notification preferences"

  // Profile section
  profileInformation: z.string(),      // "Profile Information"
  updatePersonalDetails: z.string(),   // "Update your personal details"
  saveChangesButton: z.string(),       // "Save Changes"
  savingChanges: z.string(),           // "Saving..."
  changesSaved: z.string(),            // "Changes saved successfully"
  profileUpdated: z.string(),          // "Profile updated successfully"
  profileUpdateFailed: z.string(),     // "Failed to update profile. Please try again."
  emailChangePasswordRequired: z.string(), // "Password is required to change your email..."
  emailChangeConfirmationSent: z.string(), // "A confirmation link has been sent to your new email..."
  emailChangePasswordInvalid: z.string(), // "Password is not valid. Please enter your current account password."
  profileInvalidEmailError: z.string(),   // "Please enter a valid email address. Check the domain and extension..."

  // Password section
  changePassword: z.string(),          // "Change Password"
  passwordSecurityNote: z.string(),    // "Update your password to keep your account secure"
  currentPassword: z.string(),         // "Current Password"
  newPasswordLabel: z.string(),        // "New Password"
  confirmNewPassword: z.string(),      // "Confirm New Password"
  updatePasswordButton: z.string(),    // "Update Password"
  passwordUpdated: z.string(),         // "Password updated successfully"
  passwordUpdateFailed: z.string(),   // "Failed to update password. Please try again."

  // Notifications section
  notificationPreferences: z.string(), // "Notification Preferences"
  notificationSubtitle: z.string(),    // "Choose how you want to receive updates"
  orderUpdates: z.string(),            // "Order Updates"
  orderUpdatesDesc: z.string(),        // "Receive notifications about your order status"
  promotionsOffers: z.string(),        // "Promotions & Offers"
  promotionsDesc: z.string(),          // "Get notified about sales and exclusive deals"
  newsletterSetting: z.string(),       // "Newsletter"
  newsletterDesc: z.string(),          // "Weekly updates about new arrivals and trends"
  smsNotifications: z.string(),        // "SMS Notifications"
  smsDesc: z.string(),                 // "Receive text messages for important updates"

  // Danger zone
  dangerZone: z.string(),              // "Danger Zone"
  deleteAccountWarning: z.string(),    // "Permanently delete your account and all associated data"
  deleteAccountButton: z.string(),     // "Delete Account"
  confirmDeleteTitle: z.string(),      // "Delete Account?"
  confirmDeleteMessage: z.string(),    // "This action cannot be undone. All your data will be permanently removed."
});

// Footer Text (including legal links)
export const FooterTextSchema = z.object({
  // Legal links
  privacyPolicyLink: z.string(),       // "Privacy Policy"
  termsOfServiceLink: z.string(),      // "Terms of Service"
  shippingLink: z.string(),            // "Shipping"
  returnPolicyLink: z.string(),        // "Return Policy"

  // Other footer text
  allRightsReserved: z.string(),       // "All rights reserved"
  madeWith: z.string(),                // "Made with"
  inLocation: z.string(),              // "in {location}"

  // Contact section
  contactUs: z.string(),               // "Contact Us"
  contactUsButton: z.string().default("Contact Us"),        // "Contact Us" (button text)
  customerService: z.string(),         // "Customer Service"

  // Navigation sections
  shopTitle: z.string(),               // "Shop"
  companyTitle: z.string(),            // "Company"
  supportTitle: z.string(),            // "Support"
  followUsTitle: z.string(),           // "Follow Us"
  trackOrderLink: z.string().optional(), // "Track Order" (optional for backward compatibility)
});

// Navbar Text
export const NavbarTextSchema = z.object({
  selectChannel: z.string(),           // "Select channel/currency"
  searchPlaceholder: z.string(),       // "Search..." (navbar search input placeholder)
  searchClearAriaLabel: z.string().optional(),   // "Clear search" (aria-label for clear button)
  searchInputAriaLabel: z.string().optional(),   // "Search products" (aria-label for search input)
  viewAllResultsFor: z.string().optional(),     // "View all results for" (navbar search dropdown)
  recentlySearchedLabel: z.string().optional(), // "Recent Searches" (navbar search dropdown)
  recentSearchesClearLabel: z.string().optional(), // "Clear" (button next to Recent Searches)
  cartLabel: z.string(),               // "Cart"
  accountLabel: z.string(),            // "Account"
  menuLabel: z.string(),               // "Menu"
  signInText: z.string(),              // "Sign In" (for navbar login link)
  shopAllButton: z.string().optional(),           // "Shop All" (for main navigation dropdown)
  saleButton: z.string().optional(),              // "Sale" (for sale navigation button)
  collectionsLabel: z.string().optional(),        // "Collections" (for dropdown section)
  brandsLabel: z.string().optional(),             // "Brands" (for dropdown section)
  categoriesLabel: z.string().optional(),         // "Categories" (for dropdown section)
  viewAllProducts: z.string().optional(),         // "View All Products" (for dropdown footer)
  exploreCategoryLabel: z.string().optional(),    // "Explore" (mega menu right panel CTA prefix: "Explore {Category}")
  browseSubcategoriesLabel: z.string().optional(), // "Browse subcategories" (mega menu center panel subtitle)
  megaMenuProductLabel: z.string().optional(),     // "product" (singular product count in mega menu)
  megaMenuProductsLabel: z.string().optional(),    // "products" (plural product count in mega menu)
  megaMenuHoverPrompt: z.string().optional(),      // "Hover a category to explore" (mega menu center panel empty state)
  subcategoriesSide: z.enum(["auto", "left", "right"]).default("auto"), // Subcategories dropdown side: "auto" (based on RTL), "left", or "right"
  /** Mobile menu drawer position on screen: "left" or "right" */
  mobileNavPosition: z.enum(["left", "right"]).default("right"),
  /** Dropdown/accordion arrow direction when collapsed: "up", "down", "left", "right", or "auto" (follow locale) */
  dropdownArrowDirection: z.enum(["up", "down", "left", "right", "auto"]).default("auto"),
  /** Dropdown/accordion arrow direction when expanded (open): "up", "down", "left", "right", or "auto" (auto = down) */
  dropdownArrowDirectionExpanded: z.enum(["up", "down", "left", "right", "auto"]).default("down"),
  // Mobile navigation
  homeLabel: z.string(),                // "Home"
  shopLabel: z.string(),                // "Shop"
});

// Error Page Text
export const ErrorTextSchema = z.object({
  title: z.string(),                              // "Something went wrong"
  description: z.string(),                        // "We're sorry, but something unexpected happened. Please try again or contact support if the problem persists."
  errorDetails: z.string(),                        // "Error details"
  tryAgainButton: z.string(),                     // "Try Again"
  backToHomeButton: z.string(),                   // "Back to Home"
  needHelpText: z.string(),                       // "Need help?"
  contactSupportLink: z.string(),                 // "Contact our support team"
  contactSupportUrl: z.string().optional(),       // "/contact" — URL the "contact support" link navigates to
  errorCode: z.string().optional(),               // "Error" — label shown above the title
});

// 404 Not Found Page Text
export const NotFoundTextSchema = z.object({
  title: z.string(),                              // "Page Not Found"
  description: z.string(),                        // "Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist."
  backToHomeButton: z.string(),                   // "Back to Home"
  browseProductsButton: z.string(),               // "Browse Products"
  helpfulLinksText: z.string(),                   // "Or check out these pages:"
  // Configurable helpful link labels (optional for backward compat)
  categoriesLinkText: z.string().optional(),      // "Categories"
  collectionsLinkText: z.string().optional(),     // "Collections"
  aboutUsLinkText: z.string().optional(),         // "About Us"
  contactLinkText: z.string().optional(),         // "Contact"
  // Product-specific 404 text
  productNotFoundTitle: z.string().optional(),    // "Product Not Found"
  productNotFoundDescription: z.string().optional(), // "The product you're looking for doesn't exist or has been removed."
  productNotFoundBackButton: z.string().optional(), // "Back to Products"
});

export const ContentSchema = z.object({
  cart: CartTextSchema,
  product: ProductTextSchema,
  account: AccountTextSchema,
  general: GeneralTextSchema,
  homepage: HomepageTextSchema,
  checkout: CheckoutTextSchema,
  filters: FiltersTextSchema,
  productDetail: ProductDetailTextSchema,
  dashboard: AccountDashboardTextSchema,
  orders: OrdersTextSchema,
  orderTracking: OrderTrackingTextSchema.optional(), // Optional for backward compatibility
  contact: ContactTextSchema.optional(), // Optional for backward compatibility
  addresses: AddressesTextSchema,
  wishlist: WishlistTextSchema,
  settings: SettingsTextSchema,
  footer: FooterTextSchema,
  navbar: NavbarTextSchema,
  error: ErrorTextSchema,
  notFound: NotFoundTextSchema,
});
