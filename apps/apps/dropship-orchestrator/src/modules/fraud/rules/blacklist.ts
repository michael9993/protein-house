import { createLogger } from "@/logger";

import type { BlacklistEntry, FraudFlag } from "../types";

const logger = createLogger("fraud-rule:blacklist");

// ---------------------------------------------------------------------------
// Address shape (same lightweight shape used in address-validation)
// ---------------------------------------------------------------------------

export interface AddressForBlacklistCheck {
  name: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
}

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a string for fuzzy comparison:
 *  - lowercase
 *  - collapse multiple whitespace into single space
 *  - trim leading/trailing whitespace
 *  - strip common punctuation (dots, commas, dashes in addresses)
 */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.,\-#]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Build a single comparable string from an address for fuzzy matching.
 */
function flattenAddress(address: AddressForBlacklistCheck): string {
  return normalize(
    [address.name, address.street, address.city, address.postalCode, address.country].join(" "),
  );
}

// ---------------------------------------------------------------------------
// Match helpers
// ---------------------------------------------------------------------------

function matchEmail(email: string, entry: BlacklistEntry): boolean {
  if (entry.type !== "email") return false;

  return normalize(email) === normalize(entry.value);
}

function matchAddress(address: AddressForBlacklistCheck, entry: BlacklistEntry): boolean {
  if (entry.type !== "address") return false;

  const flat = flattenAddress(address);
  const entryNormalized = normalize(entry.value);

  // Exact match after normalization, or the blacklisted value is a substring
  // of the full address (covers partial address matches like "123 Main St").
  return flat === entryNormalized || flat.includes(entryNormalized);
}

function matchPhone(phone: string, entry: BlacklistEntry): boolean {
  if (entry.type !== "phone") return false;

  // Strip everything except digits for comparison
  const digits = (s: string) => s.replace(/\D/g, "");

  return digits(phone) === digits(entry.value);
}

// ---------------------------------------------------------------------------
// Blacklist Check
// ---------------------------------------------------------------------------

/**
 * Check if the order's email, shipping address, or phone appears on the
 * blacklist. Returns the first match found (critical severity).
 */
export function checkBlacklist(
  email: string,
  shippingAddress: AddressForBlacklistCheck,
  blacklist: BlacklistEntry[],
): FraudFlag | null {
  if (blacklist.length === 0) {
    return null;
  }

  for (const entry of blacklist) {
    // --- Email match ---
    if (matchEmail(email, entry)) {
      logger.info("Blacklist flag: email match", {
        email: email.toLowerCase(),
        reason: entry.reason,
      });

      return {
        rule: "blacklist_match",
        severity: "critical",
        message: `Email "${email}" is on the blacklist: ${entry.reason}`,
        details: {
          matchType: "email",
          matchedValue: entry.value,
          reason: entry.reason,
          addedAt: entry.addedAt,
        },
      };
    }

    // --- Address match ---
    if (matchAddress(shippingAddress, entry)) {
      logger.info("Blacklist flag: address match", {
        reason: entry.reason,
      });

      return {
        rule: "blacklist_match",
        severity: "critical",
        message: `Shipping address matches blacklisted address: ${entry.reason}`,
        details: {
          matchType: "address",
          matchedValue: entry.value,
          reason: entry.reason,
          addedAt: entry.addedAt,
        },
      };
    }

    // --- Phone match ---
    if (matchPhone(shippingAddress.phone, entry)) {
      logger.info("Blacklist flag: phone match", {
        reason: entry.reason,
      });

      return {
        rule: "blacklist_match",
        severity: "critical",
        message: `Phone number matches blacklisted phone: ${entry.reason}`,
        details: {
          matchType: "phone",
          matchedValue: entry.value,
          reason: entry.reason,
          addedAt: entry.addedAt,
        },
      };
    }
  }

  return null;
}
