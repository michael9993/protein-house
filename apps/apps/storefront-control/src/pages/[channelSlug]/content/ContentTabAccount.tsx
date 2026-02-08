import { Box, Text } from "@saleor/macaw-ui";
import { SectionCard } from "@/modules/ui/section-card";
import { FormField } from "@/modules/ui/form-field";
import type { ContentTabProps } from "./types";

export function ContentTabAccount({ register, errors, control }: ContentTabProps) {
  return (
    <>
      <SectionCard
        id="content-account"
        title="Account Pages"
        description="Text for authentication and account pages"
        keywords={["account", "login", "signup", "profile"]}
        icon="👤"
      >
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
          <FormField
            label="Sign In Title"
            name="account.signInTitle"
            register={register}
            errors={errors}
            placeholder="Sign In"
          />
          <FormField
            label="Sign Up Title"
            name="account.signUpTitle"
            register={register}
            errors={errors}
            placeholder="Create Account"
          />
          <FormField
            label="Sign In Button"
            name="account.signInButton"
            register={register}
            errors={errors}
            placeholder="Sign In"
          />
          <FormField
            label="Sign Up Button"
            name="account.signUpButton"
            register={register}
            errors={errors}
            placeholder="Create Account"
          />
          <FormField
            label="Sign Out Button"
            name="account.signOutButton"
            register={register}
            errors={errors}
            placeholder="Sign Out"
          />
          <FormField
            label="Forgot Password Link"
            name="account.forgotPasswordLink"
            register={register}
            errors={errors}
            placeholder="Forgot Password?"
          />
          <FormField
            label="My Account Title"
            name="account.myAccountTitle"
            register={register}
            errors={errors}
            placeholder="My Account"
          />
          <FormField
            label="Orders Title"
            name="account.ordersTitle"
            register={register}
            errors={errors}
            placeholder="My Orders"
          />
          <FormField
            label="Addresses Title"
            name="account.addressesTitle"
            register={register}
            errors={errors}
            placeholder="My Addresses"
          />
          <FormField
            label="Wishlist Title"
            name="account.wishlistTitle"
            register={register}
            errors={errors}
            placeholder="Wishlist"
          />
          <FormField
            label="Settings Title"
            name="account.settingsTitle"
            register={register}
            errors={errors}
            placeholder="Settings"
          />
          <FormField
            label="Dashboard Title"
            name="account.dashboardTitle"
            register={register}
            errors={errors}
            placeholder="Dashboard"
          />
          <FormField
            label="Need Help Title"
            name="account.needHelpTitle"
            register={register}
            errors={errors}
            placeholder="Need Help?"
          />
          <FormField
            label="Need Help Description"
            name="account.needHelpDescription"
            register={register}
            errors={errors}
            placeholder="Our support team is here to assist you 24/7"
          />
          <FormField
            label="Contact Support Button"
            name="account.contactSupportButton"
            register={register}
            errors={errors}
            placeholder="Contact Support"
          />
        </Box>
      </SectionCard>

      <SectionCard
        id="content-confirm-email"
        title="Confirm Email Page"
        description="Text for the page where users land when they click the confirmation link"
        keywords={["confirm", "email", "token", "verification"]}
        icon="✉️"
      >
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
          <FormField
            label="Page Title"
            name="account.confirmAccountTitle"
            register={register}
            errors={errors}
            placeholder="Confirm Your Email"
          />
          <FormField
            label="Page Subtitle"
            name="account.confirmAccountSubtitle"
            register={register}
            errors={errors}
            placeholder="Click the link in your email or enter your confirmation details below"
          />
          <FormField
            label="Email Label"
            name="account.confirmAccountEmailLabel"
            register={register}
            errors={errors}
            placeholder="Email Address"
          />
          <FormField
            label="Email Placeholder"
            name="account.confirmAccountEmailPlaceholder"
            register={register}
            errors={errors}
            placeholder="you@example.com"
          />
          <FormField
            label="Token Label"
            name="account.confirmAccountTokenLabel"
            register={register}
            errors={errors}
            placeholder="Confirmation Token"
          />
          <FormField
            label="Token Placeholder"
            name="account.confirmAccountTokenPlaceholder"
            register={register}
            errors={errors}
            placeholder="Enter token from email"
          />
          <FormField
            label="Token Hint"
            name="account.confirmAccountTokenHint"
            register={register}
            errors={errors}
            placeholder="The token was sent to your email address"
          />
          <FormField
            label="Confirm Button"
            name="account.confirmAccountButton"
            register={register}
            errors={errors}
            placeholder="Confirm Account"
          />
          <FormField
            label="Back to Sign In"
            name="account.confirmAccountBackToSignIn"
            register={register}
            errors={errors}
            placeholder="Back to Sign In"
          />
          <FormField
            label="Confirming Text (loading)"
            name="account.confirmAccountConfirmingText"
            register={register}
            errors={errors}
            placeholder="Confirming..."
          />
          <FormField
            label="Checking Message (activation)"
            name="account.confirmAccountCheckingMessage"
            register={register}
            errors={errors}
            placeholder="Checking your activation link..."
          />
          <FormField
            label="Auto-login Hint"
            name="account.confirmAccountAutoLoginHint"
            register={register}
            errors={errors}
            placeholder="You'll be logged in automatically when verification succeeds."
          />
          <FormField
            label="Success Message"
            name="account.confirmAccountSuccessMessage"
            register={register}
            errors={errors}
            placeholder="Account confirmed and logged in! Redirecting..."
          />
          <FormField
            label="Link Expired Error"
            name="account.confirmAccountLinkExpiredError"
            register={register}
            errors={errors}
            placeholder="This confirmation link is invalid or has expired."
          />
          <FormField
            label="Request New Link (link text)"
            name="account.confirmAccountRequestNewLink"
            register={register}
            errors={errors}
            placeholder="Request a new confirmation email"
          />
          <FormField
            label="Already Confirmed Message"
            name="account.confirmAccountAlreadyConfirmed"
            register={register}
            errors={errors}
            placeholder="This account has already been confirmed. Redirecting to sign in..."
          />
          <FormField
            label="Unexpected Error"
            name="account.confirmAccountUnexpectedError"
            register={register}
            errors={errors}
            placeholder="An unexpected error occurred. Please try again or request a new confirmation email."
          />
          <FormField
            label="Login: Invalid Credentials Error"
            name="account.loginInvalidCredentialsError"
            register={register}
            errors={errors}
            placeholder="Please, enter valid credentials"
          />
          <FormField
            label="Login: Email/Password Required"
            name="account.loginEmailPasswordRequiredError"
            register={register}
            errors={errors}
            placeholder="Email and password are required"
          />
          <FormField
            label="Login: Generic Error"
            name="account.loginGenericError"
            register={register}
            errors={errors}
            placeholder="An error occurred during login. Please try again."
          />
          <FormField
            label="Register: Email/Password Required"
            name="account.registerEmailPasswordRequiredError"
            register={register}
            errors={errors}
            placeholder="Email and password are required"
          />
          <FormField
            label="Register: Failed Error"
            name="account.registerFailedError"
            register={register}
            errors={errors}
            placeholder="Registration failed"
          />
          <FormField
            label="Register: Account Exists Error"
            name="account.registerAccountExistsError"
            register={register}
            errors={errors}
            placeholder="An account with this email already exists. Please sign in instead."
          />
          <FormField
            label="Register: Generic Error"
            name="account.registerGenericError"
            register={register}
            errors={errors}
            placeholder="An error occurred during registration. Please try again."
          />
          <FormField
            label="Password Mismatch Error"
            name="account.passwordMismatchError"
            register={register}
            errors={errors}
            placeholder="Passwords do not match. Please try again."
          />
          <FormField
            label="Password Too Short Error"
            name="account.passwordTooShortError"
            register={register}
            errors={errors}
            placeholder="Password must be at least 8 characters."
          />
          <FormField
            label="Password Reset Rate Limit Error"
            name="account.passwordResetRateLimitError"
            register={register}
            errors={errors}
            placeholder="You've already requested a password reset recently. Please wait 15 minutes..."
          />
          <FormField
            label="Password Reset Rate Limit Info"
            name="account.passwordResetRateLimitInfo"
            register={register}
            errors={errors}
            placeholder="If you don't receive an email, please check your spam folder..."
          />
        </Box>
      </SectionCard>

      <SectionCard
        id="content-dashboard"
        title="Dashboard"
        description="Account dashboard text"
        keywords={["dashboard", "account", "orders"]}
        icon="📊"
      >
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
          <FormField
            label="Welcome Back"
            name="dashboard.welcomeBack"
            register={register}
            errors={errors}
            placeholder="Welcome back, {name}"
          />
          <FormField
            label="Welcome Back Message"
            name="dashboard.welcomeBackMessage"
            register={register}
            errors={errors}
            placeholder="Here's what's happening with your account today."
          />
          <FormField
            label="Account Summary"
            name="dashboard.accountSummary"
            register={register}
            errors={errors}
            placeholder="here's what's happening..."
          />
          <FormField
            label="Total Orders"
            name="dashboard.totalOrders"
            register={register}
            errors={errors}
            placeholder="Total Orders"
          />
          <FormField
            label="Wishlist Items"
            name="dashboard.wishlistItems"
            register={register}
            errors={errors}
            placeholder="Wishlist Items"
          />
          <FormField
            label="Saved Addresses"
            name="dashboard.savedAddresses"
            register={register}
            errors={errors}
            placeholder="Saved Addresses"
          />
          <FormField
            label="Member Since"
            name="dashboard.memberSince"
            register={register}
            errors={errors}
            placeholder="Member Since"
          />
          <FormField
            label="Recent Orders"
            name="dashboard.recentOrders"
            register={register}
            errors={errors}
            placeholder="Recent Orders"
          />
          <FormField
            label="View All Button"
            name="dashboard.viewAllButton"
            register={register}
            errors={errors}
            placeholder="View All →"
          />
          <FormField
            label="View Button"
            name="dashboard.viewButton"
            register={register}
            errors={errors}
            placeholder="View"
          />
          <FormField
            label="Order Number Prefix"
            name="dashboard.orderNumberPrefix"
            register={register}
            errors={errors}
            placeholder="Order #"
          />
          <FormField
            label="Order Label"
            name="dashboard.orderLabel"
            register={register}
            errors={errors}
            placeholder="Order"
          />
          <FormField
            label="No Orders Yet"
            name="dashboard.noOrdersYet"
            register={register}
            errors={errors}
            placeholder="No orders yet"
          />
          <FormField
            label="When You Place Order"
            name="dashboard.whenYouPlaceOrder"
            register={register}
            errors={errors}
            placeholder="When you place an order, it will appear here."
          />
          <FormField
            label="No Recent Orders"
            name="dashboard.noRecentOrders"
            register={register}
            errors={errors}
            placeholder="No recent orders"
          />
          <FormField
            label="Start Shopping"
            name="dashboard.startShopping"
            register={register}
            errors={errors}
            placeholder="Start Shopping"
          />
        </Box>
      </SectionCard>

      <SectionCard
        id="content-orders"
        title="Orders Page"
        description="Orders list and detail text"
        keywords={["orders", "invoice", "tracking"]}
      >
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
          <FormField
            label="Order Number"
            name="orders.orderNumber"
            register={register}
            errors={errors}
            placeholder="Order Number"
          />
          <FormField
            label="Order Label"
            name="orders.orderLabel"
            register={register}
            errors={errors}
            placeholder="Order"
          />
          <FormField
            label="Order Number Prefix"
            name="orders.orderNumberPrefix"
            register={register}
            errors={errors}
            placeholder="Order #"
          />
          <FormField
            label="Date Placed"
            name="orders.datePlaced"
            register={register}
            errors={errors}
            placeholder="Date Placed"
          />
          <FormField
            label="Total Label"
            name="orders.totalLabel"
            register={register}
            errors={errors}
            placeholder="TOTAL"
          />
          <FormField
            label="Get Invoice"
            name="orders.getInvoice"
            register={register}
            errors={errors}
            placeholder="Get Invoice"
          />
          <FormField
            label="Download Invoice"
            name="orders.downloadInvoice"
            register={register}
            errors={errors}
            placeholder="Download Invoice"
          />
          <FormField
            label="View Details"
            name="orders.viewDetails"
            register={register}
            errors={errors}
            placeholder="View Details"
          />
          <FormField
            label="Track Package"
            name="orders.trackPackage"
            register={register}
            errors={errors}
            placeholder="Track Package"
          />
          <FormField
            label="Buy Again"
            name="orders.buyAgain"
            register={register}
            errors={errors}
            placeholder="Buy Again"
          />
          <FormField
            label="Show All Orders"
            name="orders.showAllOrders"
            register={register}
            errors={errors}
            placeholder="Show All Orders ({count})"
          />
          <FormField
            label="Show Less"
            name="orders.showLess"
            register={register}
            errors={errors}
            placeholder="Show Less"
          />
          <FormField
            label="Orders Placed"
            name="orders.ordersPlaced"
            register={register}
            errors={errors}
            placeholder="Orders Placed"
          />
          <FormField
            label="No Orders"
            name="orders.noOrders"
            register={register}
            errors={errors}
            placeholder="No orders yet"
          />
          <FormField
            label="No Orders Message"
            name="orders.noOrdersMessage"
            register={register}
            errors={errors}
            placeholder="When you place an order..."
          />
          <FormField
            label="No Orders Yet Message"
            name="orders.noOrdersYetMessage"
            register={register}
            errors={errors}
            placeholder="Looks like you haven't placed any orders yet..."
          />
          <FormField
            label="Order Status"
            name="orders.orderStatus"
            register={register}
            errors={errors}
            placeholder="Status"
          />
          <FormField
            label="Track Order"
            name="orders.trackOrder"
            register={register}
            errors={errors}
            placeholder="Track Order"
          />
          <FormField
            label="Qty Label"
            name="orders.qtyLabel"
            register={register}
            errors={errors}
            placeholder="Qty:"
          />
          <FormField
            label="Remaining Items"
            name="orders.remainingItems"
            register={register}
            errors={errors}
            placeholder="+{count}"
          />
          <FormField
            label="Generating Invoice"
            name="orders.generatingInvoice"
            register={register}
            errors={errors}
            placeholder="Generating Invoice..."
          />
          <FormField
            label="Generate & Download Invoice"
            name="orders.generateDownloadInvoice"
            register={register}
            errors={errors}
            placeholder="Generate & Download Invoice"
          />
          <FormField
            label="Invoice Available"
            name="orders.invoiceAvailable"
            register={register}
            errors={errors}
            placeholder="Invoice Available"
          />
          <FormField
            label="Invoice Available Message"
            name="orders.invoiceAvailableMessage"
            register={register}
            errors={errors}
            placeholder="Click below to generate and download your invoice as a PDF."
          />
          <FormField
            label="Invoice Pending"
            name="orders.invoicePending"
            register={register}
            errors={errors}
            placeholder="Invoice Pending"
          />
          <FormField
            label="Invoice Pending Message"
            name="orders.invoicePendingMessage"
            register={register}
            errors={errors}
            placeholder="Invoices are generated once payment is completed..."
          />
          <FormField
            label="Invoice Will Be Generated"
            name="orders.invoiceWillBeGenerated"
            register={register}
            errors={errors}
            placeholder="Your invoice will be generated instantly and downloaded as a PDF."
          />
          <FormField
            label="Need Invoice Sooner"
            name="orders.needInvoiceSooner"
            register={register}
            errors={errors}
            placeholder="Need your invoice sooner? Please contact our support team."
          />
          <FormField
            label="Close"
            name="orders.close"
            register={register}
            errors={errors}
            placeholder="Close"
          />
          <FormField
            label="Invoice Modal Title"
            name="orders.invoiceModalTitle"
            register={register}
            errors={errors}
            placeholder="Invoice"
          />
          <FormField
            label="Tracking Modal Title"
            name="orders.trackingModalTitle"
            register={register}
            errors={errors}
            placeholder="Track Package"
          />
          <FormField
            label="Tracking Number Label"
            name="orders.trackingNumberLabel"
            register={register}
            errors={errors}
            placeholder="Tracking Number"
          />
          <FormField
            label="Status Label"
            name="orders.statusLabel"
            register={register}
            errors={errors}
            placeholder="Status:"
          />
          <FormField
            label="Track Package Description"
            name="orders.trackPackageDescription"
            register={register}
            errors={errors}
            placeholder="Track your package using any of the services below:"
          />
          <FormField
            label="Universal Trackers"
            name="orders.universalTrackers"
            register={register}
            errors={errors}
            placeholder="Universal Trackers (Recommended)"
          />
          <FormField
            label="Direct Carrier Links"
            name="orders.directCarrierLinks"
            register={register}
            errors={errors}
            placeholder="Direct Carrier Links"
          />
          <FormField
            label="Loading"
            name="orders.loading"
            register={register}
            errors={errors}
            placeholder="Loading..."
          />
        </Box>

        <Text marginTop={6} marginBottom={3}>
          Order Details Page
        </Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Back to Orders"
            name="orders.backToOrders"
            register={register}
            errors={errors}
            placeholder="Back to Orders"
          />
          <FormField
            label="Placed On"
            name="orders.placedOn"
            register={register}
            errors={errors}
            placeholder="Placed on"
          />
          <FormField
            label="Order Items Title"
            name="orders.orderItemsTitle"
            register={register}
            errors={errors}
            placeholder="Order Items"
          />
          <FormField
            label="View Product"
            name="orders.viewProduct"
            register={register}
            errors={errors}
            placeholder="View Product"
          />
          <FormField
            label="Order Summary Title"
            name="orders.orderSummaryTitle"
            register={register}
            errors={errors}
            placeholder="Order Summary"
          />
          <FormField
            label="Subtotal Label"
            name="orders.subtotalLabel"
            register={register}
            errors={errors}
            placeholder="Subtotal"
          />
          <FormField
            label="Shipping Label"
            name="orders.shippingLabel"
            register={register}
            errors={errors}
            placeholder="Shipping"
          />
          <FormField
            label="Shipping Free"
            name="orders.shippingFree"
            register={register}
            errors={errors}
            placeholder="Free"
          />
          <FormField
            label="Total Label (Details)"
            name="orders.totalLabelDetails"
            register={register}
            errors={errors}
            placeholder="Total"
          />
          <FormField
            label="Shipping Address Title"
            name="orders.shippingAddressTitle"
            register={register}
            errors={errors}
            placeholder="Shipping Address"
          />
          <FormField
            label="Billing Address Title"
            name="orders.billingAddressTitle"
            register={register}
            errors={errors}
            placeholder="Billing Address"
          />
          <FormField
            label="Shipment Tracking Title"
            name="orders.shipmentTrackingTitle"
            register={register}
            errors={errors}
            placeholder="Shipment Tracking"
          />
          <FormField
            label="Status Label (Details)"
            name="orders.statusLabelDetails"
            register={register}
            errors={errors}
            placeholder="Status"
          />
          <FormField
            label="Tracking Number Label (Details)"
            name="orders.trackingNumberLabelDetails"
            register={register}
            errors={errors}
            placeholder="Tracking #"
          />
          <FormField
            label="Invoice Title"
            name="orders.invoiceTitle"
            register={register}
            errors={errors}
            placeholder="Invoice"
          />
          <FormField
            label="Invoice Number Prefix"
            name="orders.invoiceNumberPrefix"
            register={register}
            errors={errors}
            placeholder="Invoice #"
          />
          <FormField
            label="Download Button"
            name="orders.downloadButton"
            register={register}
            errors={errors}
            placeholder="Download"
          />
          <FormField
            label="Generating Text"
            name="orders.generatingText"
            register={register}
            errors={errors}
            placeholder="Generating..."
          />
          <FormField
            label="Unavailable Text"
            name="orders.unavailableText"
            register={register}
            errors={errors}
            placeholder="Unavailable"
          />
          <FormField
            label="Quick Actions Title"
            name="orders.quickActionsTitle"
            register={register}
            errors={errors}
            placeholder="Quick Actions"
          />
          <FormField
            label="Need Help Title"
            name="orders.needHelpTitle"
            register={register}
            errors={errors}
            placeholder="Need Help?"
          />
          <FormField
            label="Contact Support Button"
            name="orders.contactSupportButton"
            register={register}
            errors={errors}
            placeholder="Contact Support"
          />
          <FormField
            label="View FAQs Button"
            name="orders.viewFaqsButton"
            register={register}
            errors={errors}
            placeholder="View FAQs"
          />
        </Box>

        <Text marginTop={6} marginBottom={3}>
          Order Status Labels
        </Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Processing"
            name="orders.statusProcessing"
            register={register}
            errors={errors}
            placeholder="Processing"
          />
          <FormField
            label="Partially Shipped"
            name="orders.statusPartiallyShipped"
            register={register}
            errors={errors}
            placeholder="Partially Shipped"
          />
          <FormField
            label="Shipped"
            name="orders.statusShipped"
            register={register}
            errors={errors}
            placeholder="Shipped"
          />
          <FormField
            label="Delivered"
            name="orders.statusDelivered"
            register={register}
            errors={errors}
            placeholder="Delivered"
          />
          <FormField
            label="Canceled"
            name="orders.statusCanceled"
            register={register}
            errors={errors}
            placeholder="Canceled"
          />
          <FormField
            label="Returned"
            name="orders.statusReturned"
            register={register}
            errors={errors}
            placeholder="Returned"
          />
        </Box>

        <Text marginTop={6} marginBottom={3}>
          Payment Status Labels
        </Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Pending"
            name="orders.paymentPending"
            register={register}
            errors={errors}
            placeholder="Pending"
          />
          <FormField
            label="Partially Paid"
            name="orders.paymentPartiallyPaid"
            register={register}
            errors={errors}
            placeholder="Partially Paid"
          />
          <FormField
            label="Paid"
            name="orders.paymentPaid"
            register={register}
            errors={errors}
            placeholder="Paid"
          />
          <FormField
            label="Partially Refunded"
            name="orders.paymentPartiallyRefunded"
            register={register}
            errors={errors}
            placeholder="Partially Refunded"
          />
          <FormField
            label="Refunded"
            name="orders.paymentRefunded"
            register={register}
            errors={errors}
            placeholder="Refunded"
          />
          <FormField
            label="Payment Failed"
            name="orders.paymentFailed"
            register={register}
            errors={errors}
            placeholder="Payment Failed"
          />
          <FormField
            label="Payment Cancelled"
            name="orders.paymentCancelled"
            register={register}
            errors={errors}
            placeholder="Cancelled"
          />
        </Box>

        <Text marginTop={6} marginBottom={3}>
          Reorder Button
        </Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Reorder Items"
            name="orders.reorderItems"
            register={register}
            errors={errors}
            placeholder="Reorder Items"
          />
          <FormField
            label="Adding to Cart"
            name="orders.addingToCart"
            register={register}
            errors={errors}
            placeholder="Adding to Cart..."
          />
          <FormField
            label="Items Added to Cart"
            name="orders.itemsAddedToCart"
            register={register}
            errors={errors}
            placeholder="{count} item(s) added to cart!"
          />
          <FormField
            label="Redirecting to Cart"
            name="orders.redirectingToCart"
            register={register}
            errors={errors}
            placeholder="Redirecting to cart..."
          />
          <FormField
            label="Try Again"
            name="orders.tryAgain"
            register={register}
            errors={errors}
            placeholder="Try Again"
          />
        </Box>
      </SectionCard>

      <SectionCard
        id="content-order-tracking"
        title="Order Tracking Page"
        description="Text for the order tracking page (for non-logged-in users)"
        keywords={["order", "tracking", "track", "order number", "email"]}
        icon="📦"
      >
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Title"
            name="orderTracking.title"
            register={register}
            errors={errors}
            placeholder="Track Your Order"
          />
          <FormField
            label="Description"
            name="orderTracking.description"
            register={register}
            errors={errors}
            placeholder="Enter your order number and email address to view your order status and tracking information."
          />
        </Box>

        <Text marginTop={6} marginBottom={3}>
          Form Fields
        </Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Order Number Label"
            name="orderTracking.orderNumberLabel"
            register={register}
            errors={errors}
            placeholder="Order Number"
          />
          <FormField
            label="Order Number Placeholder"
            name="orderTracking.orderNumberPlaceholder"
            register={register}
            errors={errors}
            placeholder="e.g., 12345"
          />
          <FormField
            label="Order Number Help Text"
            name="orderTracking.orderNumberHelp"
            register={register}
            errors={errors}
            placeholder="You can find your order number in your confirmation email."
          />
          <FormField
            label="Email Label"
            name="orderTracking.emailLabel"
            register={register}
            errors={errors}
            placeholder="Email Address"
          />
          <FormField
            label="Email Placeholder"
            name="orderTracking.emailPlaceholder"
            register={register}
            errors={errors}
            placeholder="your@email.com"
          />
          <FormField
            label="Email Help Text"
            name="orderTracking.emailHelp"
            register={register}
            errors={errors}
            placeholder="The email address you used when placing the order."
          />
        </Box>

        <Text marginTop={6} marginBottom={3}>
          Buttons & Actions
        </Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Track Button"
            name="orderTracking.trackButton"
            register={register}
            errors={errors}
            placeholder="Track Order"
          />
          <FormField
            label="Tracking Button (Loading)"
            name="orderTracking.trackingButton"
            register={register}
            errors={errors}
            placeholder="Tracking..."
          />
          <FormField
            label="Back to Tracking"
            name="orderTracking.backToTracking"
            register={register}
            errors={errors}
            placeholder="Track Another Order"
          />
        </Box>

        <Text marginTop={6} marginBottom={3}>
          Error Messages
        </Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Error: Order Not Found"
            name="orderTracking.errorNotFound"
            register={register}
            errors={errors}
            placeholder="Order not found. Please check your order number and email address."
          />
          <FormField
            label="Error: Generic"
            name="orderTracking.errorGeneric"
            register={register}
            errors={errors}
            placeholder="An error occurred while tracking your order. Please try again."
          />
        </Box>

        <Text marginTop={6} marginBottom={3}>
          Order Found & Account Creation
        </Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Order Found Title"
            name="orderTracking.orderFoundTitle"
            register={register}
            errors={errors}
            placeholder="Order Details"
          />
          <FormField
            label="Create Account Title"
            name="orderTracking.createAccountTitle"
            register={register}
            errors={errors}
            placeholder="Create an Account"
          />
          <FormField
            label="Create Account Description"
            name="orderTracking.createAccountDescription"
            register={register}
            errors={errors}
            placeholder="Sign up to track all your orders, save your addresses, and enjoy faster checkout."
          />
          <FormField
            label="Create Account Button"
            name="orderTracking.createAccountButton"
            register={register}
            errors={errors}
            placeholder="Create Account"
            description="Button text (links to /login page for signup/login)"
          />
        </Box>

        <Text marginTop={6} marginBottom={3}>
          Help & Support
        </Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Need Help Text"
            name="orderTracking.needHelpText"
            register={register}
            errors={errors}
            placeholder="Need help?"
          />
          <FormField
            label="Contact Support Link"
            name="orderTracking.contactSupportLink"
            register={register}
            errors={errors}
            placeholder="Contact Support"
          />
        </Box>
      </SectionCard>

      <SectionCard
        id="content-addresses"
        title="Addresses Page"
        description="Address management text"
        keywords={["addresses", "shipping", "billing"]}
        icon="📍"
      >
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
          <FormField
            label="My Addresses"
            name="addresses.myAddresses"
            register={register}
            errors={errors}
            placeholder="My Addresses"
          />
          <FormField
            label="Addresses Count"
            name="addresses.addressesCount"
            register={register}
            errors={errors}
            placeholder="{count} address(es) saved"
          />
          <FormField
            label="No Addresses Yet"
            name="addresses.noAddressesYet"
            register={register}
            errors={errors}
            placeholder="No addresses saved yet"
          />
          <FormField
            label="Add Address Button"
            name="addresses.addAddressButton"
            register={register}
            errors={errors}
            placeholder="Add Address"
          />
          <FormField
            label="Default Shipping"
            name="addresses.defaultShipping"
            register={register}
            errors={errors}
            placeholder="Default Shipping"
          />
          <FormField
            label="Default Billing"
            name="addresses.defaultBilling"
            register={register}
            errors={errors}
            placeholder="Default Billing"
          />
          <FormField
            label="Shipping & Billing"
            name="addresses.shippingAndBilling"
            register={register}
            errors={errors}
            placeholder="Shipping & Billing"
          />
          <FormField
            label="Shipping Address"
            name="addresses.shippingAddress"
            register={register}
            errors={errors}
            placeholder="Shipping Address"
          />
          <FormField
            label="Billing Address"
            name="addresses.billingAddress"
            register={register}
            errors={errors}
            placeholder="Billing Address"
          />
          <FormField
            label="Saved Address"
            name="addresses.savedAddress"
            register={register}
            errors={errors}
            placeholder="Saved Address"
          />
          <FormField
            label="Set as Default"
            name="addresses.setAsDefault"
            register={register}
            errors={errors}
            placeholder="Set as Default"
          />
          <FormField
            label="No Addresses"
            name="addresses.noAddresses"
            register={register}
            errors={errors}
            placeholder="No addresses saved"
          />
          <FormField
            label="No Addresses Message"
            name="addresses.noAddressesMessage"
            register={register}
            errors={errors}
            placeholder="Add your first address..."
          />
          <FormField
            label="Add New Address Title"
            name="addresses.addNewAddressTitle"
            register={register}
            errors={errors}
            placeholder="Add New Address"
          />
          <FormField
            label="Edit Button"
            name="addresses.editButton"
            register={register}
            errors={errors}
            placeholder="Edit"
          />
          <FormField
            label="Delete Button"
            name="addresses.deleteButton"
            register={register}
            errors={errors}
            placeholder="Delete"
          />
          <FormField
            label="Continue Shopping Button"
            name="addresses.continueShoppingButton"
            register={register}
            errors={errors}
            placeholder="Continue Shopping"
          />
          <FormField
            label="Start Shopping"
            name="addresses.startShopping"
            register={register}
            errors={errors}
            placeholder="Start Shopping"
          />
        </Box>
      </SectionCard>

      <SectionCard
        id="content-settings"
        title="Settings Page"
        description="Account settings page text"
        keywords={["settings", "account", "preferences"]}
        icon="⚙️"
      >
        <Text marginBottom={3}>Page Header</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Account Settings"
            name="settings.accountSettings"
            register={register}
            errors={errors}
            placeholder="Account Settings"
          />
          <FormField
            label="Settings Subtitle"
            name="settings.settingsSubtitle"
            register={register}
            errors={errors}
            placeholder="Manage your profile..."
          />
        </Box>

        <Text marginBottom={3}>Profile Section</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Profile Information"
            name="settings.profileInformation"
            register={register}
            errors={errors}
            placeholder="Profile Information"
          />
          <FormField
            label="Update Personal Details"
            name="settings.updatePersonalDetails"
            register={register}
            errors={errors}
            placeholder="Update your personal details"
          />
          <FormField
            label="Save Changes Button"
            name="settings.saveChangesButton"
            register={register}
            errors={errors}
            placeholder="Save Changes"
          />
          <FormField
            label="Saving Changes"
            name="settings.savingChanges"
            register={register}
            errors={errors}
            placeholder="Saving..."
          />
          <FormField
            label="Profile Updated (success message)"
            name="settings.profileUpdated"
            register={register}
            errors={errors}
            placeholder="Profile updated successfully"
          />
          <FormField
            label="Profile Update Failed (error message)"
            name="settings.profileUpdateFailed"
            register={register}
            errors={errors}
            placeholder="Failed to update profile. Please try again."
          />
          <FormField
            label="Email Change Password Required"
            name="settings.emailChangePasswordRequired"
            register={register}
            errors={errors}
            placeholder="Password is required to change your email. We will send a confirmation link to your new address."
          />
          <FormField
            label="Email Change Confirmation Sent"
            name="settings.emailChangeConfirmationSent"
            register={register}
            errors={errors}
            placeholder="A confirmation link has been sent to your new email address. Please click it to complete the change."
          />
          <FormField
            label="Email Change Password Invalid (wrong password)"
            name="settings.emailChangePasswordInvalid"
            register={register}
            errors={errors}
            placeholder="Password is not valid. Please enter your current account password."
          />
          <FormField
            label="Profile Invalid Email Error"
            name="settings.profileInvalidEmailError"
            register={register}
            errors={errors}
            placeholder="Please enter a valid email address. Check the domain and extension (e.g. .com not .comm)."
          />
        </Box>

        <Text marginBottom={3}>Password Section</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Change Password"
            name="settings.changePassword"
            register={register}
            errors={errors}
            placeholder="Change Password"
          />
          <FormField
            label="Password Security Note"
            name="settings.passwordSecurityNote"
            register={register}
            errors={errors}
            placeholder="Update your password..."
          />
          <FormField
            label="Current Password"
            name="settings.currentPassword"
            register={register}
            errors={errors}
            placeholder="Current Password"
          />
          <FormField
            label="New Password Label"
            name="settings.newPasswordLabel"
            register={register}
            errors={errors}
            placeholder="New Password"
          />
          <FormField
            label="Confirm New Password"
            name="settings.confirmNewPassword"
            register={register}
            errors={errors}
            placeholder="Confirm New Password"
          />
          <FormField
            label="Update Password Button"
            name="settings.updatePasswordButton"
            register={register}
            errors={errors}
            placeholder="Update Password"
          />
          <FormField
            label="Password Updated (success message)"
            name="settings.passwordUpdated"
            register={register}
            errors={errors}
            placeholder="Password updated successfully"
          />
          <FormField
            label="Password Update Failed (error message)"
            name="settings.passwordUpdateFailed"
            register={register}
            errors={errors}
            placeholder="Failed to update password. Please try again."
          />
        </Box>

        <Text marginBottom={3}>Notifications Section</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
          <FormField
            label="Notification Preferences"
            name="settings.notificationPreferences"
            register={register}
            errors={errors}
            placeholder="Notification Preferences"
          />
          <FormField
            label="Notification Subtitle"
            name="settings.notificationSubtitle"
            register={register}
            errors={errors}
            placeholder="Choose how you want..."
          />
          <FormField
            label="Order Updates"
            name="settings.orderUpdates"
            register={register}
            errors={errors}
            placeholder="Order Updates"
          />
          <FormField
            label="Order Updates Desc"
            name="settings.orderUpdatesDesc"
            register={register}
            errors={errors}
            placeholder="Receive notifications about..."
          />
          <FormField
            label="Promotions & Offers"
            name="settings.promotionsOffers"
            register={register}
            errors={errors}
            placeholder="Promotions & Offers"
          />
          <FormField
            label="Promotions Desc"
            name="settings.promotionsDesc"
            register={register}
            errors={errors}
            placeholder="Get notified about sales..."
          />
          <FormField
            label="Newsletter Setting"
            name="settings.newsletterSetting"
            register={register}
            errors={errors}
            placeholder="Newsletter"
          />
          <FormField
            label="Newsletter Desc"
            name="settings.newsletterDesc"
            register={register}
            errors={errors}
            placeholder="Weekly updates about..."
          />
          <FormField
            label="SMS Notifications"
            name="settings.smsNotifications"
            register={register}
            errors={errors}
            placeholder="SMS Notifications"
          />
          <FormField
            label="SMS Desc"
            name="settings.smsDesc"
            register={register}
            errors={errors}
            placeholder="Receive text messages..."
          />
        </Box>

        <Text marginBottom={3}>Danger Zone</Text>
        <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
          <FormField
            label="Danger Zone"
            name="settings.dangerZone"
            register={register}
            errors={errors}
            placeholder="Danger Zone"
          />
          <FormField
            label="Delete Account Warning"
            name="settings.deleteAccountWarning"
            register={register}
            errors={errors}
            placeholder="Permanently delete your account..."
          />
          <FormField
            label="Delete Account Button"
            name="settings.deleteAccountButton"
            register={register}
            errors={errors}
            placeholder="Delete Account"
          />
        </Box>
      </SectionCard>

    </>
  );
}

