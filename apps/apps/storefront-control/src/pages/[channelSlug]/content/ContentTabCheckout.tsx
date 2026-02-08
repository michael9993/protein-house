import { Box, Text } from "@saleor/macaw-ui";
import { SectionCard } from "@/modules/ui/section-card";
import { FormField } from "@/modules/ui/form-field";
import type { ContentTabProps } from "./types";

export function ContentTabCheckout({ register, errors, control }: ContentTabProps) {
  return (
    <>
      <SectionCard
        id="content-checkout"
        title="Checkout"
        description="Text for all checkout phases: contact, shipping, billing, delivery, payment, and order summary"
        keywords={["checkout", "order", "payment", "shipping", "billing", "delivery"]}
        icon="🛒"
      >
        {/* Page Header & Breadcrumbs */}
        <Box marginBottom={6}>
          <Text marginBottom={2}>Page Header & Progress</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Checkout Title"
              name="checkout.checkoutTitle"
              register={register}
              errors={errors}
              placeholder="Checkout"
              description="Page title shown in browser tab"
            />
            <FormField
              label="Secure Checkout Badge"
              name="checkout.secureCheckout"
              register={register}
              errors={errors}
              placeholder="Secure Checkout"
              description="Text shown next to lock icon in header"
            />
            <FormField
              label="Shipping Step"
              name="checkout.shippingStep"
              register={register}
              errors={errors}
              placeholder="Shipping"
            />
            <FormField
              label="Payment Step"
              name="checkout.paymentStep"
              register={register}
              errors={errors}
              placeholder="Payment"
            />
            <FormField
              label="Confirmation Step"
              name="checkout.confirmationStep"
              register={register}
              errors={errors}
              placeholder="Confirmation"
            />
          </Box>
        </Box>

        {/* No checkout found / Error pages */}
        <Box marginBottom={6}>
          <Text marginBottom={2}>No Checkout Found & Error Pages</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="No Checkout Found Title"
              name="checkout.noCheckoutFoundTitle"
              register={register}
              errors={errors}
              placeholder="No checkout found"
            />
            <FormField
              label="No Checkout Found Message"
              name="checkout.noCheckoutFoundMessage"
              register={register}
              errors={errors}
              placeholder="It looks like you haven't started a checkout yet. Add some items to your cart first."
            />
            <FormField
              label="Return to Cart Button"
              name="checkout.returnToCartButton"
              register={register}
              errors={errors}
              placeholder="Return to Cart"
            />
            <FormField
              label="Continue Shopping Button (error page)"
              name="checkout.continueShoppingButton"
              register={register}
              errors={errors}
              placeholder="Continue Shopping"
            />
            <FormField
              label="Checkout Expired Title"
              name="checkout.checkoutExpiredTitle"
              register={register}
              errors={errors}
              placeholder="Checkout expired or invalid"
            />
            <FormField
              label="Checkout Expired Message"
              name="checkout.checkoutExpiredMessage"
              register={register}
              errors={errors}
              placeholder="This checkout session has expired or is no longer valid. Please return to your cart and try again."
            />
            <FormField
              label="Something Went Wrong Title"
              name="checkout.somethingWentWrongTitle"
              register={register}
              errors={errors}
              placeholder="Something went wrong"
            />
            <FormField
              label="Something Went Wrong Message"
              name="checkout.somethingWentWrongMessage"
              register={register}
              errors={errors}
              placeholder="We couldn't load your checkout. Please return to your cart and try again."
            />
          </Box>
        </Box>

        {/* Contact Information Section */}
        <Box marginBottom={6}>
          <Text marginBottom={2}>1. Contact Information</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Section Title"
              name="checkout.contactInfoTitle"
              register={register}
              errors={errors}
              placeholder="Contact Information"
            />
            <FormField
              label="Section Subtitle"
              name="checkout.contactInfoSubtitle"
              register={register}
              errors={errors}
              placeholder="We'll use this to send order updates"
            />
            <FormField
              label="Account Label"
              name="checkout.accountLabel"
              register={register}
              errors={errors}
              placeholder="Account"
            />
            <FormField
              label="Sign Out Button"
              name="checkout.signOutButton"
              register={register}
              errors={errors}
              placeholder="Sign out"
            />
            <FormField
              label="Guest Email Label"
              name="checkout.guestEmailLabel"
              register={register}
              errors={errors}
              placeholder="Email"
            />
            <FormField
              label="Guest Email Placeholder"
              name="checkout.guestEmailPlaceholder"
              register={register}
              errors={errors}
              placeholder="Enter your email"
            />
            <FormField
              label="Create Account Checkbox"
              name="checkout.createAccountCheckbox"
              register={register}
              errors={errors}
              placeholder="Create account for faster checkout"
            />
            <FormField
              label="Password Label"
              name="checkout.passwordLabel"
              register={register}
              errors={errors}
              placeholder="Password"
            />
          </Box>
        </Box>

        {/* Shipping Address Section */}
        <Box marginBottom={6}>
          <Text marginBottom={2}>2. Shipping Address</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Section Title"
              name="checkout.shippingAddressTitle"
              register={register}
              errors={errors}
              placeholder="Shipping Address"
            />
            <FormField
              label="Section Subtitle"
              name="checkout.shippingAddressSubtitle"
              register={register}
              errors={errors}
              placeholder="Where should we deliver?"
            />
            <FormField
              label="Add Address Button"
              name="checkout.addAddressButton"
              register={register}
              errors={errors}
              placeholder="Add address"
            />
            <FormField
              label="Edit Button"
              name="checkout.editAddressButton"
              register={register}
              errors={errors}
              placeholder="Edit"
            />
            <FormField
              label="Change Button"
              name="checkout.changeAddressButton"
              register={register}
              errors={errors}
              placeholder="Change"
            />
            <FormField
              label="Create Address Title"
              name="checkout.createAddressTitle"
              register={register}
              errors={errors}
              placeholder="Create address"
            />
            <FormField
              label="Edit Address Title"
              name="checkout.editAddressTitle"
              register={register}
              errors={errors}
              placeholder="Edit address"
            />
          </Box>
        </Box>

        {/* Address Form Fields */}
        <Box marginBottom={6}>
          <Text marginBottom={2}>Address Form Labels</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="First Name"
              name="checkout.firstNameLabel"
              register={register}
              errors={errors}
              placeholder="First name"
            />
            <FormField
              label="Last Name"
              name="checkout.lastNameLabel"
              register={register}
              errors={errors}
              placeholder="Last name"
            />
            <FormField
              label="Company"
              name="checkout.companyLabel"
              register={register}
              errors={errors}
              placeholder="Company (optional)"
            />
            <FormField
              label="Address Line 1"
              name="checkout.addressLine1Label"
              register={register}
              errors={errors}
              placeholder="Address"
            />
            <FormField
              label="Address Line 2"
              name="checkout.addressLine2Label"
              register={register}
              errors={errors}
              placeholder="Apartment, suite, etc. (optional)"
            />
            <FormField
              label="City"
              name="checkout.cityLabel"
              register={register}
              errors={errors}
              placeholder="City"
            />
            <FormField
              label="Country"
              name="checkout.countryLabel"
              register={register}
              errors={errors}
              placeholder="Country"
            />
            <FormField
              label="State/Province"
              name="checkout.stateLabel"
              register={register}
              errors={errors}
              placeholder="State/Province"
            />
            <FormField
              label="Postal Code"
              name="checkout.postalCodeLabel"
              register={register}
              errors={errors}
              placeholder="Postal code"
            />
            <FormField
              label="Phone"
              name="checkout.phoneLabel"
              register={register}
              errors={errors}
              placeholder="Phone"
            />
            <FormField
              label="Save Address Button"
              name="checkout.saveAddressButton"
              register={register}
              errors={errors}
              placeholder="Save address"
            />
            <FormField
              label="Cancel Button"
              name="checkout.cancelButton"
              register={register}
              errors={errors}
              placeholder="Cancel"
            />
          </Box>
        </Box>

        {/* Billing Address Section */}
        <Box marginBottom={6}>
          <Text marginBottom={2}>3. Billing Address</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Section Title"
              name="checkout.billingAddressTitle"
              register={register}
              errors={errors}
              placeholder="Billing Address"
            />
            <FormField
              label="Section Subtitle"
              name="checkout.billingAddressSubtitle"
              register={register}
              errors={errors}
              placeholder="For your invoice"
            />
            <FormField
              label="Use Same as Shipping"
              name="checkout.useSameAsShipping"
              register={register}
              errors={errors}
              placeholder="Use shipping address as billing address"
            />
          </Box>
        </Box>

        {/* Delivery Methods Section */}
        <Box marginBottom={6}>
          <Text marginBottom={2}>4. Delivery Methods</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Section Title"
              name="checkout.deliveryMethodsTitle"
              register={register}
              errors={errors}
              placeholder="Delivery methods"
            />
            <FormField
              label="Business Days Text"
              name="checkout.businessDaysText"
              register={register}
              errors={errors}
              placeholder="{min}-{max} business days"
              description="Use {min} and {max} as placeholders"
            />
            <FormField
              label="Free Shipping Label"
              name="checkout.freeShippingLabel"
              register={register}
              errors={errors}
              placeholder="Free"
            />
            <FormField
              label="No Methods Available"
              name="checkout.noDeliveryMethodsText"
              register={register}
              errors={errors}
              placeholder="No delivery methods available"
            />
            <FormField
              label="Free Shipping Voucher Not Applicable"
              name="checkout.freeShippingVoucherNotApplicable"
              register={register}
              errors={errors}
              placeholder="Free shipping voucher is not applicable with this delivery method. Choose a free shipping method to use your voucher."
            />
            <FormField
              label="Free Shipping Applied With Method"
              name="checkout.freeShippingAppliedWithMethod"
              register={register}
              errors={errors}
              placeholder="Free shipping applied with this method."
            />
          </Box>
        </Box>

        {/* Payment Section */}
        <Box marginBottom={6}>
          <Text marginBottom={2}>5. Payment</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Section Title"
              name="checkout.paymentTitle"
              register={register}
              errors={errors}
              placeholder="Payment"
            />
            <FormField
              label="Section Subtitle"
              name="checkout.paymentSubtitle"
              register={register}
              errors={errors}
              placeholder="Select your payment method"
            />
            <FormField
              label="Payment Method Label"
              name="checkout.paymentMethodLabel"
              register={register}
              errors={errors}
              placeholder="Payment method"
            />
            <FormField
              label="Pay Now Button"
              name="checkout.payNowButton"
              register={register}
              errors={errors}
              placeholder="Pay now"
            />
            <FormField
              label="Initializing Payment Text"
              name="checkout.initializingPaymentText"
              register={register}
              errors={errors}
              placeholder="Initializing payment system..."
            />
          </Box>
        </Box>

        {/* Payment Error Messages */}
        <Box marginBottom={6}>
          <Text marginBottom={2}>Payment Error Messages</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Payment System Unavailable"
              name="checkout.paymentSystemUnavailableError"
              register={register}
              errors={errors}
              placeholder="Payment system is not available..."
            />
            <FormField
              label="Checkout Info Missing"
              name="checkout.checkoutInfoMissingError"
              register={register}
              errors={errors}
              placeholder="Checkout information is missing..."
            />
            <FormField
              label="Payment Form Not Ready"
              name="checkout.paymentFormNotReadyError"
              register={register}
              errors={errors}
              placeholder="Payment form is not ready..."
            />
            <FormField
              label="Payment Validation Failed"
              name="checkout.paymentValidationFailedError"
              register={register}
              errors={errors}
              placeholder="Payment validation failed"
            />
            <FormField
              label="Transaction Creation Failed"
              name="checkout.transactionCreationFailedError"
              register={register}
              errors={errors}
              placeholder="Transaction could not be created..."
            />
            <FormField
              label="Invalid Payment Data"
              name="checkout.invalidPaymentDataError"
              register={register}
              errors={errors}
              placeholder="Invalid payment data received..."
            />
            <FormField
              label="Payment Init Incomplete"
              name="checkout.paymentInitIncompleteError"
              register={register}
              errors={errors}
              placeholder="Payment initialization incomplete..."
            />
            <FormField
              label="Payment Confirmation Failed"
              name="checkout.paymentConfirmationFailedError"
              register={register}
              errors={errors}
              placeholder="Payment confirmation failed..."
            />
            <FormField
              label="Payment Failed"
              name="checkout.paymentFailedError"
              register={register}
              errors={errors}
              placeholder="Payment failed"
            />
            <FormField
              label="Unexpected Payment Error"
              name="checkout.unexpectedPaymentError"
              register={register}
              errors={errors}
              placeholder="An unexpected error occurred..."
            />
            <FormField
              label="Payment Success Order Failed"
              name="checkout.paymentSuccessOrderFailedError"
              register={register}
              errors={errors}
              placeholder="Payment was successful but order processing failed..."
            />
          </Box>
        </Box>

        {/* Order Summary Section */}
        <Box marginBottom={6}>
          <Text marginBottom={2}>Order Summary</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Section Title"
              name="checkout.orderSummaryTitle"
              register={register}
              errors={errors}
              placeholder="Order Summary"
            />
            <FormField
              label="Items Count (Singular)"
              name="checkout.itemsCountSingular"
              register={register}
              errors={errors}
              placeholder="1 item"
            />
            <FormField
              label="Items Count (Plural)"
              name="checkout.itemsCountPlural"
              register={register}
              errors={errors}
              placeholder="{count} items"
              description="Use {count} as placeholder"
            />
            <FormField
              label="Products Label"
              name="checkout.productsLabel"
              register={register}
              errors={errors}
              placeholder="Products"
            />
            <FormField
              label="Quantity Label"
              name="checkout.quantityLabel"
              register={register}
              errors={errors}
              placeholder="Quantity"
            />
            <FormField
              label="Add Promo Code Text"
              name="checkout.addPromoCodeText"
              register={register}
              errors={errors}
              placeholder="Add promo code or gift card"
            />
            <FormField
              label="Promo Code Label"
              name="checkout.promoCodeLabel"
              register={register}
              errors={errors}
              placeholder="Promo code"
            />
            <FormField
              label="Promo Code Placeholder"
              name="checkout.promoCodePlaceholder"
              register={register}
              errors={errors}
              placeholder="Enter code"
            />
            <FormField
              label="Apply Button"
              name="checkout.applyPromoButton"
              register={register}
              errors={errors}
              placeholder="Apply"
            />
            <FormField
              label="Remove Button"
              name="checkout.removePromoButton"
              register={register}
              errors={errors}
              placeholder="Remove"
            />
            <FormField
              label="One Voucher Per Order Hint"
              name="checkout.oneVoucherPerOrderHint"
              register={register}
              errors={errors}
              placeholder="One voucher per order. Gift cards can be combined."
            />
            <FormField
              label="Replace Voucher Confirm"
              name="checkout.replaceVoucherConfirm"
              register={register}
              errors={errors}
              placeholder="Only one voucher can be used per order. Applying this code will replace {code}. Continue?"
            />
            <FormField
              label="Eligible For Free Shipping"
              name="checkout.eligibleForFreeShipping"
              register={register}
              errors={errors}
              placeholder="Eligible for free shipping"
            />
            <FormField
              label="Gift Card Label"
              name="checkout.giftCardLabel"
              register={register}
              errors={errors}
              placeholder="Gift card"
            />
            <FormField
              label="Subtotal Label"
              name="checkout.subtotalLabel"
              register={register}
              errors={errors}
              placeholder="Subtotal"
            />
            <FormField
              label="Shipping Label"
              name="checkout.shippingLabel"
              register={register}
              errors={errors}
              placeholder="Shipping"
            />
            <FormField
              label="Tax Label"
              name="checkout.taxLabel"
              register={register}
              errors={errors}
              placeholder="Tax"
            />
            <FormField
              label="Includes Tax Text"
              name="checkout.includesTaxText"
              register={register}
              errors={errors}
              placeholder="Includes {amount} tax"
              description="Use {amount} as placeholder"
            />
            <FormField
              label="Total Label"
              name="checkout.totalLabel"
              register={register}
              errors={errors}
              placeholder="Total"
            />
          </Box>
        </Box>

        {/* Place Order Section */}
        <Box marginBottom={6}>
          <Text marginBottom={2}>Place Order</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Place Order Button"
              name="checkout.placeOrderButton"
              register={register}
              errors={errors}
              placeholder="Place Order"
            />
            <FormField
              label="Processing Text"
              name="checkout.processingOrderText"
              register={register}
              errors={errors}
              placeholder="Processing your order..."
            />
            <FormField
              label="Agreement Text"
              name="checkout.agreementText"
              register={register}
              errors={errors}
              placeholder="By placing this order, you agree to our"
            />
          </Box>
        </Box>

        {/* Processing & Order Confirmation */}
        <Box marginBottom={6}>
          <Text marginBottom={2}>Processing & Order Confirmation</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Almost Done Text"
              name="checkout.almostDoneText"
              register={register}
              errors={errors}
              placeholder="Almost done…"
            />
            <FormField
              label="Order Receipt Title"
              name="checkout.orderReceiptTitle"
              register={register}
              errors={errors}
              placeholder="Order Receipt"
            />
            <FormField
              label="Order Number Prefix"
              name="checkout.orderNumberPrefix"
              register={register}
              errors={errors}
              placeholder="Order #"
            />
            <FormField
              label="Order Confirmed Title"
              name="checkout.orderConfirmedTitle"
              register={register}
              errors={errors}
              placeholder="Order Confirmed"
            />
            <FormField
              label="Order Confirmed Message"
              name="checkout.orderConfirmedMessage"
              register={register}
              errors={errors}
              placeholder="Thank you for your order! We've received it..."
            />
            <FormField
              label="Confirmation Sent To"
              name="checkout.confirmationSentTo"
              register={register}
              errors={errors}
              placeholder="Confirmation sent to:"
            />
            <FormField
              label="Customer Label"
              name="checkout.customerLabel"
              register={register}
              errors={errors}
              placeholder="Customer:"
            />
            <FormField
              label="Order Date Label"
              name="checkout.orderDateLabel"
              register={register}
              errors={errors}
              placeholder="Order Date:"
            />
            <FormField
              label="What's Next Title"
              name="checkout.whatsNextTitle"
              register={register}
              errors={errors}
              placeholder="What's Next?"
            />
            <FormField
              label="Order Processing Step"
              name="checkout.orderProcessingStep"
              register={register}
              errors={errors}
              placeholder="Order Processing"
            />
            <FormField
              label="Order Processing Message"
              name="checkout.orderProcessingMessage"
              register={register}
              errors={errors}
              placeholder="We're preparing your order for shipment."
            />
            <FormField
              label="Shipping Notification Step"
              name="checkout.shippingNotificationStep"
              register={register}
              errors={errors}
              placeholder="Shipping Notification"
            />
            <FormField
              label="Shipping Notification Message"
              name="checkout.shippingNotificationMessage"
              register={register}
              errors={errors}
              placeholder="You'll receive tracking info when shipped."
            />
            <FormField
              label="Delivery Step"
              name="checkout.deliveryStep"
              register={register}
              errors={errors}
              placeholder="Delivery"
            />
            <FormField
              label="Delivery Message"
              name="checkout.deliveryMessage"
              register={register}
              errors={errors}
              placeholder="Your order will arrive at your doorstep!"
            />
            <FormField
              label="Print Receipt Button"
              name="checkout.printReceiptButton"
              register={register}
              errors={errors}
              placeholder="Print Receipt"
            />
            <FormField
              label="Thank You Purchase Message"
              name="checkout.thankYouPurchaseMessage"
              register={register}
              errors={errors}
              placeholder="Thank you for your purchase!..."
            />
            <FormField
              label="Order Details Title"
              name="checkout.orderDetailsTitle"
              register={register}
              errors={errors}
              placeholder="Order Details"
            />
            <FormField
              label="Contact Label"
              name="checkout.contactLabel"
              register={register}
              errors={errors}
              placeholder="Contact"
            />
            <FormField
              label="Authorized Status"
              name="checkout.authorizedStatus"
              register={register}
              errors={errors}
              placeholder="Authorized"
            />
            <FormField
              label="Authorized Message"
              name="checkout.authorizedMessage"
              register={register}
              errors={errors}
              placeholder="We've received your payment authorization"
            />
            <FormField
              label="Paid Status"
              name="checkout.paidStatus"
              register={register}
              errors={errors}
              placeholder="Paid"
            />
            <FormField
              label="Paid Message"
              name="checkout.paidMessage"
              register={register}
              errors={errors}
              placeholder="We've received your payment"
            />
            <FormField
              label="Overpaid Status"
              name="checkout.overpaidStatus"
              register={register}
              errors={errors}
              placeholder="Overpaid"
            />
            <FormField
              label="Overpaid Message"
              name="checkout.overpaidMessage"
              register={register}
              errors={errors}
              placeholder="Contact support for refund assistance"
            />
            <FormField
              label="Processing Status"
              name="checkout.processingStatus"
              register={register}
              errors={errors}
              placeholder="Processing"
            />
            <FormField
              label="Processing Message"
              name="checkout.processingMessage"
              register={register}
              errors={errors}
              placeholder="Payment is being processed"
            />
            <FormField
              label="Confirmation Title (Legacy)"
              name="checkout.orderConfirmation"
              register={register}
              errors={errors}
              placeholder="Order Confirmed!"
            />
            <FormField
              label="Thank You Title (Legacy)"
              name="checkout.thankYouTitle"
              register={register}
              errors={errors}
              placeholder="Thank you for your order!"
            />
            <FormField
              label="Thank You Message (Legacy)"
              name="checkout.thankYouMessage"
              register={register}
              errors={errors}
              placeholder="We've received your order and will send you a confirmation email shortly."
            />
            <FormField
              label="Order Number Label"
              name="checkout.orderNumberLabel"
              register={register}
              errors={errors}
              placeholder="Order number"
            />
            <FormField
              label="Continue Shopping Button"
              name="checkout.continueShoppingButton"
              register={register}
              errors={errors}
              placeholder="Continue Shopping"
            />
            <FormField
              label="View Order Button"
              name="checkout.viewOrderButton"
              register={register}
              errors={errors}
              placeholder="View Order"
            />
          </Box>
        </Box>

        {/* Error Messages */}
        <Box marginBottom={6}>
          <Text marginBottom={2}>Error Messages</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Required Field Error"
              name="checkout.requiredFieldError"
              register={register}
              errors={errors}
              placeholder="This field is required"
            />
            <FormField
              label="Invalid Email Error"
              name="checkout.invalidEmailError"
              register={register}
              errors={errors}
              placeholder="Please enter a valid email"
            />
            <FormField
              label="Invalid Phone Error"
              name="checkout.invalidPhoneError"
              register={register}
              errors={errors}
              placeholder="Please enter a valid phone number"
            />
            <FormField
              label="Select Delivery Method Error"
              name="checkout.selectDeliveryMethodError"
              register={register}
              errors={errors}
              placeholder="Please select a delivery method"
            />
            <FormField
              label="Select Payment Method Error"
              name="checkout.selectPaymentMethodError"
              register={register}
              errors={errors}
              placeholder="Please select a payment method"
            />
          </Box>
        </Box>

        {/* Footer Links */}
        <Box>
          <Text marginBottom={2}>Footer</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Privacy Policy"
              name="checkout.privacyPolicy"
              register={register}
              errors={errors}
              placeholder="Privacy Policy"
            />
            <FormField
              label="Terms of Service"
              name="checkout.termsOfService"
              register={register}
              errors={errors}
              placeholder="Terms of Service"
            />
            <FormField
              label="Security Note"
              name="checkout.securityNote"
              register={register}
              errors={errors}
              placeholder="Protected by SSL encryption • Your payment info is safe"
            />
          </Box>
        </Box>
      </SectionCard>

    </>
  );
}

