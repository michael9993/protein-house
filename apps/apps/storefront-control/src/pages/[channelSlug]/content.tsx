import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text, Button } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";

import { AppLayout } from "@/modules/ui/app-layout";
import { SectionCard } from "@/modules/ui/section-card";
import { FormField } from "@/modules/ui/form-field";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { ContentSchema } from "@/modules/config/schema";
import type { StorefrontConfig } from "@/modules/config/schema";

type ContentFormData = StorefrontConfig["content"];

const ContentPage: NextPage = () => {
  const router = useRouter();
  const { channelSlug } = router.query as { channelSlug: string };
  const { appBridgeState } = useAppBridge();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const { data: config, isLoading, refetch } = trpcClient.config.getConfig.useQuery(
    { channelSlug },
    { enabled: !!channelSlug && !!appBridgeState?.ready }
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
    formState: { errors, isDirty },
  } = useForm<ContentFormData>({
    resolver: zodResolver(ContentSchema),
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
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Text>Loading...</Text>
      </Box>
    );
  }

  return (
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="content">
      <form onSubmit={handleSubmit(onSubmit)}>
        <SectionCard title="Cart Page" description="Text shown on the cart page">
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

          <Text variant="bodyStrong" marginBottom={3}>Promo Code Section</Text>
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
          </Box>

          <Text variant="bodyStrong" marginBottom={3}>Order Summary</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Subtotal Label"
              name="cart.subtotalLabel"
              register={register}
              errors={errors}
              placeholder="Subtotal"
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

          <Text variant="bodyStrong" marginBottom={3}>Checkout Button States</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Trust Badges</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Payment Methods</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Saved For Later</Text>
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
        <SectionCard title="Product Page" description="Text shown on product detail pages">
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
        <SectionCard title="Account Pages" description="Text for authentication and account pages">
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

        {/* General Text - matches GeneralTextSchema */}
        <SectionCard title="General" description="Common text used throughout the store">
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
        <SectionCard title="Homepage Sections" description="Text for homepage section headings">
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
              label="Shop Now Button"
              name="homepage.shopNowButton"
              register={register}
              errors={errors}
              placeholder="Shop Now"
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
        <SectionCard title="Checkout" description="Text for checkout process">
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            <FormField
              label="Secure Checkout"
              name="checkout.secureCheckout"
              register={register}
              errors={errors}
              placeholder="Secure Checkout"
            />
            <FormField
              label="Contact Details"
              name="checkout.contactDetails"
              register={register}
              errors={errors}
              placeholder="Contact Details"
            />
            <FormField
              label="Shipping Address"
              name="checkout.shippingAddress"
              register={register}
              errors={errors}
              placeholder="Shipping Address"
            />
            <FormField
              label="Shipping Method"
              name="checkout.shippingMethod"
              register={register}
              errors={errors}
              placeholder="Shipping Method"
            />
            <FormField
              label="Payment Method"
              name="checkout.paymentMethod"
              register={register}
              errors={errors}
              placeholder="Payment Method"
            />
            <FormField
              label="Order Summary"
              name="checkout.orderSummary"
              register={register}
              errors={errors}
              placeholder="Order Summary"
            />
            <FormField
              label="Place Order Button"
              name="checkout.placeOrder"
              register={register}
              errors={errors}
              placeholder="Place Order"
            />
            <FormField
              label="Order Confirmation Title"
              name="checkout.orderConfirmation"
              register={register}
              errors={errors}
              placeholder="Order Confirmed!"
            />
            <FormField
              label="Thank You Title"
              name="checkout.thankYouTitle"
              register={register}
              errors={errors}
              placeholder="Thank you for your order!"
            />
            <FormField
              label="Thank You Message"
              name="checkout.thankYouMessage"
              register={register}
              errors={errors}
              placeholder="We've received your order and will send you a confirmation email shortly."
            />
            <FormField
              label="Privacy Policy Link Text"
              name="checkout.privacyPolicyLinkText"
              register={register}
              errors={errors}
              placeholder="Privacy Policy"
            />
            <FormField
              label="Terms of Service Link Text"
              name="checkout.termsOfServiceLinkText"
              register={register}
              errors={errors}
              placeholder="Terms of Service"
            />
            <FormField
              label="SSL Encryption Message"
              name="checkout.sslEncryptionMessage"
              register={register}
              errors={errors}
              placeholder="Protected by SSL encryption • Your payment info is safe"
            />
          </Box>
        </SectionCard>

        {/* Filters Text - matches FiltersTextSchema */}
        <SectionCard title="Filters & Product List" description="Text for filters, sorting, and product list pages">
          <Text variant="bodyStrong" marginBottom={3}>Section Titles</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Filter Headings</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Availability Options</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Active Filters Labels</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Sort Options</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Empty & Loading States</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Search & Results</Text>
          <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4} marginBottom={6}>
            <FormField
              label="Search Placeholder"
              name="filters.searchPlaceholder"
              register={register}
              errors={errors}
              placeholder="Search Products"
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

          <Text variant="bodyStrong" marginBottom={3}>Quick Filters</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Rating Filter</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Price Filter</Text>
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
        <SectionCard title="Product Detail Page" description="Trust badges, tabs, and review form text">
          <Text variant="bodyStrong" marginBottom={3}>Trust Badges</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Tab Labels</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Variant Selection</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Stock Messages</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Review Pluralization</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Image Gallery Labels</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Review Form</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Review Filters</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Review Delete Modal</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Review Time Formatting</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Shipping Information</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Review List and Loading States</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Review Form Labels (Edit Form)</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Review Form States and Messages</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Review Form Validation Messages</Text>
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
        <SectionCard title="Dashboard" description="Account dashboard text">
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
        <SectionCard title="Orders Page" description="Orders list and detail text">
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
        </SectionCard>

        {/* Addresses */}
        <SectionCard title="Addresses Page" description="Address management text">
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
        <SectionCard title="Wishlist Page" description="Wishlist page text">
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
        <SectionCard title="Settings Page" description="Account settings page text">
          <Text variant="bodyStrong" marginBottom={3}>Page Header</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Profile Section</Text>
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
          </Box>

          <Text variant="bodyStrong" marginBottom={3}>Password Section</Text>
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
          </Box>

          <Text variant="bodyStrong" marginBottom={3}>Notifications Section</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Danger Zone</Text>
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
        <SectionCard title="Footer" description="Footer text and legal links">
          <Text variant="bodyStrong" marginBottom={3}>Legal Links</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Footer Text</Text>
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

          <Text variant="bodyStrong" marginBottom={3}>Section Titles</Text>
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
          </Box>
        </SectionCard>

        {/* Navbar */}
        <SectionCard title="Navbar" description="Navigation bar text">
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
          </Box>
        </SectionCard>

        {/* Error Page */}
        <SectionCard title="Error Page" description="Error page text shown when something goes wrong">
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
        <SectionCard title="404 Not Found Page" description="404 page text shown when a page is not found">
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

        {/* Submit */}
        <Box display="flex" justifyContent="flex-end" gap={4} marginTop={6}>
          <Button
            type="button"
            variant="tertiary"
            onClick={() => reset(config?.content)}
            disabled={!isDirty}
          >
            Reset
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!isDirty || saveStatus === "saving"}
          >
            {saveStatus === "saving" ? "Saving..." : "Save Changes"}
          </Button>
        </Box>

        {/* Status Messages */}
        {saveStatus === "success" && (
          <Text color="success1" marginTop={2}>
            Changes saved successfully
          </Text>
        )}
        {saveStatus === "error" && (
          <Text color="critical1" marginTop={2}>
            Error saving changes. Please try again.
          </Text>
        )}
      </form>
    </AppLayout>
  );
};

export default ContentPage;
