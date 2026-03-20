import { fromThrowable } from "neverthrow";
import { z } from "zod";

import { BaseError } from "@/lib/errors";

const paypalOrderIdSchema = z.string().min(1).brand("PayPalOrderId");

export type PayPalOrderId = z.infer<typeof paypalOrderIdSchema>;

export const PayPalOrderIdValidationError = BaseError.subclass("PayPalOrderIdValidationError", {
  props: { _internalName: "PayPalOrderId.ValidationError" as const },
});

export const createPayPalOrderId = (raw: string) =>
  fromThrowable(paypalOrderIdSchema.parse, (error) =>
    PayPalOrderIdValidationError.normalize(error),
  )(raw);
