import { z } from "zod";

export const FeaturesSchema = z.object({
  wishlist: z.boolean(),
  compareProducts: z.boolean(),
  productReviews: z.boolean(),
  recentlyViewed: z.boolean(),
  scrollToTop: z.boolean(),
  guestCheckout: z.boolean(),
  expressCheckout: z.boolean(),
  savePaymentMethods: z.boolean(),
  digitalDownloads: z.boolean(),
  subscriptions: z.boolean(),
  giftCards: z.boolean(),
  productBundles: z.boolean(),
  newsletter: z.boolean(),
  promotionalBanners: z.boolean(),
  abandonedCartEmails: z.boolean(),
  socialLogin: z.boolean(),
  shareButtons: z.boolean(),
  instagramFeed: z.boolean(),
  relatedProducts: z.boolean(),
});
