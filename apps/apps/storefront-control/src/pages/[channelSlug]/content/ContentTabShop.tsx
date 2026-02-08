import { Box, Text } from "@saleor/macaw-ui";
import { SectionCard } from "@/modules/ui/section-card";
import { FormField } from "@/modules/ui/form-field";
import type { ContentTabProps } from "./types";

export function ContentTabShop({ register, errors, control }: ContentTabProps) {
  return (
    <>
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
          <FormField
            label="Quick Add Button"
            name="product.quickAddButton"
            register={register}
            errors={errors}
            placeholder="Quick add"
          />
          <FormField
            label="View Full Page Link"
            name="product.viewFullPageLink"
            register={register}
            errors={errors}
            placeholder="View full page"
          />
          <FormField
            label="Loading Product (Quick View)"
            name="product.loadingProductText"
            register={register}
            errors={errors}
            placeholder="Loading product..."
          />
          <FormField
            label="Product Details (Quick View title)"
            name="product.productDetailsTitle"
            register={register}
            errors={errors}
            placeholder="Product Details"
          />
          <FormField
            label="Close Button (Quick View)"
            name="product.closeButton"
            register={register}
            errors={errors}
            placeholder="Close"
          />
          <FormField
            label="Product Not Found (Quick View)"
            name="product.productNotFoundText"
            register={register}
            errors={errors}
            placeholder="Product not found"
          />
          <FormField
            label="Error Loading Product (Quick View)"
            name="product.errorLoadingProductText"
            register={register}
            errors={errors}
            placeholder="Failed to load product"
          />
        </Box>
      </SectionCard>

    </>
  );
}

