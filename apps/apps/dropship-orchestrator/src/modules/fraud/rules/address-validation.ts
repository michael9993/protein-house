import { createLogger } from "@/logger";

import type { FraudConfig, FraudFlag } from "../types";

const logger = createLogger("fraud-rule:address-validation");

// ---------------------------------------------------------------------------
// Address shape (lightweight — matches the supplier Address type)
// ---------------------------------------------------------------------------

export interface AddressForValidation {
  name: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

// ---------------------------------------------------------------------------
// Required fields per country (ISO 3166-1 alpha-2)
// ---------------------------------------------------------------------------

/**
 * Maps country codes to the address fields that must be non-empty.
 * Every country at minimum requires name, street, city, and country.
 * Specific countries add additional requirements.
 */
const REQUIRED_FIELDS_BY_COUNTRY: Record<string, (keyof AddressForValidation)[]> = {
  // Default — applied when a country has no specific overrides
  _default: ["name", "street", "city", "country"],

  // Countries that also require postal code
  US: ["name", "street", "city", "postalCode", "country"],
  CA: ["name", "street", "city", "postalCode", "country"],
  GB: ["name", "street", "city", "postalCode", "country"],
  DE: ["name", "street", "city", "postalCode", "country"],
  FR: ["name", "street", "city", "postalCode", "country"],
  AU: ["name", "street", "city", "postalCode", "country"],
  JP: ["name", "street", "city", "postalCode", "country"],
  IL: ["name", "street", "city", "postalCode", "country"],
  CN: ["name", "street", "city", "postalCode", "country", "phone"],
};

// ---------------------------------------------------------------------------
// Billing / Shipping Country Mismatch
// ---------------------------------------------------------------------------

/**
 * Flag when the billing country differs from the shipping country.
 * Severity depends on the `billingShippingMismatchBlocking` config flag:
 *   - blocking = true  → "high" severity
 *   - blocking = false → "medium" severity (informational)
 */
export function checkAddressMismatch(
  billingCountry: string,
  shippingCountry: string,
  config: FraudConfig,
): FraudFlag | null {
  const billing = billingCountry.toUpperCase().trim();
  const shipping = shippingCountry.toUpperCase().trim();

  if (billing === shipping) {
    return null;
  }

  const severity = config.billingShippingMismatchBlocking ? "high" : "medium";

  logger.info("Address mismatch flag: billing/shipping country differ", {
    billingCountry: billing,
    shippingCountry: shipping,
    severity,
  });

  return {
    rule: "address_mismatch",
    severity,
    message: `Billing country (${billing}) does not match shipping country (${shipping})`,
    details: {
      billingCountry: billing,
      shippingCountry: shipping,
      blocking: config.billingShippingMismatchBlocking,
    },
  };
}

// ---------------------------------------------------------------------------
// Address Format Validation
// ---------------------------------------------------------------------------

/**
 * Validate that all required fields for the given country are present and
 * non-empty. Returns a flag if any required field is missing.
 */
export function validateAddressFormat(address: AddressForValidation): FraudFlag | null {
  const country = address.country.toUpperCase().trim();
  const requiredFields =
    REQUIRED_FIELDS_BY_COUNTRY[country] ?? REQUIRED_FIELDS_BY_COUNTRY["_default"]!;

  const missingFields: string[] = [];

  for (const field of requiredFields) {
    const value = address[field];

    if (typeof value !== "string" || value.trim().length === 0) {
      missingFields.push(field);
    }
  }

  if (missingFields.length === 0) {
    return null;
  }

  logger.info("Address format flag: missing required fields", {
    country,
    missingFields,
  });

  return {
    rule: "address_mismatch",
    severity: "medium",
    message: `Shipping address is missing required fields for ${country}: ${missingFields.join(", ")}`,
    details: {
      country,
      missingFields,
      address: {
        name: address.name,
        city: address.city,
        // Redact street for privacy, but indicate presence
        hasStreet: address.street.trim().length > 0,
        hasPostalCode: address.postalCode.trim().length > 0,
        hasPhone: address.phone.trim().length > 0,
      },
    },
  };
}
