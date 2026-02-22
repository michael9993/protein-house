export interface FieldMapping {
  /** Column header from the uploaded file */
  sourceField: string;
  /** Saleor field name to map to */
  targetField: string;
  /** Confidence of auto-detection (0-1) */
  confidence: number;
}

export interface TargetFieldInfo {
  name: string;
  required: boolean;
  description: string;
}

/**
 * Known field name mappings for each entity type.
 * Maps common CSV/Excel column names to Saleor field names.
 */
const fieldMappingRules: Record<string, Record<string, string[]>> = {
  products: {
    name: ["name", "product_name", "product name", "productname", "title", "product title", "product"],
    slug: ["slug", "url_key", "url key", "handle", "productslug", "product_slug"],
    description: ["description", "desc", "product_description", "product description", "body", "content"],
    productType: ["product_type", "product type", "producttype", "type", "product_type_name"],
    category: ["category", "category_id", "category id", "categoryid", "category_name", "category_slug"],
    warehouse: ["warehouse", "warehouse_name", "stock_warehouse", "default_warehouse", "warehouse name"],
    weight: ["weight", "product_weight", "weight_value"],
    variantName: ["variant_name", "variant name", "variantname", "size", "option", "variant"],
    sku: ["sku", "variant_sku", "variant sku", "item_number", "item number"],
    price: ["price", "unit_price", "unit price", "retail_price", "retail price", "amount"],
    costPrice: ["cost_price", "cost price", "costprice", "cost", "wholesale_price", "wholesale price"],
    stock: ["stock", "quantity", "qty", "inventory", "stock_quantity", "stock quantity", "stocktotal"],
    trackInventory: ["track_inventory", "trackinventory", "track inventory"],
    quantityLimit: ["quantity_limit", "quantitylimit", "quantity limit", "limit"],
    color: ["color", "colour", "variant_color", "variant color"],
    imageUrl: ["image_url", "image url", "imageurl", "image", "photo", "photo_url", "thumbnail", "media_url"],
    brand: ["brand", "brand_name", "brand name", "manufacturer", "maker"],
    // New fields
    seoTitle: ["seo_title", "meta_title", "page_title", "seotitle", "meta title"],
    seoDescription: ["seo_description", "meta_description", "seodescription", "meta description"],
    taxClass: ["tax_class", "tax_class_name", "tax_category", "taxclass", "tax class"],
    collections: ["collections", "collection_names", "collection_slugs", "collection names"],
    externalReference: ["external_reference", "external_id", "source_id", "shopify_id", "woo_id", "external reference", "externalreference"],
    metadata: ["metadata", "custom_fields", "meta", "custom fields"],
    isPublished: ["ispublished", "is_published", "published", "visible", "status"],
    visibleInListings: ["visibleinlistings", "visible_in_listings", "show_in_listings", "visible in listings"],
    chargeTaxes: ["chargetaxes", "charge_taxes", "taxable", "charge taxes"],
    imageUrl2: ["imageurl2", "image_url_2", "image_2", "photo_2", "image url 2", "image_url2"],
    imageUrl3: ["imageurl3", "image_url_3", "image_3", "photo_3", "image url 3", "image_url3"],
    imageUrl4: ["imageurl4", "image_url_4", "image_4", "photo_4", "image url 4", "image_url4"],
    imageUrl5: ["imageurl5", "image_url_5", "image_5", "photo_5", "image url 5", "image_url5"],
    imageAlt: ["imagealt", "image_alt", "alt_text", "image_description", "image alt", "alt text"],
    variantWeight: ["variant_weight", "variant weight"],
    variantExternalReference: ["variant_external_reference", "variant_source_id", "variant external reference"],
    variantImageUrl: ["variant_image_url", "variant_image", "variantimageurl", "variant image url", "variant image"],
    variantMetadata: ["variant_metadata", "variantmetadata", "variant metadata", "variant_meta"],
    availableForPurchase: ["available_for_purchase", "availableforpurchase", "available for purchase", "purchasable"],
    replaceImages: ["replace_images", "replaceimages", "update_images", "replace images"],
  },
  categories: {
    name: ["name", "category_name", "category name", "title", "category"],
    slug: ["slug", "url_key", "handle"],
    description: ["description", "desc", "category_description"],
    parent: ["parent", "parent_slug", "parent slug", "parent_name", "parent name", "parent_category"],
    seoTitle: ["seo_title", "meta_title", "page_title", "seotitle"],
    seoDescription: ["seo_description", "meta_description", "seodescription"],
    metadata: ["metadata", "custom_fields", "meta"],
    externalReference: ["external_reference", "external_id", "source_id"],
    backgroundImageUrl: ["background_image", "background_image_url", "image_url", "image", "banner", "banner_url"],
    backgroundImageAlt: ["background_image_alt", "image_alt", "banner_alt"],
  },
  collections: {
    name: ["name", "collection_name", "collection name", "title", "collection"],
    slug: ["slug", "url_key", "handle"],
    description: ["description", "desc", "collection_description"],
    products: ["products", "product_ids", "product ids"],
    seoTitle: ["seo_title", "meta_title", "page_title", "seotitle"],
    seoDescription: ["seo_description", "meta_description", "seodescription"],
    productSlugs: ["productslugs", "product_slugs", "product_handles", "product slugs", "product handles"],
    productSKUs: ["product_skus", "product_sku_list", "product skus"],
    isPublished: ["ispublished", "is_published", "published", "visible"],
    metadata: ["metadata", "custom_fields", "meta"],
    externalReference: ["externalreference", "external_reference", "external_id", "source_id"],
    backgroundImageUrl: ["background_image", "background_image_url", "image_url", "image", "banner"],
    backgroundImageAlt: ["background_image_alt", "image_alt", "banner_alt"],
  },
  customers: {
    email: ["email", "email_address", "email address", "e-mail", "customer_email", "customer email"],
    firstName: ["first_name", "first name", "firstname", "given_name", "given name"],
    lastName: ["last_name", "last name", "lastname", "family_name", "family name", "surname"],
    note: ["note", "notes", "comment", "comments"],
    isActive: ["is_active", "is active", "active", "status", "enabled"],
    // New fields
    languageCode: ["language_code", "language", "locale", "lang"],
    externalReference: ["external_reference", "external_id", "source_id"],
    metadata: ["metadata", "custom_fields", "meta"],
    // Shipping address
    shippingFirstName: ["shipping_first_name", "ship_first_name", "shipping first name"],
    shippingLastName: ["shipping_last_name", "ship_last_name", "shipping last name"],
    shippingCompany: ["shipping_company", "shipping_company_name", "ship_company", "shipping company"],
    shippingStreet1: ["shipping_street", "shipping_address1", "shipping_street1", "ship_street", "shipping street"],
    shippingStreet2: ["shipping_street2", "shipping_address2", "ship_street2", "shipping street 2"],
    shippingCity: ["shipping_city", "ship_city", "shipping city"],
    shippingPostalCode: ["shipping_postal_code", "shipping_zip", "ship_zip", "shipping postal code", "shipping zip"],
    shippingCountry: ["shipping_country", "shipping_country_code", "ship_country", "shipping country"],
    shippingCountryArea: ["shipping_state", "shipping_province", "shipping_country_area", "ship_state", "shipping state"],
    shippingPhone: ["shipping_phone", "ship_phone", "shipping phone"],
    // Billing address
    billingFirstName: ["billing_first_name", "bill_first_name", "billing first name"],
    billingLastName: ["billing_last_name", "bill_last_name", "billing last name"],
    billingCompany: ["billing_company", "billing_company_name", "bill_company", "billing company"],
    billingStreet1: ["billing_street", "billing_address1", "billing_street1", "bill_street", "billing street"],
    billingStreet2: ["billing_street2", "billing_address2", "bill_street2", "billing street 2"],
    billingCity: ["billing_city", "bill_city", "billing city"],
    billingPostalCode: ["billing_postal_code", "billing_zip", "bill_zip", "billing postal code", "billing zip"],
    billingCountry: ["billing_country", "billing_country_code", "bill_country", "billing country"],
    billingCountryArea: ["billing_state", "billing_province", "billing_country_area", "bill_state", "billing state"],
    billingPhone: ["billing_phone", "bill_phone", "billing phone"],
  },
  orders: {
    channel: ["channel", "channel_slug", "store"],
    userEmail: ["email", "user_email", "customer_email", "customer email"],
    variantSku: ["sku", "variant_sku", "item_sku", "product_sku"],
    quantity: ["quantity", "qty", "amount", "count"],
    shippingFirstName: ["shipping_first_name", "ship_first_name"],
    shippingLastName: ["shipping_last_name", "ship_last_name"],
    shippingStreet: ["shipping_street", "shipping_address", "ship_address"],
    shippingCity: ["shipping_city", "ship_city"],
    shippingPostalCode: ["shipping_postal_code", "shipping_zip", "ship_zip"],
    shippingCountry: ["shipping_country", "ship_country"],
  },
  vouchers: {
    name: ["name", "voucher_name", "title", "voucher"],
    code: ["code", "voucher_code", "coupon_code", "coupon", "discount_code"],
    metadata: ["metadata", "custom_fields", "meta"],
    externalReference: ["external_reference", "external_id", "source_id"],
    type: ["type", "voucher_type", "discount_type"],
    discountValueType: ["discount_value_type", "value_type", "percentage_or_fixed"],
    discountValue: ["discount_value", "value", "discount_amount", "discount"],
    startDate: ["start_date", "start", "valid_from", "begins"],
    endDate: ["end_date", "end", "valid_until", "expires", "expiry_date"],
    usageLimit: ["usage_limit", "limit", "max_uses", "use_limit"],
    applyOncePerOrder: ["apply_once_per_order", "once_per_order"],
    applyOncePerCustomer: ["apply_once_per_customer", "once_per_customer"],
    onlyForStaff: ["only_for_staff", "staff_only"],
    singleUse: ["single_use", "one_time"],
    minAmountSpent: ["min_amount_spent", "min_amount", "minimum_purchase", "min_order"],
    minCheckoutItemsQuantity: ["min_items", "min_quantity", "min_checkout_items"],
    countries: ["countries", "country_codes", "allowed_countries"],
    categories: ["categories", "category_slugs"],
    collections: ["collections", "collection_slugs"],
    products: ["products", "product_slugs", "product_skus"],
  },
  giftCards: {
    code: ["code", "gift_card_code", "card_code", "custom_code"],
    balanceAmount: ["balance_amount", "balance", "amount", "value", "card_value"],
    metadata: ["metadata", "custom_fields", "meta"],
    externalReference: ["external_reference", "external_id", "source_id"],
    balanceCurrency: ["balance_currency", "currency", "currency_code"],
    userEmail: ["user_email", "email", "customer_email", "recipient_email", "recipient"],
    tags: ["tags", "tag", "labels"],
    expiryDate: ["expiry_date", "expiry", "expires", "valid_until", "expiration"],
    isActive: ["is_active", "active", "enabled"],
    note: ["note", "notes", "comment", "staff_note"],
  },
};

/**
 * Dynamic column prefixes that are passed through as-is.
 * These columns are not auto-mapped to a fixed target field —
 * they carry their prefix as the target field name.
 *
 * Examples: attr:Brand, variantAttr:Size, stock:Main Warehouse
 */
const DYNAMIC_PREFIXES = ["attr:", "variantAttr:", "stock:"];

/**
 * Auto-detect field mappings based on uploaded column headers and entity type.
 * Returns a list of FieldMapping objects with confidence scores.
 */
export function autoMapFields(
  headers: string[],
  entityType: string
): FieldMapping[] {
  const rules = fieldMappingRules[entityType] || {};
  const mappings: FieldMapping[] = [];

  for (const header of headers) {
    const normalizedHeader = header.toLowerCase().trim();

    // Check for dynamic prefix columns (attr:*, variantAttr:*, stock:*)
    const isDynamic = DYNAMIC_PREFIXES.some((prefix) => header.startsWith(prefix));
    if (isDynamic) {
      mappings.push({
        sourceField: header,
        targetField: header, // pass through as-is
        confidence: 1.0,
      });
      continue;
    }

    let bestMatch: { targetField: string; confidence: number } | null = null;

    for (const [saleorField, aliases] of Object.entries(rules)) {
      // Exact match
      if (aliases.includes(normalizedHeader)) {
        bestMatch = { targetField: saleorField, confidence: 1.0 };
        break;
      }

      // Partial match
      for (const alias of aliases) {
        if (
          normalizedHeader.includes(alias) ||
          alias.includes(normalizedHeader)
        ) {
          const confidence = 0.6;
          if (!bestMatch || confidence > bestMatch.confidence) {
            bestMatch = { targetField: saleorField, confidence };
          }
        }
      }
    }

    mappings.push({
      sourceField: header,
      targetField: bestMatch?.targetField || "",
      confidence: bestMatch?.confidence || 0,
    });
  }

  return mappings;
}

/**
 * Get available target fields for a given entity type.
 */
export function getTargetFields(entityType: string): string[] {
  return Object.keys(fieldMappingRules[entityType] || {});
}

/**
 * Target field metadata with required/optional and descriptions.
 */
const targetFieldMeta: Record<string, Record<string, { required: boolean; description: string }>> = {
  products: {
    name: { required: true, description: "Product name (rows with same name are grouped as variants)" },
    slug: { required: false, description: "URL slug (auto-generated from name if empty)" },
    description: { required: false, description: "Product description (plain text or HTML)" },
    productType: { required: false, description: "Product type name or slug (resolves to ID, overrides dropdown)" },
    category: { required: false, description: "Category name or slug (resolves to ID, overrides dropdown)" },
    warehouse: { required: false, description: "Default warehouse name or slug (resolves to ID, overrides dropdown)" },
    weight: { required: false, description: "Product weight in KG (e.g. 0.8)" },
    variantName: { required: false, description: "Variant name / size (e.g. 42, S, Red)" },
    sku: { required: false, description: "SKU code for the variant" },
    price: { required: false, description: "Variant price in channel currency" },
    costPrice: { required: false, description: "Variant cost price" },
    stock: { required: false, description: "Stock quantity (default warehouse or use stock:WarehouseName columns)" },
    trackInventory: { required: false, description: "Track inventory (Yes/No, default: Yes)" },
    quantityLimit: { required: false, description: "Max quantity per customer" },
    color: { required: false, description: "Variant color (e.g. White, Black, Red)" },
    imageUrl: { required: false, description: "Product image URL (external URL)" },
    brand: { required: false, description: "Brand name (matched to product attribute)" },
    seoTitle: { required: false, description: "SEO page title (meta title)" },
    seoDescription: { required: false, description: "SEO meta description" },
    taxClass: { required: false, description: "Tax class name (resolved by name)" },
    collections: { required: false, description: "Semicolon-separated collection slugs/names" },
    externalReference: { required: false, description: "External system ID (for upsert matching)" },
    metadata: { required: false, description: "Metadata as key:value;key:value pairs" },
    isPublished: { required: false, description: "Channel publish status (Yes/No, default: Yes)" },
    visibleInListings: { required: false, description: "Show in listings (Yes/No, default: Yes)" },
    chargeTaxes: { required: false, description: "Charge taxes (Yes/No, default: Yes)" },
    imageUrl2: { required: false, description: "Second product image URL" },
    imageUrl3: { required: false, description: "Third product image URL" },
    imageUrl4: { required: false, description: "Fourth product image URL" },
    imageUrl5: { required: false, description: "Fifth product image URL" },
    imageAlt: { required: false, description: "Alt text for product images" },
    variantWeight: { required: false, description: "Per-variant weight override" },
    variantExternalReference: { required: false, description: "Variant external system ID" },
    variantImageUrl: { required: false, description: "Variant-specific image URL (uploaded and assigned to variant)" },
    variantMetadata: { required: false, description: "Per-variant metadata as key:value;key:value pairs" },
    availableForPurchase: { required: false, description: "Available for purchase (Yes/No or ISO date, default: Yes)" },
    replaceImages: { required: false, description: "Replace existing images in upsert (Yes/No, default: No)" },
  },
  categories: {
    name: { required: true, description: "Category name" },
    slug: { required: false, description: "URL slug" },
    description: { required: false, description: "Category description" },
    parent: { required: false, description: "Parent category slug or name" },
    seoTitle: { required: false, description: "SEO page title" },
    seoDescription: { required: false, description: "SEO meta description" },
    metadata: { required: false, description: "Metadata as key:value;key:value pairs" },
    externalReference: { required: false, description: "External system ID (for upsert matching)" },
    backgroundImageUrl: { required: false, description: "Background/banner image URL" },
    backgroundImageAlt: { required: false, description: "Background image alt text" },
  },
  collections: {
    name: { required: true, description: "Collection name" },
    slug: { required: false, description: "URL slug" },
    description: { required: false, description: "Collection description" },
    products: { required: false, description: "Product IDs to include (deprecated, use productSlugs)" },
    seoTitle: { required: false, description: "SEO page title" },
    seoDescription: { required: false, description: "SEO meta description" },
    productSlugs: { required: false, description: "Semicolon-separated product slugs to assign" },
    productSKUs: { required: false, description: "Semicolon-separated product SKUs to assign" },
    isPublished: { required: false, description: "Channel publish status (Yes/No)" },
    metadata: { required: false, description: "Metadata as key:value;key:value pairs" },
    externalReference: { required: false, description: "External system ID (for upsert matching)" },
    backgroundImageUrl: { required: false, description: "Background/banner image URL" },
    backgroundImageAlt: { required: false, description: "Background image alt text" },
  },
  customers: {
    email: { required: true, description: "Customer email address" },
    firstName: { required: false, description: "First name" },
    lastName: { required: false, description: "Last name" },
    note: { required: false, description: "Internal note" },
    isActive: { required: false, description: "Active status (true/false)" },
    languageCode: { required: false, description: "Language code (e.g. EN, HE, AR)" },
    externalReference: { required: false, description: "External system ID" },
    metadata: { required: false, description: "Metadata as key:value;key:value pairs" },
    shippingFirstName: { required: false, description: "Shipping address first name" },
    shippingLastName: { required: false, description: "Shipping address last name" },
    shippingCompany: { required: false, description: "Shipping company name" },
    shippingStreet1: { required: false, description: "Shipping street line 1" },
    shippingStreet2: { required: false, description: "Shipping street line 2" },
    shippingCity: { required: false, description: "Shipping city" },
    shippingPostalCode: { required: false, description: "Shipping postal/ZIP code" },
    shippingCountry: { required: false, description: "Shipping country (ISO code, e.g. US, IL)" },
    shippingCountryArea: { required: false, description: "Shipping state/province" },
    shippingPhone: { required: false, description: "Shipping phone" },
    billingFirstName: { required: false, description: "Billing address first name" },
    billingLastName: { required: false, description: "Billing address last name" },
    billingCompany: { required: false, description: "Billing company name" },
    billingStreet1: { required: false, description: "Billing street line 1" },
    billingStreet2: { required: false, description: "Billing street line 2" },
    billingCity: { required: false, description: "Billing city" },
    billingPostalCode: { required: false, description: "Billing postal/ZIP code" },
    billingCountry: { required: false, description: "Billing country (ISO code)" },
    billingCountryArea: { required: false, description: "Billing state/province" },
    billingPhone: { required: false, description: "Billing phone" },
  },
  orders: {
    channel: { required: true, description: "Channel slug" },
    userEmail: { required: true, description: "Customer email" },
    variantSku: { required: true, description: "Product variant SKU" },
    quantity: { required: true, description: "Order line quantity" },
    shippingFirstName: { required: false, description: "Shipping first name" },
    shippingLastName: { required: false, description: "Shipping last name" },
    shippingStreet: { required: false, description: "Shipping street" },
    shippingCity: { required: false, description: "Shipping city" },
    shippingPostalCode: { required: false, description: "Shipping postal code" },
    shippingCountry: { required: false, description: "Shipping country code" },
  },
  vouchers: {
    name: { required: true, description: "Voucher/coupon name" },
    code: { required: false, description: "Discount code (auto-generated if empty)" },
    type: { required: false, description: "ENTIRE_ORDER, SHIPPING, or SPECIFIC_PRODUCT" },
    discountValueType: { required: false, description: "FIXED or PERCENTAGE" },
    discountValue: { required: false, description: "Discount amount or percentage" },
    startDate: { required: false, description: "Start date (ISO format)" },
    endDate: { required: false, description: "End/expiry date (ISO format)" },
    usageLimit: { required: false, description: "Total uses allowed" },
    applyOncePerOrder: { required: false, description: "Apply once per order (Yes/No)" },
    applyOncePerCustomer: { required: false, description: "One use per customer (Yes/No)" },
    onlyForStaff: { required: false, description: "Staff-only voucher (Yes/No)" },
    singleUse: { required: false, description: "Single use voucher (Yes/No)" },
    minAmountSpent: { required: false, description: "Minimum cart total" },
    minCheckoutItemsQuantity: { required: false, description: "Minimum items in cart" },
    countries: { required: false, description: "Semicolon-separated country codes" },
    categories: { required: false, description: "Semicolon-separated category slugs" },
    collections: { required: false, description: "Semicolon-separated collection slugs" },
    products: { required: false, description: "Semicolon-separated product slugs" },
    metadata: { required: false, description: "Metadata as key:value;key:value pairs" },
    externalReference: { required: false, description: "External system ID (for upsert matching)" },
  },
  giftCards: {
    code: { required: false, description: "Custom gift card code (auto-generated if empty)" },
    balanceAmount: { required: true, description: "Initial balance amount" },
    balanceCurrency: { required: false, description: "Currency code (defaults to channel currency)" },
    userEmail: { required: false, description: "Recipient email address" },
    tags: { required: false, description: "Semicolon-separated tags" },
    expiryDate: { required: false, description: "Expiration date (ISO format)" },
    isActive: { required: false, description: "Active status (Yes/No, default: Yes)" },
    note: { required: false, description: "Internal staff note" },
    metadata: { required: false, description: "Metadata as key:value;key:value pairs" },
    externalReference: { required: false, description: "External system ID (for upsert matching)" },
  },
};

/**
 * Get target fields with required/optional metadata.
 */
export function getTargetFieldsInfo(entityType: string): TargetFieldInfo[] {
  const meta = targetFieldMeta[entityType] || {};
  return Object.entries(meta).map(([name, info]) => ({
    name,
    required: info.required,
    description: info.description,
  }));
}

/**
 * Sample data rows for template generation.
 * Each entity has one realistic example row.
 */
const sampleRows: Record<string, Record<string, string>> = {
  products: {
    name: "Air Max 90",
    slug: "air-max-90",
    description: "Classic running shoe with visible Air cushioning",
    productType: "shoes",
    category: "running-shoes",
    warehouse: "main-warehouse",
    weight: "0.8",
    variantName: "42",
    sku: "AM90-BLK-42",
    price: "129.99",
    costPrice: "65.00",
    stock: "50",
    trackInventory: "Yes",
    quantityLimit: "",
    color: "Black",
    imageUrl: "https://example.com/images/am90-black.jpg",
    brand: "Nike",
    seoTitle: "Air Max 90 - Classic Running Shoes",
    seoDescription: "Shop the Air Max 90 with visible Air cushioning",
    taxClass: "standard",
    collections: "best-sellers;new-arrivals",
    externalReference: "SHOP-12345",
    metadata: "source:shopify;imported:true",
    isPublished: "Yes",
    visibleInListings: "Yes",
    chargeTaxes: "Yes",
    imageUrl2: "",
    imageUrl3: "",
    imageUrl4: "",
    imageUrl5: "",
    imageAlt: "Air Max 90 Black colorway",
    variantWeight: "",
    variantExternalReference: "",
    variantImageUrl: "",
    variantMetadata: "",
    availableForPurchase: "Yes",
    replaceImages: "No",
  },
  categories: {
    name: "Running Shoes",
    slug: "running-shoes",
    description: "Performance running footwear",
    parent: "shoes",
    seoTitle: "Running Shoes - Mansour Shoes",
    seoDescription: "Browse our running shoe collection",
    metadata: "featured:true",
    externalReference: "CAT-001",
    backgroundImageUrl: "https://example.com/images/running-banner.jpg",
    backgroundImageAlt: "Running shoes collection banner",
  },
  collections: {
    name: "Summer Sale 2025",
    slug: "summer-sale-2025",
    description: "Hot summer deals on selected styles",
    products: "",
    seoTitle: "Summer Sale - Up to 50% Off",
    seoDescription: "Shop our summer sale collection",
    productSlugs: "air-max-90;ultraboost-22",
    productSKUs: "",
    isPublished: "Yes",
    metadata: "season:summer;year:2025",
    externalReference: "COL-SUMMER25",
    backgroundImageUrl: "https://example.com/images/summer-sale.jpg",
    backgroundImageAlt: "Summer sale banner",
  },
  customers: {
    email: "john.doe@example.com",
    firstName: "John",
    lastName: "Doe",
    note: "VIP customer",
    isActive: "true",
    languageCode: "EN",
    externalReference: "CUST-001",
    metadata: "loyalty_tier:gold",
    shippingFirstName: "John",
    shippingLastName: "Doe",
    shippingCompany: "",
    shippingStreet1: "123 Main Street",
    shippingStreet2: "Apt 4B",
    shippingCity: "New York",
    shippingPostalCode: "10001",
    shippingCountry: "US",
    shippingCountryArea: "NY",
    shippingPhone: "+1-555-0100",
    billingFirstName: "John",
    billingLastName: "Doe",
    billingCompany: "",
    billingStreet1: "123 Main Street",
    billingStreet2: "Apt 4B",
    billingCity: "New York",
    billingPostalCode: "10001",
    billingCountry: "US",
    billingCountryArea: "NY",
    billingPhone: "+1-555-0100",
  },
  vouchers: {
    name: "Summer 20% Off",
    code: "SUMMER20",
    type: "ENTIRE_ORDER",
    discountValueType: "PERCENTAGE",
    discountValue: "20",
    startDate: "2025-06-01",
    endDate: "2025-08-31",
    usageLimit: "1000",
    applyOncePerOrder: "Yes",
    applyOncePerCustomer: "Yes",
    onlyForStaff: "No",
    singleUse: "No",
    minAmountSpent: "50",
    minCheckoutItemsQuantity: "1",
    countries: "US;IL",
    categories: "running-shoes;casual",
    collections: "summer-sale-2025",
    products: "",
    metadata: "campaign:summer_2025",
    externalReference: "VOUCH-001",
  },
  giftCards: {
    code: "GIFT-ABC-123",
    balanceAmount: "100.00",
    balanceCurrency: "USD",
    userEmail: "recipient@example.com",
    tags: "birthday;premium",
    expiryDate: "2026-12-31",
    isActive: "Yes",
    note: "Birthday gift card",
    metadata: "source:web;occasion:birthday",
    externalReference: "GC-001",
  },
};

/**
 * Get a sample data row for template generation.
 */
export function getSampleRow(entityType: string): Record<string, string> {
  return sampleRows[entityType] || {};
}
