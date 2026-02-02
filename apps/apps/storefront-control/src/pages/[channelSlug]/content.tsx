import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text, Button } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";

import { AppLayout } from "@/modules/ui/app-layout";
import { SectionCard } from "@/modules/ui/section-card";
import { FormField, SelectField } from "@/modules/ui/form-field";
import { StickySaveBar } from "@/modules/ui/sticky-save-bar";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { ContentSchema } from "@/modules/config/schema";
import type { StorefrontConfig } from "@/modules/config/schema";

type ContentFormData = StorefrontConfig["content"];

const ContentPage: NextPage = () => {
  const router = useRouter();
  const { channelSlug } = router.query as { channelSlug: string };
  const { appBridgeState } = useAppBridge();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const {
    data: config,
    isLoading,
    refetch,
  } = trpcClient.config.getConfig.useQuery(
    { channelSlug },
    { enabled: !!channelSlug && !!appBridgeState?.ready },
  );

  const updateMutation = trpcClient.config.updateSection.useMutation({
    onSuccess: () => {
      refetch();
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    },
    onError: () => {
      setSaveStatus("error");
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<ContentFormData>({
    resolver: zodResolver(ContentSchema),
  });

  // Field array for FAQs
  const {
    fields: faqFields,
    append: addFaq,
    remove: removeFaq,
  } = useFieldArray({
    control,
    name: "contact.faqs",
  });

  useEffect(() => {
    if (config?.content) {
      reset(config.content);
    }
  }, [config, reset]);

  const onSubmit = async (data: ContentFormData) => {
    setSaveStatus("saving");
    await updateMutation.mutateAsync({
      channelSlug,
      section: "content",
      data,
    });
  };

  if (!appBridgeState?.ready || isLoading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}
      >
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="content">
      <form onSubmit={handleSubmit(onSubmit)}>
        <SectionCard
          id="content-cart"
          title="Cart Page"
          description="Text shown on the cart page"
          keywords={["cart", "checkout", "free shipping"]}
          icon="🛒"
        >
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Cart Title"
              name="cart.cartTitle"
              register={register}
              errors={errors}
              placeholder="Shopping Cart"
            />
            <FormField
              label="Empty Cart Title"
              name="cart.emptyCartTitle"
              register={register}
              errors={errors}
              placeholder="Your cart is empty"
            />
            <FormField
              label="Empty Cart Message"
              name="cart.emptyCartMessage"
              register={register}
              errors={errors}
              placeholder="Looks like you haven't added anything yet"
            />
            <FormField
              label="Continue Shopping Button"
              name="cart.continueShoppingButton"
              register={register}
              errors={errors}
              placeholder="Continue Shopping"
            />
            <FormField
              label="Checkout Button"
              name="cart.checkoutButton"
              register={register}
              errors={errors}
              placeholder="Proceed to Checkout"
            />
            <FormField
              label="View Cart Button"
              name="cart.viewCartButton"
              register={register}
              errors={errors}
              placeholder="View Full Cart"
            />
            <FormField
              label="Shipping Note"
              name="cart.shippingNote"
              register={register}
              errors={errors}
              placeholder="Shipping and taxes calculated at checkout"
            />
            <FormField
              label="Select All Button"
              name="cart.selectAllButton"
              register={register}
              errors={errors}
              placeholder="Select All"
            />
            <FormField
              label="Deselect All Button"
              name="cart.deselectAllButton"
              register={register}
              errors={errors}
              placeholder="Deselect All"
            />
            <FormField
              label="Free Shipping Message"
              name="cart.freeShippingMessage"
              register={register}
              errors={errors}
              placeholder="Add {amount} more for free shipping"
            />
            <FormField
              label="Free Shipping Threshold Reached"
              name="cart.freeShippingThresholdReached"
              register={register}
              errors={errors}
              placeholder="You've qualified for free shipping!"
            />
            <FormField
              label="Add X More For Free Shipping"
              name="cart.addXMoreForFreeShipping"
              register={register}
              errors={errors}
              placeholder="Add {amount} more for FREE shipping!"
            />
            <FormField
              label="Unlocked Free Shipping"
              name="cart.unlockedFreeShipping"
              register={register}
              errors={errors}
              placeholder="You've unlocked FREE shipping!"
            />
            <FormField
              label="Select All Items Button"
              name="cart.selectAllItemsButton"
              register={register}
              errors={errors}
              placeholder="Select all items"
            />
            <FormField
              label="Select Items To Checkout"
              name="cart.selectItemsToCheckout"
              register={register}
              errors={errors}
              placeholder="Select items to proceed to checkout"
            />
            <FormField
              label="Save For Later Button"
              name="cart.saveForLaterButton"
              register={register}
              errors={errors}
              placeholder="Save for Later"
            />
            <FormField
              label="Move To Cart Button"
              name="cart.moveToCartButton"
              register={register}
              errors={errors}
              placeholder="Move to Cart"
            />
            <FormField
              label="Delete Button"
              name="cart.deleteButton"
              register={register}
              errors={errors}
              placeholder="Delete"
            />
            <FormField
              label="Item Singular"
              name="cart.itemSingular"
              register={register}
              errors={errors}
              placeholder="item"
            />
            <FormField
              label="Item Plural"
              name="cart.itemPlural"
              register={register}
              errors={errors}
              placeholder="items"
            />
            <FormField
              label="Order Summary Title"
              name="cart.orderSummaryTitle"
              register={register}
              errors={errors}
              placeholder="Order Summary"
            />
            <FormField
              label="Items Selected Text"
              name="cart.itemsSelectedText"
              register={register}
              errors={errors}
              placeholder="{count} {singular|plural} selected"
            />
            <FormField
              label="Each Label"
              name="cart.eachLabel"
              register={register}
              errors={errors}
              placeholder="each"
            />
            <FormField
              label="Available Label"
              name="cart.availableLabel"
              register={register}
              errors={errors}
              placeholder="available"
            />
            <FormField
              label="Out Of Stock Label"
              name="cart.outOfStockLabel"
              register={register}
              errors={errors}
              placeholder="Out of stock"
            />
            <FormField
              label="Loading Checkout Title"
              name="cart.loadingCheckoutTitle"
              register={register}
              errors={errors}
              placeholder="Loading Checkout..."
            />
            <FormField
              label="Loading Checkout Message"
              name="cart.loadingCheckoutMessage"
              register={register}
              errors={errors}
              placeholder="Please wait while we prepare your checkout"
            />
            <FormField
              label="Quantity Min Error"
              name="cart.quantityMinError"
              register={register}
              errors={errors}
              placeholder="Quantity must be at least 1"
            />
            <FormField
              label="Only X Items Available"
              name="cart.onlyXItemsAvailable"
              register={register}
              errors={errors}
              placeholder="Only {count} items available in stock"
            />
            <FormField
              label="Use Delete Button Message"
              name="cart.useDeleteButtonMessage"
              register={register}
              errors={errors}
              placeholder="Use the Delete button to remove items from cart"
            />
            <FormField
              label="Failed To Update Quantity"
              name="cart.failedToUpdateQuantity"
              register={register}
              errors={errors}
              placeholder="Failed to update quantity"
            />
            <FormField
              label="Only X Available"
              name="cart.onlyXAvailable"
              register={register}
              errors={errors}
              placeholder="Only {count} available"
            />
            <FormField
              label="Quantity Updated Success"
              name="cart.quantityUpdatedSuccess"
              register={register}
              errors={errors}
              placeholder="Quantity updated!"
            />
          </Box>

          <Text marginBottom={3}>Promo Code Section</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Promo Code Label"
              name="cart.promoCodeLabel"
              register={register}
              errors={errors}
              placeholder="Promo Code"
            />
            <FormField
              label="Promo Code Placeholder"
              name="cart.promoCodePlaceholder"
              register={register}
              errors={errors}
              placeholder="Enter code"
            />
            <FormField
              label="Promo Code Apply Button"
              name="cart.promoCodeApplyButton"
              register={register}
              errors={errors}
              placeholder="Apply"
            />
            <FormField
              label="Eligible For Free Shipping"
              name="cart.eligibleForFreeShipping"
              register={register}
              errors={errors}
              placeholder="Eligible for free shipping"
            />
            <FormField
              label="Gift Label"
              name="cart.giftLabel"
              register={register}
              errors={errors}
              placeholder="Gift"
            />
            <FormField
              label="Gift Added Message (toast)"
              name="cart.giftAddedMessage"
              register={register}
              errors={errors}
              placeholder="A free gift has been added to your cart."
            />
            <FormField
              label="Gift Remove Hint"
              name="cart.giftRemoveHint"
              register={register}
              errors={errors}
              placeholder="(You can remove it)"
              description="Shown next to gift badge; leave empty to hide"
            />
          </Box>

          <Text marginBottom={3}>Order Summary</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Subtotal Label"
              name="cart.subtotalLabel"
              register={register}
              errors={errors}
              placeholder="Subtotal"
            />
            <FormField
              label="Original Subtotal Label"
              name="cart.originalSubtotalLabel"
              register={register}
              errors={errors}
              placeholder="Subtotal (before discount)"
            />
            <FormField
              label="You Save Label"
              name="cart.youSaveLabel"
              register={register}
              errors={errors}
              placeholder="You save"
            />
            <FormField
              label="Discounted Subtotal Label"
              name="cart.discountedSubtotalLabel"
              register={register}
              errors={errors}
              placeholder="Your price"
            />
            <FormField
              label="Subtotal Label With Count"
              name="cart.subtotalLabelWithCount"
              register={register}
              errors={errors}
              placeholder="Subtotal ({count} items)"
            />
            <FormField
              label="Shipping Label"
              name="cart.shippingLabel"
              register={register}
              errors={errors}
              placeholder="Shipping"
            />
            <FormField
              label="Shipping Free"
              name="cart.shippingFree"
              register={register}
              errors={errors}
              placeholder="FREE"
            />
            <FormField
              label="Shipping Calculated At Checkout"
              name="cart.shippingCalculatedAtCheckout"
              register={register}
              errors={errors}
              placeholder="Calculated at checkout"
            />
            <FormField
              label="Total Label"
              name="cart.totalLabel"
              register={register}
              errors={errors}
              placeholder="Total"
            />
          </Box>

          <Text marginBottom={3}>Checkout Button States</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Select Items Button"
              name="cart.selectItemsButton"
              register={register}
              errors={errors}
              placeholder="Select Items"
            />
            <FormField
              label="Preparing Checkout"
              name="cart.preparingCheckout"
              register={register}
              errors={errors}
              placeholder="Preparing..."
            />
            <FormField
              label="Loading Checkout"
              name="cart.loadingCheckout"
              register={register}
              errors={errors}
              placeholder="Loading..."
            />
          </Box>

          <Text marginBottom={3}>Trust Badges</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Secure Checkout Text"
              name="cart.secureCheckoutText"
              register={register}
              errors={errors}
              placeholder="Secure Checkout"
            />
            <FormField
              label="SSL Encrypted Text"
              name="cart.sslEncryptedText"
              register={register}
              errors={errors}
              placeholder="SSL Encrypted"
            />
          </Box>

          <Text marginBottom={3}>Payment Methods</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Accepted Payment Methods"
              name="cart.acceptedPaymentMethods"
              register={register}
              errors={errors}
              placeholder="Accepted Payment Methods"
            />
            <FormField
              label="Provided By Stripe"
              name="cart.providedByStripe"
              register={register}
              errors={errors}
              placeholder="Provided by Stripe"
            />
          </Box>

          <Text marginBottom={3}>Saved For Later</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Items Saved For Later"
              name="cart.itemsSavedForLater"
              register={register}
              errors={errors}
              placeholder="{count} item(s) saved for later"
            />
          </Box>
        </SectionCard>

        {/* Product Text - matches ProductTextSchema */}
        <SectionCard
          id="content-product"
          title="Product Page"
          description="Text shown on product detail pages"
          keywords={["product", "reviews", "badges"]}
        >
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Add to Cart Button"
              name="product.addToCartButton"
              register={register}
              errors={errors}
              placeholder="Add to Cart"
            />
            <FormField
              label="Buy Now Button"
              name="product.buyNowButton"
              register={register}
              errors={errors}
              placeholder="Buy Now"
            />
            <FormField
              label="Out of Stock Text"
              name="product.outOfStockText"
              register={register}
              errors={errors}
              placeholder="Out of Stock"
            />
            <FormField
              label="Low Stock Text"
              name="product.lowStockText"
              register={register}
              errors={errors}
              placeholder="Only {count} left in stock"
            />
            <FormField
              label="In Stock Text"
              name="product.inStockText"
              register={register}
              errors={errors}
              placeholder="In Stock"
            />
            <FormField
              label="Sale Badge Text"
              name="product.saleBadgeText"
              register={register}
              errors={errors}
              placeholder="Sale"
            />
            <FormField
              label="New Badge Text"
              name="product.newBadgeText"
              register={register}
              errors={errors}
              placeholder="New"
            />
            <FormField
              label="Reviews Title"
              name="product.reviewsTitle"
              register={register}
              errors={errors}
              placeholder="Customer Reviews"
            />
            <FormField
              label="Write Review Button"
              name="product.writeReviewButton"
              register={register}
              errors={errors}
              placeholder="Write a Review"
            />
            <FormField
              label="No Reviews Text"
              name="product.noReviewsText"
              register={register}
              errors={errors}
              placeholder="No reviews yet. Be the first!"
            />
            <FormField
              label="Adding Button"
              name="product.addingButton"
              register={register}
              errors={errors}
              placeholder="Adding..."
            />
            <FormField
              label="Added To Cart Button"
              name="product.addedToCartButton"
              register={register}
              errors={errors}
              placeholder="Added to Cart!"
            />
            <FormField
              label="Select Options Button"
              name="product.selectOptionsButton"
              register={register}
              errors={errors}
              placeholder="Select Options"
            />
            <FormField
              label="View Cart Link"
              name="product.viewCartLink"
              register={register}
              errors={errors}
              placeholder="View Cart →"
            />
          </Box>
        </SectionCard>

        {/* Account Text - matches AccountTextSchema */}
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

        {/* Confirm Email Page - link landing and form labels */}
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

        {/* General Text - matches GeneralTextSchema */}
        <SectionCard
          id="content-general"
          title="General"
          description="Common text used throughout the store"
          keywords={["buttons", "labels", "newsletter", "search"]}
        >
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Search Placeholder"
              name="general.searchPlaceholder"
              register={register}
              errors={errors}
              placeholder="Search products..."
            />
            <FormField
              label="Newsletter Title"
              name="general.newsletterTitle"
              register={register}
              errors={errors}
              placeholder="Subscribe to our newsletter"
            />
            <FormField
              label="Newsletter Description"
              name="general.newsletterDescription"
              register={register}
              errors={errors}
              placeholder="Get the latest updates and deals"
            />
            <FormField
              label="Newsletter Button"
              name="general.newsletterButton"
              register={register}
              errors={errors}
              placeholder="Subscribe"
            />
            <FormField
              label="Newsletter Success"
              name="general.newsletterSuccess"
              register={register}
              errors={errors}
              placeholder="Thanks for subscribing!"
            />
            <FormField
              label="Load More Button"
              name="general.loadMoreButton"
              register={register}
              errors={errors}
              placeholder="Load More"
            />
            <FormField
              label="View All Button"
              name="general.viewAllButton"
              register={register}
              errors={errors}
              placeholder="View All"
            />
            <FormField
              label="Back Button"
              name="general.backButton"
              register={register}
              errors={errors}
              placeholder="Back"
            />
            <FormField
              label="Close Button"
              name="general.closeButton"
              register={register}
              errors={errors}
              placeholder="Close"
            />
            <FormField
              label="Save Button"
              name="general.saveButton"
              register={register}
              errors={errors}
              placeholder="Save"
            />
            <FormField
              label="Cancel Button"
              name="general.cancelButton"
              register={register}
              errors={errors}
              placeholder="Cancel"
            />
            <FormField
              label="Confirm Button"
              name="general.confirmButton"
              register={register}
              errors={errors}
              placeholder="Confirm"
            />
            <FormField
              label="Delete Button"
              name="general.deleteButton"
              register={register}
              errors={errors}
              placeholder="Delete"
            />
            <FormField
              label="Edit Button"
              name="general.editButton"
              register={register}
              errors={errors}
              placeholder="Edit"
            />
            <FormField
              label="Home Label"
              name="general.homeLabel"
              register={register}
              errors={errors}
              placeholder="Home"
            />
          </Box>
        </SectionCard>

        {/* Homepage Text - matches HomepageTextSchema */}
        <SectionCard
          id="content-homepage"
          title="Homepage Sections"
          description="Text for homepage section headings"
          keywords={["homepage", "sections", "titles"]}
          icon="🏠"
        >
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="New Arrivals Title"
              name="homepage.newArrivalsTitle"
              register={register}
              errors={errors}
              placeholder="New Arrivals"
            />
            <FormField
              label="New Arrivals Subtitle"
              name="homepage.newArrivalsSubtitle"
              register={register}
              errors={errors}
              placeholder="Check out what's new"
            />
            <FormField
              label="Best Sellers Title"
              name="homepage.bestSellersTitle"
              register={register}
              errors={errors}
              placeholder="Best Sellers"
            />
            <FormField
              label="Best Sellers Subtitle"
              name="homepage.bestSellersSubtitle"
              register={register}
              errors={errors}
              placeholder="Our most popular products"
            />
            <FormField
              label="On Sale Title"
              name="homepage.onSaleTitle"
              register={register}
              errors={errors}
              placeholder="On Sale"
            />
            <FormField
              label="On Sale Subtitle"
              name="homepage.onSaleSubtitle"
              register={register}
              errors={errors}
              placeholder="Don't miss these deals"
            />
            <FormField
              label="Featured Title"
              name="homepage.featuredTitle"
              register={register}
              errors={errors}
              placeholder="Featured Products"
            />
            <FormField
              label="Featured Subtitle"
              name="homepage.featuredSubtitle"
              register={register}
              errors={errors}
              placeholder="Hand-picked for you"
            />
            <FormField
              label="Categories Title"
              name="homepage.categoriesTitle"
              register={register}
              errors={errors}
              placeholder="Shop by Category"
            />
            <FormField
              label="Categories Subtitle"
              name="homepage.categoriesSubtitle"
              register={register}
              errors={errors}
              placeholder="Browse our collections"
            />
            <FormField
              label="Brands Title"
              name="homepage.brandsTitle"
              register={register}
              errors={errors}
              placeholder="Top Brands"
            />
            <FormField
              label="Brands Subtitle"
              name="homepage.brandsSubtitle"
              register={register}
              errors={errors}
              placeholder="Shop by brand"
            />
            <FormField
              label="Testimonials Title"
              name="homepage.testimonialsTitle"
              register={register}
              errors={errors}
              placeholder="What Our Customers Say"
            />
            <FormField
              label="Testimonials Subtitle"
              name="homepage.testimonialsSubtitle"
              register={register}
              errors={errors}
              placeholder="Real reviews from real customers"
            />
            <FormField
              label="Average Rating Label"
              name="homepage.averageRatingLabel"
              register={register}
              errors={errors}
              placeholder="Average Rating"
            />
            <FormField
              label="Happy Customers Label"
              name="homepage.happyCustomersLabel"
              register={register}
              errors={errors}
              placeholder="Happy Customers"
            />
            <FormField
              label="Satisfaction Rate Label"
              name="homepage.satisfactionRateLabel"
              register={register}
              errors={errors}
              placeholder="Satisfaction Rate"
            />
            <FormField
              label="Orders Delivered Label"
              name="homepage.ordersDeliveredLabel"
              register={register}
              errors={errors}
              placeholder="Orders Delivered"
            />
            <FormField
              label="Verified Purchase Label"
              name="homepage.verifiedPurchaseLabel"
              register={register}
              errors={errors}
              placeholder="Verified Purchase"
            />
            <FormField
              label="Loading Reviews Text"
              name="homepage.loadingReviewsText"
              register={register}
              errors={errors}
              placeholder="Loading reviews..."
            />
            <FormField
              label="No Reviews Available Text"
              name="homepage.noReviewsAvailableText"
              register={register}
              errors={errors}
              placeholder="No reviews available yet. Be the first to review our products!"
            />
            <FormField
              label="No Reviews Subtext"
              name="homepage.noReviewsSubtext"
              register={register}
              errors={errors}
              placeholder="Reviews will appear here once customers start leaving feedback."
            />
            <FormField
              label="No Approved Reviews Text"
              name="homepage.noApprovedReviewsText"
              register={register}
              errors={errors}
              placeholder="No approved reviews with 4+ stars yet. {count} review(s) pending approval."
            />
            <FormField
              label="Hero CTA Text"
              name="homepage.heroCtaText"
              register={register}
              errors={errors}
              placeholder="Shop Now"
            />
            <FormField
              label="Hero Secondary CTA"
              name="homepage.heroSecondaryCtaText"
              register={register}
              errors={errors}
              placeholder="Learn More"
            />
            <FormField
              label="Watch Video Button"
              name="homepage.watchVideoButton"
              register={register}
              errors={errors}
              placeholder="Watch Video"
              description="Text for the watch video button in hero video section"
            />
            <FormField
              label="Shop Now Button"
              name="homepage.shopNowButton"
              register={register}
              errors={errors}
              placeholder="Shop Now"
            />
            <FormField
              label="Explore Text"
              name="homepage.exploreText"
              register={register}
              errors={errors}
              placeholder="Explore"
              description="Text shown on category cards"
            />
            <FormField
              label="Product Count Text"
              name="homepage.productCountText"
              register={register}
              errors={errors}
              placeholder="Products"
            />
            <FormField
              label="Newsletter Email Placeholder"
              name="homepage.newsletterEmailPlaceholder"
              register={register}
              errors={errors}
              placeholder="Enter your email"
            />
          </Box>
        </SectionCard>

        {/* Checkout Text - matches CheckoutTextSchema */}
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

        {/* Filters Text - matches FiltersTextSchema */}
        <SectionCard
          id="content-filters"
          title="Filters & Product List"
          description="Text for filters, sorting, and product list pages"
          keywords={["filters", "sorting", "search"]}
          icon="🔍"
        >
          <Text marginBottom={3}>Section Titles</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Filters Title"
              name="filters.sectionTitle"
              register={register}
              errors={errors}
              placeholder="Filters"
            />
            <FormField
              label="Clear All Button"
              name="filters.clearAllButton"
              register={register}
              errors={errors}
              placeholder="Clear All Filters"
            />
            <FormField
              label="Show Results Button"
              name="filters.showResultsButton"
              register={register}
              errors={errors}
              placeholder="Show Results"
            />
          </Box>

          <Text marginBottom={3}>Filter Headings</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Category"
              name="filters.categoryTitle"
              register={register}
              errors={errors}
              placeholder="Category"
            />
            <FormField
              label="Collection"
              name="filters.collectionTitle"
              register={register}
              errors={errors}
              placeholder="Collection"
            />
            <FormField
              label="Brand"
              name="filters.brandTitle"
              register={register}
              errors={errors}
              placeholder="Brand"
            />
            <FormField
              label="Size"
              name="filters.sizeTitle"
              register={register}
              errors={errors}
              placeholder="Size"
            />
            <FormField
              label="Color"
              name="filters.colorTitle"
              register={register}
              errors={errors}
              placeholder="Color"
            />
            <FormField
              label="Price"
              name="filters.priceTitle"
              register={register}
              errors={errors}
              placeholder="Price"
            />
            <FormField
              label="Rating"
              name="filters.ratingTitle"
              register={register}
              errors={errors}
              placeholder="Rating"
            />
            <FormField
              label="Availability"
              name="filters.availabilityTitle"
              register={register}
              errors={errors}
              placeholder="Availability"
            />
          </Box>

          <Text marginBottom={3}>Availability Options</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="In Stock Only"
              name="filters.inStockOnly"
              register={register}
              errors={errors}
              placeholder="In Stock Only"
            />
            <FormField
              label="On Sale"
              name="filters.onSale"
              register={register}
              errors={errors}
              placeholder="On Sale"
            />
          </Box>

          <Text marginBottom={3}>Active Filters Labels</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Active Filters Label"
              name="filters.activeFiltersLabel"
              register={register}
              errors={errors}
              placeholder="Active Filters:"
            />
            <FormField
              label="Category (singular)"
              name="filters.categorySingular"
              register={register}
              errors={errors}
              placeholder="category"
            />
            <FormField
              label="Categories (plural)"
              name="filters.categoryPlural"
              register={register}
              errors={errors}
              placeholder="categories"
            />
            <FormField
              label="Collection (singular)"
              name="filters.collectionSingular"
              register={register}
              errors={errors}
              placeholder="collection"
            />
            <FormField
              label="Collections (plural)"
              name="filters.collectionPlural"
              register={register}
              errors={errors}
              placeholder="collections"
            />
            <FormField
              label="Brand (singular)"
              name="filters.brandSingular"
              register={register}
              errors={errors}
              placeholder="brand"
            />
            <FormField
              label="Brands (plural)"
              name="filters.brandPlural"
              register={register}
              errors={errors}
              placeholder="brands"
            />
            <FormField
              label="Color (singular)"
              name="filters.colorSingular"
              register={register}
              errors={errors}
              placeholder="color"
            />
            <FormField
              label="Colors (plural)"
              name="filters.colorPlural"
              register={register}
              errors={errors}
              placeholder="colors"
            />
            <FormField
              label="Size (singular)"
              name="filters.sizeSingular"
              register={register}
              errors={errors}
              placeholder="size"
            />
            <FormField
              label="Sizes (plural)"
              name="filters.sizePlural"
              register={register}
              errors={errors}
              placeholder="sizes"
            />
          </Box>

          <Text marginBottom={3}>Sort Options</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="A to Z"
              name="filters.sortAtoZ"
              register={register}
              errors={errors}
              placeholder="A to Z"
            />
            <FormField
              label="Z to A"
              name="filters.sortZtoA"
              register={register}
              errors={errors}
              placeholder="Z to A"
            />
            <FormField
              label="Price: Low to High"
              name="filters.sortPriceLowHigh"
              register={register}
              errors={errors}
              placeholder="Price: Low to High"
            />
            <FormField
              label="Price: High to Low"
              name="filters.sortPriceHighLow"
              register={register}
              errors={errors}
              placeholder="Price: High to Low"
            />
            <FormField
              label="Newest"
              name="filters.sortNewest"
              register={register}
              errors={errors}
              placeholder="Newest"
            />
            <FormField
              label="Sale"
              name="filters.sortSale"
              register={register}
              errors={errors}
              placeholder="Sale"
            />
          </Box>

          <Text marginBottom={3}>Empty & Loading States</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="No Products Title"
              name="filters.noProductsTitle"
              register={register}
              errors={errors}
              placeholder="No products found"
            />
            <FormField
              label="No Products (with filters)"
              name="filters.noProductsWithFilters"
              register={register}
              errors={errors}
              placeholder="Try adjusting your filters"
            />
            <FormField
              label="No Products (empty)"
              name="filters.noProductsEmpty"
              register={register}
              errors={errors}
              placeholder="Check back later for new products"
            />
            <FormField
              label="Filtering Products"
              name="filters.filteringProducts"
              register={register}
              errors={errors}
              placeholder="Filtering products..."
            />
            <FormField
              label="Loading More"
              name="filters.loadingMore"
              register={register}
              errors={errors}
              placeholder="Loading more products..."
            />
            <FormField
              label="Seen All Products"
              name="filters.seenAllProducts"
              register={register}
              errors={errors}
              placeholder="You've seen all {count} products"
            />
            <FormField
              label="Try Adjusting Filters"
              name="filters.tryAdjustingFilters"
              register={register}
              errors={errors}
              placeholder="Try adjusting your filters to see more"
            />
          </Box>

          <Text marginBottom={3}>Search & Results</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Search Placeholder"
              name="filters.searchPlaceholder"
              register={register}
              errors={errors}
              placeholder="Search Products"
              description="Placeholder text for the products page search bar and nav search"
            />
            <FormField
              label="Search Clear Aria Label"
              name="filters.searchClearAriaLabel"
              register={register}
              errors={errors}
              placeholder="Clear search"
              description="Accessibility label for the clear-search button"
            />
            <FormField
              label="Search Input Aria Label"
              name="filters.searchInputAriaLabel"
              register={register}
              errors={errors}
              placeholder="Search products"
              description="Accessibility label for the search input"
            />
            <FormField
              label="Search Products Title"
              name="filters.searchProductsTitle"
              register={register}
              errors={errors}
              placeholder="Search Products"
            />
            <FormField
              label="Search Results Title"
              name="filters.searchResultsTitle"
              register={register}
              errors={errors}
              placeholder="Search Results"
            />
            <FormField
              label="Results Count Text"
              name="filters.resultsCountText"
              register={register}
              errors={errors}
              placeholder="Found {count} result(s)"
            />
            <FormField
              label="No Results Message"
              name="filters.noResultsMessage"
              register={register}
              errors={errors}
              placeholder='No results found for "{query}"'
            />
            <FormField
              label="Sort By Label"
              name="filters.sortByLabel"
              register={register}
              errors={errors}
              placeholder="Sort by:"
            />
            <FormField
              label="Filters Button Text"
              name="filters.filtersButtonText"
              register={register}
              errors={errors}
              placeholder="Filters"
            />
            <FormField
              label="Search For Text"
              name="filters.searchForText"
              register={register}
              errors={errors}
              placeholder="for"
              description="Text between count and search query (e.g., '10 for shoes')"
            />
            <FormField
              label="Results Text"
              name="filters.resultsText"
              register={register}
              errors={errors}
              placeholder="results"
            />
            <FormField
              label="Items Available"
              name="filters.itemsAvailable"
              register={register}
              errors={errors}
              placeholder="items available"
            />
            <FormField
              label="Products Page Title"
              name="filters.productsPageTitle"
              register={register}
              errors={errors}
              placeholder="All Products"
            />
          </Box>

          <Text marginBottom={3}>Quick Filters</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Shop All Button"
              name="filters.shopAllButton"
              register={register}
              errors={errors}
              placeholder="Shop All"
            />
            <FormField
              label="Quick Add Button"
              name="filters.quickAddButton"
              register={register}
              errors={errors}
              placeholder="Quick Add"
            />
            <FormField
              label="Scroll Left (aria)"
              name="filters.scrollLeftAriaLabel"
              register={register}
              errors={errors}
              placeholder="Scroll left"
            />
            <FormField
              label="Scroll Right (aria)"
              name="filters.scrollRightAriaLabel"
              register={register}
              errors={errors}
              placeholder="Scroll right"
            />
          </Box>

          <Text marginBottom={3}>Rating Filter</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Minimum Rating"
              name="filters.minimumRating"
              register={register}
              errors={errors}
              placeholder="Minimum Rating"
            />
            <FormField
              label="Stars & Up"
              name="filters.starsAndUp"
              register={register}
              errors={errors}
              placeholder="{count} stars & up"
            />
            <FormField
              label="Star & Up (singular)"
              name="filters.starAndUp"
              register={register}
              errors={errors}
              placeholder="1 star & up"
            />
            <FormField
              label="Clear Rating Filter"
              name="filters.clearRatingFilter"
              register={register}
              errors={errors}
              placeholder="Clear"
            />
          </Box>

          <Text marginBottom={3}>Price Filter</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Min Price Label"
              name="filters.minPriceLabel"
              register={register}
              errors={errors}
              placeholder="Min Price"
            />
            <FormField
              label="Max Price Label"
              name="filters.maxPriceLabel"
              register={register}
              errors={errors}
              placeholder="Max Price"
            />
            <FormField
              label="Quick Min Label"
              name="filters.quickMinLabel"
              register={register}
              errors={errors}
              placeholder="Quick Min"
            />
            <FormField
              label="Quick Max Label"
              name="filters.quickMaxLabel"
              register={register}
              errors={errors}
              placeholder="Quick Max"
            />
            <FormField
              label="Clear Price Filter"
              name="filters.clearPriceFilter"
              register={register}
              errors={errors}
              placeholder="Clear"
            />
            <FormField
              label="Discover Products"
              name="filters.discoverProducts"
              register={register}
              errors={errors}
              placeholder="Discover Products"
            />
            <FormField
              label="Check Out Our Products"
              name="filters.checkOutOurProducts"
              register={register}
              errors={errors}
              placeholder="Check Out Our Products"
            />
          </Box>
        </SectionCard>

        {/* Product Detail Page */}
        <SectionCard
          id="content-product-detail"
          title="Product Detail Page"
          description="Trust badges, tabs, and review form text"
          keywords={["product detail", "reviews", "tabs"]}
        >
          <Text marginBottom={3}>Trust Badges</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Free Shipping"
              name="productDetail.freeShipping"
              register={register}
              errors={errors}
              placeholder="Free Shipping"
            />
            <FormField
              label="Secure Payment"
              name="productDetail.securePayment"
              register={register}
              errors={errors}
              placeholder="Secure Payment"
            />
            <FormField
              label="Easy Returns"
              name="productDetail.easyReturns"
              register={register}
              errors={errors}
              placeholder="Easy Returns"
            />
          </Box>

          <Text marginBottom={3}>Tab Labels</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Description Tab"
              name="productDetail.descriptionTab"
              register={register}
              errors={errors}
              placeholder="Description"
            />
            <FormField
              label="Shipping Tab"
              name="productDetail.shippingTab"
              register={register}
              errors={errors}
              placeholder="Shipping"
            />
            <FormField
              label="Reviews Tab"
              name="productDetail.reviewsTab"
              register={register}
              errors={errors}
              placeholder="Reviews"
            />
            <FormField
              label="No Description Available"
              name="productDetail.noDescriptionAvailable"
              register={register}
              errors={errors}
              placeholder="No description available for this product."
            />
            <FormField
              label="Qty Label"
              name="productDetail.qtyLabel"
              register={register}
              errors={errors}
              placeholder="Qty"
            />
            <FormField
              label="Qty Label With Colon"
              name="productDetail.qtyLabelWithColon"
              register={register}
              errors={errors}
              placeholder="Qty:"
            />
            <FormField
              label="Share Button"
              name="productDetail.shareButton"
              register={register}
              errors={errors}
              placeholder="Share"
            />
          </Box>

          <Text marginBottom={3}>Variant Selection</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Color Label"
              name="productDetail.colorLabel"
              register={register}
              errors={errors}
              placeholder="Color"
            />
            <FormField
              label="Size Label"
              name="productDetail.sizeLabel"
              register={register}
              errors={errors}
              placeholder="Size"
            />
            <FormField
              label="Select Option Label"
              name="productDetail.selectOptionLabel"
              register={register}
              errors={errors}
              placeholder="Select Option"
            />
            <FormField
              label="Please Select Size"
              name="productDetail.pleaseSelectSize"
              register={register}
              errors={errors}
              placeholder="Please select a size"
            />
            <FormField
              label="Please Select Option"
              name="productDetail.pleaseSelectOption"
              register={register}
              errors={errors}
              placeholder="Please select an option"
            />
          </Box>

          <Text marginBottom={3}>Stock Messages</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Only X Left"
              name="productDetail.onlyXLeft"
              register={register}
              errors={errors}
              placeholder="Only {count} left!"
            />
            <FormField
              label="In Stock With Count"
              name="productDetail.inStockWithCount"
              register={register}
              errors={errors}
              placeholder="In Stock ({count} available)"
            />
            <FormField
              label="Selling Fast"
              name="productDetail.sellingFast"
              register={register}
              errors={errors}
              placeholder="Selling fast!"
            />
            <FormField
              label="Save Percent"
              name="productDetail.savePercent"
              register={register}
              errors={errors}
              placeholder="Save {percent}%"
            />
          </Box>

          <Text marginBottom={3}>Review Pluralization</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Review Singular"
              name="productDetail.reviewSingular"
              register={register}
              errors={errors}
              placeholder="review"
            />
            <FormField
              label="Review Plural"
              name="productDetail.reviewPlural"
              register={register}
              errors={errors}
              placeholder="reviews"
            />
          </Box>

          <Text marginBottom={3}>Image Gallery Labels</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Zoom In Label"
              name="productDetail.zoomInLabel"
              register={register}
              errors={errors}
              placeholder="Zoom in"
            />
            <FormField
              label="Zoom Out Label"
              name="productDetail.zoomOutLabel"
              register={register}
              errors={errors}
              placeholder="Zoom out"
            />
            <FormField
              label="Previous Image Label"
              name="productDetail.previousImageLabel"
              register={register}
              errors={errors}
              placeholder="Previous image"
            />
            <FormField
              label="Next Image Label"
              name="productDetail.nextImageLabel"
              register={register}
              errors={errors}
              placeholder="Next image"
            />
          </Box>

          <Text marginBottom={3}>Review Form</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="No Reviews Yet"
              name="productDetail.noReviewsYet"
              register={register}
              errors={errors}
              placeholder="No reviews yet. Be the first!"
            />
            <FormField
              label="Write Review Title"
              name="productDetail.writeReviewTitle"
              register={register}
              errors={errors}
              placeholder="Write a Review"
            />
            <FormField
              label="Rating Required"
              name="productDetail.ratingRequired"
              register={register}
              errors={errors}
              placeholder="Rating *"
            />
            <FormField
              label="Review Title Required"
              name="productDetail.reviewTitleRequired"
              register={register}
              errors={errors}
              placeholder="Review Title *"
            />
            <FormField
              label="Review Title Placeholder"
              name="productDetail.reviewTitlePlaceholder"
              register={register}
              errors={errors}
              placeholder="Summarize your review"
            />
            <FormField
              label="Review Required"
              name="productDetail.reviewRequired"
              register={register}
              errors={errors}
              placeholder="Review *"
            />
            <FormField
              label="Review Placeholder"
              name="productDetail.reviewPlaceholder"
              register={register}
              errors={errors}
              placeholder="Share your experience..."
            />
            <FormField
              label="Character Count"
              name="productDetail.characterCount"
              register={register}
              errors={errors}
              placeholder="{count} / 2000 characters"
            />
            <FormField
              label="Images Optional"
              name="productDetail.imagesOptional"
              register={register}
              errors={errors}
              placeholder="Images (Optional)"
            />
            <FormField
              label="Upload Images Hint"
              name="productDetail.uploadImagesHint"
              register={register}
              errors={errors}
              placeholder="Upload up to 5 images"
            />
            <FormField
              label="Submit Review Button"
              name="productDetail.submitReviewButton"
              register={register}
              errors={errors}
              placeholder="Submit Review"
            />
            <FormField
              label="Helpful Button"
              name="productDetail.helpfulButton"
              register={register}
              errors={errors}
              placeholder="Helpful"
            />
            <FormField
              label="Verified Purchase"
              name="productDetail.verifiedPurchase"
              register={register}
              errors={errors}
              placeholder="Verified Purchase"
            />
            <FormField
              label="Helpful Button With Count"
              name="productDetail.helpfulButtonWithCount"
              register={register}
              errors={errors}
              placeholder="Helpful ({count})"
            />
          </Box>

          <Text marginBottom={3}>Review Filters</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="All Ratings"
              name="productDetail.allRatings"
              register={register}
              errors={errors}
              placeholder="All Ratings"
            />
            <FormField
              label="Verified Only"
              name="productDetail.verifiedOnly"
              register={register}
              errors={errors}
              placeholder="Verified Only"
            />
          </Box>

          <Text marginBottom={3}>Review Delete Modal</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Delete Review Title"
              name="productDetail.deleteReviewTitle"
              register={register}
              errors={errors}
              placeholder="Delete Review"
            />
            <FormField
              label="Delete Review Message"
              name="productDetail.deleteReviewMessage"
              register={register}
              errors={errors}
              placeholder="Are you sure you want to delete this review? This action cannot be undone."
            />
            <FormField
              label="Cancel Button"
              name="productDetail.cancelButton"
              register={register}
              errors={errors}
              placeholder="Cancel"
            />
            <FormField
              label="Deleting Button"
              name="productDetail.deletingButton"
              register={register}
              errors={errors}
              placeholder="Deleting..."
            />
          </Box>

          <Text marginBottom={3}>Review Time Formatting</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Just Now"
              name="productDetail.justNow"
              register={register}
              errors={errors}
              placeholder="just now"
            />
            <FormField
              label="Minutes Ago"
              name="productDetail.minutesAgo"
              register={register}
              errors={errors}
              placeholder="{count} minutes ago"
            />
            <FormField
              label="Hours Ago"
              name="productDetail.hoursAgo"
              register={register}
              errors={errors}
              placeholder="{count} hours ago"
            />
            <FormField
              label="Days Ago"
              name="productDetail.daysAgo"
              register={register}
              errors={errors}
              placeholder="{count} days ago"
            />
          </Box>

          <Text marginBottom={3}>Shipping Information</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Free Standard Shipping Title"
              name="productDetail.freeStandardShippingTitle"
              register={register}
              errors={errors}
              placeholder="Free Standard Shipping"
            />
            <FormField
              label="Free Standard Shipping Description"
              name="productDetail.freeStandardShippingDescription"
              register={register}
              errors={errors}
              placeholder="On orders over $75. Delivery in 5-7 business days."
            />
            <FormField
              label="Express Shipping Title"
              name="productDetail.expressShippingTitle"
              register={register}
              errors={errors}
              placeholder="Express Shipping"
            />
            <FormField
              label="Express Shipping Description"
              name="productDetail.expressShippingDescription"
              register={register}
              errors={errors}
              placeholder="{price}. Delivery in 2-3 business days."
            />
          </Box>

          <Text marginBottom={3}>Review List and Loading States</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Loading Reviews"
              name="productDetail.loadingReviews"
              register={register}
              errors={errors}
              placeholder="Loading reviews..."
            />
            <FormField
              label="No Reviews Match Filters"
              name="productDetail.noReviewsMatchFilters"
              register={register}
              errors={errors}
              placeholder="No reviews match your filters."
            />
            <FormField
              label="Clear Filters"
              name="productDetail.clearFilters"
              register={register}
              errors={errors}
              placeholder="Clear Filters"
            />
            <FormField
              label="Clear Filters (Lowercase)"
              name="productDetail.clearFiltersLowercase"
              register={register}
              errors={errors}
              placeholder="Clear filters"
            />
            <FormField
              label="Try Again"
              name="productDetail.tryAgain"
              register={register}
              errors={errors}
              placeholder="Try again"
            />
            <FormField
              label="Failed To Load Reviews"
              name="productDetail.failedToLoadReviews"
              register={register}
              errors={errors}
              placeholder="Failed to load reviews. Please try again."
            />
            <FormField
              label="Load More Reviews"
              name="productDetail.loadMoreReviews"
              register={register}
              errors={errors}
              placeholder="Load More Reviews"
            />
          </Box>

          <Text marginBottom={3}>Review Form Labels (Edit Form)</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Rating Label"
              name="productDetail.ratingLabel"
              register={register}
              errors={errors}
              placeholder="Rating"
            />
            <FormField
              label="Title Label"
              name="productDetail.titleLabel"
              register={register}
              errors={errors}
              placeholder="Title"
            />
            <FormField
              label="Review Label"
              name="productDetail.reviewLabel"
              register={register}
              errors={errors}
              placeholder="Review"
            />
          </Box>

          <Text marginBottom={3}>Review Form States and Messages</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Uploading Images"
              name="productDetail.uploadingImages"
              register={register}
              errors={errors}
              placeholder="Uploading and compressing images..."
            />
            <FormField
              label="Saving Button"
              name="productDetail.savingButton"
              register={register}
              errors={errors}
              placeholder="Saving..."
            />
            <FormField
              label="Save Button"
              name="productDetail.saveButton"
              register={register}
              errors={errors}
              placeholder="Save"
            />
            <FormField
              label="Submitting Button"
              name="productDetail.submittingButton"
              register={register}
              errors={errors}
              placeholder="Submitting..."
            />
            <FormField
              label="Thank You Message"
              name="productDetail.thankYouMessage"
              register={register}
              errors={errors}
              placeholder="Thank you for your review!"
            />
            <FormField
              label="Review Submitted Message"
              name="productDetail.reviewSubmittedMessage"
              register={register}
              errors={errors}
              placeholder="Your review has been submitted and will be visible after moderation."
            />
          </Box>

          <Text marginBottom={3}>Review Form Validation Messages</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Please Select Rating"
              name="productDetail.pleaseSelectRating"
              register={register}
              errors={errors}
              placeholder="Please select a rating"
            />
            <FormField
              label="Please Enter Review Title"
              name="productDetail.pleaseEnterReviewTitle"
              register={register}
              errors={errors}
              placeholder="Please enter a review title"
            />
            <FormField
              label="Please Enter Review Body"
              name="productDetail.pleaseEnterReviewBody"
              register={register}
              errors={errors}
              placeholder="Please enter a review body"
            />
            <FormField
              label="Max Images Error"
              name="productDetail.maxImagesError"
              register={register}
              errors={errors}
              placeholder="Maximum 5 images allowed per review"
            />
            <FormField
              label="Only X More Images Error"
              name="productDetail.onlyXMoreImagesError"
              register={register}
              errors={errors}
              placeholder="Only {count} more image(s) can be uploaded (max 5 total)"
            />
            <FormField
              label="Failed To Submit Review"
              name="productDetail.failedToSubmitReview"
              register={register}
              errors={errors}
              placeholder="Failed to submit review"
            />
            <FormField
              label="Failed To Submit Review Retry"
              name="productDetail.failedToSubmitReviewRetry"
              register={register}
              errors={errors}
              placeholder="Failed to submit review. Please try again."
            />
            <FormField
              label="Must Be Logged In To Review"
              name="productDetail.mustBeLoggedInToReview"
              register={register}
              errors={errors}
              placeholder="You must be logged in to submit a review. Please log in and try again."
            />
            <FormField
              label="Failed To Update Review"
              name="productDetail.failedToUpdateReview"
              register={register}
              errors={errors}
              placeholder="Failed to update review"
            />
            <FormField
              label="Failed To Delete Review"
              name="productDetail.failedToDeleteReview"
              register={register}
              errors={errors}
              placeholder="Failed to delete review"
            />
            <FormField
              label="Failed To Upload Images"
              name="productDetail.failedToUploadImages"
              register={register}
              errors={errors}
              placeholder="Failed to upload images"
            />
          </Box>
        </SectionCard>

        {/* Dashboard */}
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

        {/* Orders */}
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

        {/* Order Tracking */}
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

        {/* Contact Page */}
        <SectionCard
          id="content-contact"
          title="Contact Page"
          description="Text for the contact page including form labels, placeholders, and messages"
          keywords={["contact", "form", "message", "faq", "follow us"]}
          icon="📧"
        >
          <Text marginTop={6} marginBottom={3}>
            Hero Section
          </Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Hero Title"
              name="contact.heroTitle"
              register={register}
              errors={errors}
              placeholder="Get in Touch"
            />
            <FormField
              label="Hero Description"
              name="contact.heroDescription"
              register={register}
              errors={errors}
              placeholder="Have a question or need help? We're here for you. Reach out through any of the channels below or fill out the contact form."
            />
          </Box>

          <Text marginTop={6} marginBottom={3}>
            Contact Method Labels
          </Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Email Label"
              name="contact.emailLabel"
              register={register}
              errors={errors}
              placeholder="Email"
              description="Label for email contact method"
            />
            <FormField
              label="Phone Label"
              name="contact.phoneLabel"
              register={register}
              errors={errors}
              placeholder="Phone"
              description="Label for phone contact method"
            />
            <FormField
              label="Address Label"
              name="contact.addressLabel"
              register={register}
              errors={errors}
              placeholder="Address"
              description="Label for address contact method"
            />
          </Box>

          <Text marginTop={6} marginBottom={3}>
            Contact Form
          </Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Form Title"
              name="contact.formTitle"
              register={register}
              errors={errors}
              placeholder="Send Us a Message"
            />
            <FormField
              label="Form Description"
              name="contact.formDescription"
              register={register}
              errors={errors}
              placeholder="We'll get back to you within 24 hours."
            />
            <FormField
              label="Name Label"
              name="contact.nameLabel"
              register={register}
              errors={errors}
              placeholder="Your Name"
            />
            <FormField
              label="Name Placeholder"
              name="contact.namePlaceholder"
              register={register}
              errors={errors}
              placeholder="John Doe"
            />
            <FormField
              label="Email Label (Form)"
              name="contact.emailLabelForm"
              register={register}
              errors={errors}
              placeholder="Email Address"
              description="Label for email field in contact form"
            />
            <FormField
              label="Email Placeholder"
              name="contact.emailPlaceholder"
              register={register}
              errors={errors}
              placeholder="john@example.com"
            />
            <FormField
              label="Subject Label"
              name="contact.subjectLabel"
              register={register}
              errors={errors}
              placeholder="Subject"
            />
            <FormField
              label="Subject Placeholder"
              name="contact.subjectPlaceholder"
              register={register}
              errors={errors}
              placeholder="How can we help?"
            />
            <FormField
              label="Message Label"
              name="contact.messageLabel"
              register={register}
              errors={errors}
              placeholder="Message"
            />
            <FormField
              label="Message Placeholder"
              name="contact.messagePlaceholder"
              register={register}
              errors={errors}
              placeholder="Tell us more about your inquiry..."
            />
            <FormField
              label="Send Button"
              name="contact.sendButton"
              register={register}
              errors={errors}
              placeholder="Send Message"
            />
            <FormField
              label="Sending Button (Loading)"
              name="contact.sendingButton"
              register={register}
              errors={errors}
              placeholder="Sending..."
            />
          </Box>

          <Text marginTop={6} marginBottom={3}>
            Success Message
          </Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Success Title"
              name="contact.successTitle"
              register={register}
              errors={errors}
              placeholder="Message Sent!"
            />
            <FormField
              label="Success Description"
              name="contact.successDescription"
              register={register}
              errors={errors}
              placeholder="Thank you for reaching out. We'll be in touch soon."
            />
            <FormField
              label="Send Another Message Link"
              name="contact.sendAnotherMessage"
              register={register}
              errors={errors}
              placeholder="Send another message"
            />
          </Box>

          <Text marginTop={6} marginBottom={3}>
            FAQs Section
          </Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="FAQs Title"
              name="contact.faqsTitle"
              register={register}
              errors={errors}
              placeholder="Frequently Asked Questions"
            />
            <FormField
              label="FAQs Description"
              name="contact.faqsDescription"
              register={register}
              errors={errors}
              placeholder="Find quick answers to common questions."
            />
            <FormField
              label="View All FAQs Link"
              name="contact.viewAllFaqs"
              register={register}
              errors={errors}
              placeholder="View All FAQs"
            />
          </Box>

          <Text marginTop={6} marginBottom={3}>
            FAQ Items
          </Text>
          <Box marginBottom={6}>
            {faqFields.map((field, index) => (
              <Box
                key={field.id}
                marginBottom={4}
                padding={4}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  backgroundColor: "#f9fafb",
                }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  marginBottom={3}
                >
                  <Text>FAQ #{index + 1}</Text>
                  <Button
                    type="button"
                    variant="tertiary"
                    onClick={() => removeFaq(index)}
                    style={{ color: "#dc2626" }}
                  >
                    Remove
                  </Button>
                </Box>
                <Box display="grid" __gridTemplateColumns="1fr" gap={4}>
                  <FormField
                    label="Question"
                    name={`contact.faqs.${index}.question`}
                    register={register}
                    errors={errors}
                    placeholder="What are your shipping times?"
                  />
                  <FormField
                    label="Answer"
                    name={`contact.faqs.${index}.answer`}
                    register={register}
                    errors={errors}
                    placeholder="Most orders ship within 24 hours. Standard delivery takes 3-5 business days..."
                  />
                </Box>
              </Box>
            ))}
            <Button
              type="button"
              variant="secondary"
              onClick={() => addFaq({ question: "", answer: "" })}
            >
              Add FAQ
            </Button>
          </Box>

          <Text marginTop={6} marginBottom={3}>
            Social Section
          </Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Follow Us Title"
              name="contact.followUsTitle"
              register={register}
              errors={errors}
              placeholder="Follow Us"
            />
            <FormField
              label="Follow Us Description"
              name="contact.followUsDescription"
              register={register}
              errors={errors}
              placeholder="Stay connected for updates, tips, and exclusive offers."
            />
          </Box>
        </SectionCard>

        {/* Addresses */}
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

        {/* Wishlist */}
        <SectionCard
          id="content-wishlist"
          title="Wishlist Page"
          description="Wishlist page text"
          keywords={["wishlist", "saved"]}
        >
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="My Wishlist Title"
              name="wishlist.myWishlistTitle"
              register={register}
              errors={errors}
              placeholder="My Wishlist"
            />
            <FormField
              label="Items Count"
              name="wishlist.itemsCount"
              register={register}
              errors={errors}
              placeholder="{count} item(s) saved"
            />
            <FormField
              label="Loading Wishlist"
              name="wishlist.loadingWishlist"
              register={register}
              errors={errors}
              placeholder="Loading wishlist..."
            />
            <FormField
              label="Empty Wishlist Title"
              name="wishlist.emptyWishlistTitle"
              register={register}
              errors={errors}
              placeholder="Your wishlist is empty"
            />
            <FormField
              label="Empty Wishlist Message"
              name="wishlist.emptyWishlistMessage"
              register={register}
              errors={errors}
              placeholder="Save items you love..."
            />
            <FormField
              label="Discover Products Button"
              name="wishlist.discoverProductsButton"
              register={register}
              errors={errors}
              placeholder="Discover Products"
            />
            <FormField
              label="Clear All Button"
              name="wishlist.clearAllButton"
              register={register}
              errors={errors}
              placeholder="Clear All"
            />
            <FormField
              label="Items Saved"
              name="wishlist.itemsSaved"
              register={register}
              errors={errors}
              placeholder="{count} item(s) saved"
            />
            <FormField
              label="View Product"
              name="wishlist.viewProduct"
              register={register}
              errors={errors}
              placeholder="View Product"
            />
            <FormField
              label="Out of Stock"
              name="wishlist.outOfStock"
              register={register}
              errors={errors}
              placeholder="Out of Stock"
            />
            <FormField
              label="Added On"
              name="wishlist.addedOn"
              register={register}
              errors={errors}
              placeholder="Added {date}"
            />
            <FormField
              label="Remove From Wishlist"
              name="wishlist.removeFromWishlist"
              register={register}
              errors={errors}
              placeholder="Remove"
            />
            <FormField
              label="Remove From Wishlist Tooltip"
              name="wishlist.removeFromWishlistTooltip"
              register={register}
              errors={errors}
              placeholder="Remove from wishlist"
            />
            <FormField
              label="Move to Cart"
              name="wishlist.moveToCart"
              register={register}
              errors={errors}
              placeholder="Add to Cart"
            />
          </Box>
        </SectionCard>

        {/* Settings */}
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

        {/* Footer */}
        <SectionCard
          id="content-footer"
          title="Footer"
          description="Footer text and legal links"
          keywords={["footer", "links", "legal"]}
        >
          <Text marginBottom={3}>Legal Links</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Privacy Policy Link"
              name="footer.privacyPolicyLink"
              register={register}
              errors={errors}
              placeholder="Privacy Policy"
            />
            <FormField
              label="Terms of Service Link"
              name="footer.termsOfServiceLink"
              register={register}
              errors={errors}
              placeholder="Terms of Service"
            />
            <FormField
              label="Shipping Link"
              name="footer.shippingLink"
              register={register}
              errors={errors}
              placeholder="Shipping"
            />
            <FormField
              label="Return Policy Link"
              name="footer.returnPolicyLink"
              register={register}
              errors={errors}
              placeholder="Return Policy"
            />
          </Box>

          <Text marginBottom={3}>Footer Text</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="All Rights Reserved"
              name="footer.allRightsReserved"
              register={register}
              errors={errors}
              placeholder="All rights reserved"
            />
            <FormField
              label="Contact Us"
              name="footer.contactUs"
              register={register}
              errors={errors}
              placeholder="Contact Us"
            />
            <FormField
              label="Customer Service"
              name="footer.customerService"
              register={register}
              errors={errors}
              placeholder="Customer Service"
            />
          </Box>

          <Text marginBottom={3}>Section Titles</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr 1fr" gap={4}>
            <FormField
              label="Shop Title"
              name="footer.shopTitle"
              register={register}
              errors={errors}
              placeholder="Shop"
            />
            <FormField
              label="Company Title"
              name="footer.companyTitle"
              register={register}
              errors={errors}
              placeholder="Company"
            />
            <FormField
              label="Support Title"
              name="footer.supportTitle"
              register={register}
              errors={errors}
              placeholder="Support"
            />
            <FormField
              label="Follow Us Title"
              name="footer.followUsTitle"
              register={register}
              errors={errors}
              placeholder="Follow Us"
            />
            <FormField
              label="Track Order Link"
              name="footer.trackOrderLink"
              register={register}
              errors={errors}
              placeholder="Track Order"
            />
          </Box>
        </SectionCard>

        {/* Navbar */}
        <SectionCard
          id="content-navbar"
          title="Navbar"
          description="Navigation bar text"
          keywords={["navbar", "menu", "navigation"]}
          icon="🧭"
        >
          <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4}>
            <FormField
              label="Select Channel"
              name="navbar.selectChannel"
              register={register}
              errors={errors}
              placeholder="Select channel/currency"
            />
            <FormField
              label="Search Placeholder"
              name="navbar.searchPlaceholder"
              register={register}
              errors={errors}
              placeholder="Search..."
              description="Placeholder for the navbar search input"
            />
            <FormField
              label="Search Clear Aria Label"
              name="navbar.searchClearAriaLabel"
              register={register}
              errors={errors}
              placeholder="Clear search"
              description="Accessibility label for the navbar search clear button"
            />
            <FormField
              label="Search Input Aria Label"
              name="navbar.searchInputAriaLabel"
              register={register}
              errors={errors}
              placeholder="Search products"
              description="Accessibility label for the navbar search input"
            />
            <FormField
              label="View All Results For"
              name="navbar.viewAllResultsFor"
              register={register}
              errors={errors}
              placeholder="View all results for"
            />
            <FormField
              label="Recently Searched Label"
              name="navbar.recentlySearchedLabel"
              register={register}
              errors={errors}
              placeholder="Recent Searches"
            />
            <FormField
              label="Recent Searches Clear Label"
              name="navbar.recentSearchesClearLabel"
              register={register}
              errors={errors}
              placeholder="Clear"
            />
            <FormField
              label="Cart Label"
              name="navbar.cartLabel"
              register={register}
              errors={errors}
              placeholder="Cart"
            />
            <FormField
              label="Account Label"
              name="navbar.accountLabel"
              register={register}
              errors={errors}
              placeholder="Account"
            />
            <FormField
              label="Menu Label"
              name="navbar.menuLabel"
              register={register}
              errors={errors}
              placeholder="Menu"
            />
            <FormField
              label="Home Label"
              name="navbar.homeLabel"
              register={register}
              errors={errors}
              placeholder="Home"
            />
            <FormField
              label="Shop Label"
              name="navbar.shopLabel"
              register={register}
              errors={errors}
              placeholder="Shop"
            />
            <FormField
              label="Sign In Text"
              name="navbar.signInText"
              register={register}
              errors={errors}
              placeholder="Sign In"
              description="Text for the sign in button in navbar"
            />
            <FormField
              label="Shop All Button"
              name="navbar.shopAllButton"
              register={register}
              errors={errors}
              placeholder="Shop All"
              description="Text for the Shop All dropdown button"
            />
            <FormField
              label="Sale Button"
              name="navbar.saleButton"
              register={register}
              errors={errors}
              placeholder="Sale"
              description="Text for the Sale button"
            />
            <FormField
              label="Collections Label"
              name="navbar.collectionsLabel"
              register={register}
              errors={errors}
              placeholder="Collections"
              description="Label for Collections section in dropdown"
            />
            <FormField
              label="Brands Label"
              name="navbar.brandsLabel"
              register={register}
              errors={errors}
              placeholder="Brands"
              description="Label for Brands section in dropdown"
            />
            <FormField
              label="Categories Label"
              name="navbar.categoriesLabel"
              register={register}
              errors={errors}
              placeholder="Categories"
              description="Label for Categories section in dropdown"
            />
            <FormField
              label="View All Products"
              name="navbar.viewAllProducts"
              register={register}
              errors={errors}
              placeholder="View All Products"
              description="Text for View All Products link in dropdown"
            />
            <SelectField
              label="Subcategories Side"
              name="navbar.subcategoriesSide"
              register={register}
              options={[
                { value: "auto", label: "Auto (based on RTL/LTR)" },
                { value: "left", label: "Left" },
                { value: "right", label: "Right" },
              ]}
              description="Which side subcategories dropdown appears on"
            />
            <SelectField
              label="Mobile Nav Position"
              name="navbar.mobileNavPosition"
              register={register}
              options={[
                { value: "right", label: "Right" },
                { value: "left", label: "Left" },
              ]}
              description="Which side of the screen the mobile menu drawer opens from"
            />
            <SelectField
              label="Dropdown Arrow Direction (when collapsed)"
              name="navbar.dropdownArrowDirection"
              register={register}
              options={[
                { value: "auto", label: "Auto (based on RTL/LTR)" },
                { value: "up", label: "Point up" },
                { value: "down", label: "Point down" },
                { value: "left", label: "Point left" },
                { value: "right", label: "Point right" },
              ]}
              description="Which way arrows point when the dropdown/section is closed"
            />
            <SelectField
              label="Dropdown Arrow Direction (when expanded)"
              name="navbar.dropdownArrowDirectionExpanded"
              register={register}
              options={[
                { value: "auto", label: "Auto (down when expanded)" },
                { value: "up", label: "Point up" },
                { value: "down", label: "Point down" },
                { value: "left", label: "Point left" },
                { value: "right", label: "Point right" },
              ]}
              description="Which way arrows point when the dropdown/section is open"
            />
          </Box>
        </SectionCard>

        {/* Error Page */}
        <SectionCard
          id="content-error"
          title="Error Page"
          description="Error page text shown when something goes wrong"
          keywords={["error", "empty state"]}
        >
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Title"
              name="error.title"
              register={register}
              errors={errors}
              placeholder="Something went wrong"
            />
            <FormField
              label="Description"
              name="error.description"
              register={register}
              errors={errors}
              placeholder="We're sorry, but something unexpected happened. Please try again or contact support if the problem persists."
            />
            <FormField
              label="Error Details Label"
              name="error.errorDetails"
              register={register}
              errors={errors}
              placeholder="Error details"
            />
            <FormField
              label="Try Again Button"
              name="error.tryAgainButton"
              register={register}
              errors={errors}
              placeholder="Try Again"
            />
            <FormField
              label="Back to Home Button"
              name="error.backToHomeButton"
              register={register}
              errors={errors}
              placeholder="Back to Home"
            />
            <FormField
              label="Need Help Text"
              name="error.needHelpText"
              register={register}
              errors={errors}
              placeholder="Need help?"
            />
            <FormField
              label="Contact Support Link"
              name="error.contactSupportLink"
              register={register}
              errors={errors}
              placeholder="Contact our support team"
            />
          </Box>
        </SectionCard>

        {/* 404 Not Found Page */}
        <SectionCard
          id="content-404"
          title="404 Not Found Page"
          description="404 page text shown when a page is not found"
          keywords={["404", "not found"]}
          icon="🔍"
        >
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Title"
              name="notFound.title"
              register={register}
              errors={errors}
              placeholder="Page Not Found"
            />
            <FormField
              label="Description"
              name="notFound.description"
              register={register}
              errors={errors}
              placeholder="Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist."
            />
            <FormField
              label="Back to Home Button"
              name="notFound.backToHomeButton"
              register={register}
              errors={errors}
              placeholder="Back to Home"
            />
            <FormField
              label="Browse Products Button"
              name="notFound.browseProductsButton"
              register={register}
              errors={errors}
              placeholder="Browse Products"
            />
            <FormField
              label="Helpful Links Text"
              name="notFound.helpfulLinksText"
              register={register}
              errors={errors}
              placeholder="Or check out these pages:"
            />
          </Box>
        </SectionCard>

        <StickySaveBar
          isDirty={isDirty}
          isLoading={saveStatus === "saving"}
          isSuccess={saveStatus === "success"}
          isError={saveStatus === "error"}
          onReset={() => reset(config?.content)}
          onSubmit={handleSubmit(onSubmit)}
        />
      </form>
    </AppLayout>
  );
};

export async function getServerSideProps() {
  return { props: {} };
}

export default ContentPage;
