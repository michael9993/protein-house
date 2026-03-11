import { v4 as uuid } from "uuid";
import { TaxRule } from "./types";

type PresetFactory = () => TaxRule[];

function makeRule(
  name: string,
  countryCode: string,
  taxRate: number,
  opts?: { countryArea?: string; shippingTaxRate?: number | null; priority?: number }
): TaxRule {
  return {
    id: uuid(),
    name,
    countryCode,
    taxRate,
    shippingTaxRate: opts?.shippingTaxRate ?? null,
    countryArea: opts?.countryArea,
    priority: opts?.priority ?? 0,
    enabled: true,
  };
}

export const PRESET_ISRAEL: PresetFactory = () => [
  makeRule("Israel VAT", "IL", 0.17, { shippingTaxRate: 0.17, priority: 10 }),
];

export const PRESET_EU: PresetFactory = () => [
  makeRule("Austria VAT", "AT", 0.20),
  makeRule("Belgium VAT", "BE", 0.21),
  makeRule("Bulgaria VAT", "BG", 0.20),
  makeRule("Croatia VAT", "HR", 0.25),
  makeRule("Cyprus VAT", "CY", 0.19),
  makeRule("Czech Republic VAT", "CZ", 0.21),
  makeRule("Denmark VAT", "DK", 0.25),
  makeRule("Estonia VAT", "EE", 0.22),
  makeRule("Finland VAT", "FI", 0.255),
  makeRule("France VAT", "FR", 0.20),
  makeRule("Germany VAT", "DE", 0.19),
  makeRule("Greece VAT", "GR", 0.24),
  makeRule("Hungary VAT", "HU", 0.27),
  makeRule("Ireland VAT", "IE", 0.23),
  makeRule("Italy VAT", "IT", 0.22),
  makeRule("Latvia VAT", "LV", 0.21),
  makeRule("Lithuania VAT", "LT", 0.21),
  makeRule("Luxembourg VAT", "LU", 0.17),
  makeRule("Malta VAT", "MT", 0.18),
  makeRule("Netherlands VAT", "NL", 0.21),
  makeRule("Poland VAT", "PL", 0.23),
  makeRule("Portugal VAT", "PT", 0.23),
  makeRule("Romania VAT", "RO", 0.19),
  makeRule("Slovakia VAT", "SK", 0.23),
  makeRule("Slovenia VAT", "SI", 0.22),
  makeRule("Spain VAT", "ES", 0.21),
  makeRule("Sweden VAT", "SE", 0.25),
];

export const PRESET_US: PresetFactory = () => [
  makeRule("Alabama Sales Tax", "US", 0.04, { countryArea: "AL" }),
  makeRule("Alaska Sales Tax", "US", 0.00, { countryArea: "AK" }),
  makeRule("Arizona Sales Tax", "US", 0.056, { countryArea: "AZ" }),
  makeRule("Arkansas Sales Tax", "US", 0.065, { countryArea: "AR" }),
  makeRule("California Sales Tax", "US", 0.0725, { countryArea: "CA" }),
  makeRule("Colorado Sales Tax", "US", 0.029, { countryArea: "CO" }),
  makeRule("Connecticut Sales Tax", "US", 0.0635, { countryArea: "CT" }),
  makeRule("Delaware Sales Tax", "US", 0.00, { countryArea: "DE" }),
  makeRule("Florida Sales Tax", "US", 0.06, { countryArea: "FL" }),
  makeRule("Georgia Sales Tax", "US", 0.04, { countryArea: "GA" }),
  makeRule("Hawaii Sales Tax", "US", 0.04, { countryArea: "HI" }),
  makeRule("Idaho Sales Tax", "US", 0.06, { countryArea: "ID" }),
  makeRule("Illinois Sales Tax", "US", 0.0625, { countryArea: "IL" }),
  makeRule("Indiana Sales Tax", "US", 0.07, { countryArea: "IN" }),
  makeRule("Iowa Sales Tax", "US", 0.06, { countryArea: "IA" }),
  makeRule("Kansas Sales Tax", "US", 0.065, { countryArea: "KS" }),
  makeRule("Kentucky Sales Tax", "US", 0.06, { countryArea: "KY" }),
  makeRule("Louisiana Sales Tax", "US", 0.0445, { countryArea: "LA" }),
  makeRule("Maine Sales Tax", "US", 0.055, { countryArea: "ME" }),
  makeRule("Maryland Sales Tax", "US", 0.06, { countryArea: "MD" }),
  makeRule("Massachusetts Sales Tax", "US", 0.0625, { countryArea: "MA" }),
  makeRule("Michigan Sales Tax", "US", 0.06, { countryArea: "MI" }),
  makeRule("Minnesota Sales Tax", "US", 0.06875, { countryArea: "MN" }),
  makeRule("Mississippi Sales Tax", "US", 0.07, { countryArea: "MS" }),
  makeRule("Missouri Sales Tax", "US", 0.04225, { countryArea: "MO" }),
  makeRule("Montana Sales Tax", "US", 0.00, { countryArea: "MT" }),
  makeRule("Nebraska Sales Tax", "US", 0.055, { countryArea: "NE" }),
  makeRule("Nevada Sales Tax", "US", 0.0685, { countryArea: "NV" }),
  makeRule("New Hampshire Sales Tax", "US", 0.00, { countryArea: "NH" }),
  makeRule("New Jersey Sales Tax", "US", 0.06625, { countryArea: "NJ" }),
  makeRule("New Mexico Sales Tax", "US", 0.04875, { countryArea: "NM" }),
  makeRule("New York Sales Tax", "US", 0.04, { countryArea: "NY" }),
  makeRule("North Carolina Sales Tax", "US", 0.0475, { countryArea: "NC" }),
  makeRule("North Dakota Sales Tax", "US", 0.05, { countryArea: "ND" }),
  makeRule("Ohio Sales Tax", "US", 0.0575, { countryArea: "OH" }),
  makeRule("Oklahoma Sales Tax", "US", 0.045, { countryArea: "OK" }),
  makeRule("Oregon Sales Tax", "US", 0.00, { countryArea: "OR" }),
  makeRule("Pennsylvania Sales Tax", "US", 0.06, { countryArea: "PA" }),
  makeRule("Rhode Island Sales Tax", "US", 0.07, { countryArea: "RI" }),
  makeRule("South Carolina Sales Tax", "US", 0.06, { countryArea: "SC" }),
  makeRule("South Dakota Sales Tax", "US", 0.042, { countryArea: "SD" }),
  makeRule("Tennessee Sales Tax", "US", 0.07, { countryArea: "TN" }),
  makeRule("Texas Sales Tax", "US", 0.0625, { countryArea: "TX" }),
  makeRule("Utah Sales Tax", "US", 0.0485, { countryArea: "UT" }),
  makeRule("Vermont Sales Tax", "US", 0.06, { countryArea: "VT" }),
  makeRule("Virginia Sales Tax", "US", 0.043, { countryArea: "VA" }),
  makeRule("Washington Sales Tax", "US", 0.065, { countryArea: "WA" }),
  makeRule("West Virginia Sales Tax", "US", 0.06, { countryArea: "WV" }),
  makeRule("Wisconsin Sales Tax", "US", 0.05, { countryArea: "WI" }),
  makeRule("Wyoming Sales Tax", "US", 0.04, { countryArea: "WY" }),
  makeRule("DC Sales Tax", "US", 0.06, { countryArea: "DC" }),
];

export const PRESET_ZERO_TAX: PresetFactory = () => [
  makeRule("UAE VAT", "AE", 0.05),
  makeRule("Hong Kong – No Sales Tax", "HK", 0.00),
  makeRule("Bahrain VAT", "BH", 0.10),
  makeRule("Bermuda – No Sales Tax", "BM", 0.00),
];

export const PRESETS = {
  israel: { name: "Israel (17% VAT)", factory: PRESET_ISRAEL, count: 1 },
  eu: { name: "EU 27 Countries", factory: PRESET_EU, count: 27 },
  us: { name: "US 50 States + DC", factory: PRESET_US, count: 51 },
  "zero-tax": { name: "Other Jurisdictions (UAE, HK, BH, BM)", factory: PRESET_ZERO_TAX, count: 4 },
} as const;

export type PresetId = keyof typeof PRESETS;
