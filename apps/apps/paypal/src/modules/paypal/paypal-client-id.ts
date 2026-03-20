import { fromThrowable } from "neverthrow";
import { z } from "zod";

import { BaseError } from "@/lib/errors";

const paypalClientIdSchema = z.string().min(1).brand("PayPalClientId");

export type PayPalClientId = z.infer<typeof paypalClientIdSchema>;

export const PayPalClientIdValidationError = BaseError.subclass("PayPalClientIdValidationError", {
  props: { _internalName: "PayPalClientId.ValidationError" as const },
});

export const createPayPalClientId = (raw: string) =>
  fromThrowable(paypalClientIdSchema.parse, (error) =>
    PayPalClientIdValidationError.normalize(error),
  )(raw);
