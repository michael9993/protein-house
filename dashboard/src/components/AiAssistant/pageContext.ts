function extractId(pathname: string, prefix: string): string | null {
  const match = pathname.match(new RegExp(`^${prefix}/([^/]+)`));
  return match ? match[1] : null;
}

interface PageContext {
  description: string;
  actions: string;
}

function ctx(description: string, actions: string): PageContext {
  return { description, actions };
}

function getPageContextObj(pathname: string): PageContext {
  if (pathname === "/")
    return ctx(
      "Dashboard home page (overview with key metrics)",
      "View sales metrics, recent orders, top products. Navigate to any section.",
    );

  // Orders
  if (pathname === "/orders")
    return ctx(
      "Orders list page",
      "Filter/sort orders, search by number, click to view details, create draft order, export orders.",
    );
  if (pathname === "/orders/drafts")
    return ctx(
      "Draft orders list",
      "Create new draft order, edit existing drafts, delete drafts, finalize draft into a real order.",
    );
  const orderId = extractId(pathname, "/orders");
  if (orderId)
    return ctx(
      `Order detail page (order ID: ${orderId})`,
      "Fulfill items (select warehouse, add tracking), capture/void payment, refund (full or partial), cancel order, add note, edit shipping address, view order timeline.",
    );

  // Products
  if (pathname === "/products")
    return ctx(
      "Products catalog list",
      "Filter by type/category/channel, search products, create new product, bulk delete, export products.",
    );
  if (pathname === "/products/add")
    return ctx(
      "Create new product page",
      "Select product type, fill name/description, add media, set SEO. After saving: add variants, set prices, manage stock.",
    );
  const productId = extractId(pathname, "/products");
  if (productId)
    return ctx(
      `Product detail/edit page (product ID: ${productId})`,
      "Edit name/description/media, manage variants (add/edit/delete), set prices per channel, manage stock per warehouse, publish/unpublish to channels, set SEO, manage metadata.",
    );

  // Categories
  if (pathname === "/categories")
    return ctx(
      "Categories list (top-level)",
      "Create new category, edit existing, delete (must have no children), view subcategories.",
    );
  const categoryId = extractId(pathname, "/categories");
  if (categoryId)
    return ctx(
      `Category detail page (category ID: ${categoryId})`,
      "Edit name/description/SEO, manage subcategories, view assigned products, set background image.",
    );

  // Collections
  if (pathname === "/collections")
    return ctx(
      "Collections list",
      "Create new collection, filter by channel, search, delete collections.",
    );
  const collectionId = extractId(pathname, "/collections");
  if (collectionId)
    return ctx(
      `Collection detail page (collection ID: ${collectionId})`,
      "Edit name/description, assign/remove products, publish to channels, set SEO, set background image.",
    );

  // Customers
  if (pathname === "/customers")
    return ctx(
      "Customers list",
      "Search customers by name/email, create new customer, export customers, view customer details.",
    );
  const customerId = extractId(pathname, "/customers");
  if (customerId)
    return ctx(
      `Customer detail page (customer ID: ${customerId})`,
      "Edit name/email, manage addresses (add/edit/set default), view order history, add note, manage metadata.",
    );

  // Discounts
  if (pathname === "/discounts")
    return ctx(
      "Discounts list (auto-applied rules)",
      "Create new discount rule, search, filter by active status, delete discounts.",
    );
  const discountId = extractId(pathname, "/discounts");
  if (discountId)
    return ctx(
      `Discount detail page (discount ID: ${discountId})`,
      "Edit discount name/value/type, set conditions (categories/collections/products), set active dates, assign channels.",
    );

  // Vouchers
  if (pathname === "/vouchers")
    return ctx(
      "Vouchers list (code-based discounts)",
      "Create new voucher, search by code, filter by active status, delete vouchers.",
    );
  const voucherId = extractId(pathname, "/vouchers");
  if (voucherId)
    return ctx(
      `Voucher detail page (voucher ID: ${voucherId})`,
      "Edit code/discount value/type, set usage limits (per customer, total), set minimum order, set active dates, assign to channels/categories/products.",
    );

  // Gift Cards
  if (pathname === "/gift-cards")
    return ctx(
      "Gift cards list",
      "Issue new gift card, search by code, filter by tag, bulk delete, export gift cards.",
    );
  const giftCardId = extractId(pathname, "/gift-cards");
  if (giftCardId)
    return ctx(
      `Gift card detail page (gift card ID: ${giftCardId})`,
      "View balance, set expiry date, add tags, disable/enable, view usage history.",
    );

  // Shipping
  if (pathname === "/shipping")
    return ctx(
      "Shipping zones configuration",
      "Create new shipping zone, edit zones, delete zones. Each zone covers specific countries.",
    );
  const shippingId = extractId(pathname, "/shipping");
  if (shippingId)
    return ctx(
      `Shipping zone detail page (zone ID: ${shippingId})`,
      "Edit zone name, assign/remove countries, add rate methods (flat rate, weight-based, price-based), set free shipping threshold, assign to channels.",
    );

  // Warehouses
  if (pathname === "/warehouses")
    return ctx(
      "Warehouses list",
      "Create new warehouse, search, delete warehouses.",
    );
  const warehouseId = extractId(pathname, "/warehouses");
  if (warehouseId)
    return ctx(
      `Warehouse detail page (warehouse ID: ${warehouseId})`,
      "Edit name/address, assign to shipping zones, manage stock allocation settings.",
    );

  // Channels
  if (pathname === "/channels")
    return ctx(
      "Channels list (multi-channel config)",
      "Create new channel, edit existing channels.",
    );
  const channelId = extractId(pathname, "/channels");
  if (channelId)
    return ctx(
      `Channel detail page (channel ID: ${channelId})`,
      "Edit channel name/slug/currency, set default country, assign warehouses, assign shipping zones, configure order settings.",
    );

  // Staff
  if (pathname === "/staff")
    return ctx(
      "Staff members list",
      "Invite new staff member, search, deactivate staff accounts.",
    );
  const staffId = extractId(pathname, "/staff");
  if (staffId)
    return ctx(
      `Staff member detail page (staff ID: ${staffId})`,
      "Edit name/email, assign/remove permission groups, set active status, change avatar.",
    );

  if (pathname === "/configuration")
    return ctx(
      "Configuration/Settings hub",
      "Navigate to: Channels, Shipping, Warehouses, Taxes, Staff, Permissions, Attributes, Product Types, Page Types, Plugins.",
    );
  if (
    pathname === "/extensions" ||
    pathname === "/extensions/installed"
  )
    return ctx(
      "Installed apps/extensions list",
      "View installed apps (Stripe, SMTP, Storefront Control, etc.), open app settings, install new apps.",
    );
  if (pathname === "/extensions/explore")
    return ctx(
      "Explore extensions marketplace",
      "Browse and install new extensions from the marketplace.",
    );
  if (pathname.startsWith("/extensions/app/"))
    return ctx(
      "App detail/settings page",
      "Configure app settings, view app permissions, manage webhooks.",
    );

  if (pathname === "/translations")
    return ctx(
      "Translations management",
      "Select language to translate, choose entity type (products, categories, etc.).",
    );
  if (pathname.startsWith("/translations/"))
    return ctx(
      "Translation editor",
      "Edit translations for the selected entity and language.",
    );

  if (pathname.startsWith("/permission-groups"))
    return ctx(
      "Permission groups management",
      "Create/edit permission groups, assign permissions, assign staff members.",
    );
  if (pathname.startsWith("/taxes"))
    return ctx(
      "Tax configuration",
      "Configure tax classes, set tax rates per country, enable/disable tax calculation.",
    );
  if (pathname.startsWith("/plugins"))
    return ctx(
      "Plugins configuration",
      "Enable/disable plugins, configure plugin settings per channel.",
    );
  if (pathname.startsWith("/attributes"))
    return ctx(
      "Attributes management",
      "Create/edit attributes, set attribute type (dropdown, text, numeric, etc.), manage attribute values.",
    );
  if (pathname.startsWith("/product-types"))
    return ctx(
      "Product types management",
      "Create/edit product types, assign product attributes and variant selection attributes, set tax class.",
    );
  if (pathname.startsWith("/pages"))
    return ctx(
      "Content pages management",
      "Create/edit static pages (About, Terms, etc.), publish to channels, set SEO.",
    );
  if (pathname.startsWith("/page-types"))
    return ctx(
      "Page types management",
      "Create/edit page types, assign attributes.",
    );

  return ctx(`Page: ${pathname}`, "");
}

export function getPageContext(pathname: string): string {
  const { description, actions } = getPageContextObj(pathname);
  if (actions) {
    return `${description}. Available actions: ${actions}`;
  }
  return description;
}
