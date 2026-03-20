import { fromThrowable } from "neverthrow";
import { z } from "zod";

import { BaseError } from "@/lib/errors";

const paypalClientSecretSchema = z.string().min(1).brand("PayPalClientSecret");

export type PayPalClientSecret = z.infer<typeof paypalClientSecretSchema>;

export const PayPalClientSecretValidationError = BaseError.subclass(
  "PayPalClientSecretValidationError",
  {
    props: { _internalName: "PayPalClientSecret.ValidationError" as const },
  },
);

export const createPayPalClientSecret = (raw: string) =>
  fromThrowable(paypalClientSecretSchema.parse, (error) =>
    PayPalClientSecretValidationError.normalize(error),
  )(raw);
