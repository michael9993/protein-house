import { BaseError } from "@/lib/errors";

export const PayPalApiError = BaseError.subclass("PayPalApiError", {
  props: {
    publicCode: "PAYPAL_ERROR" as string,
    publicMessage: "An error occurred with PayPal" as string,
  },
});

export type PayPalApiError = InstanceType<typeof PayPalApiError>;
