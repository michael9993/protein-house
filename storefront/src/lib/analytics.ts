import { hasConsent } from "@/lib/consent";

// -- Module state --
let _channel = "";
let eventQueue: Record<string, unknown>[] = [];
const _sentEvents = new Set<string>();

export function setAnalyticsChannel(ch: string) {
  _channel = ch;
}

// -- Core --
export function initDataLayer(): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
}

export function pushDataLayer(data: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  initDataLayer();
  if (!hasConsent(_channel, "analytics")) {
    eventQueue.push(data);
    return;
  }
  window.dataLayer!.push(data);
}

export function flushEventQueue(): void {
  if (typeof window === "undefined") return;
  initDataLayer();
  for (const event of eventQueue) {
    window.dataLayer!.push(event);
  }
  eventQueue = [];
}

// -- GA4 Types --
type GA4Product = {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  price: number;
  currency: string;
  quantity?: number;
  discount?: number;
};

// -- Deduplication --
// Prevents the same event from firing twice (e.g., queued pre-consent + re-triggered post-consent)
function dedupeKey(event: string, id: string): string {
  return `${event}:${id}`;
}

// -- GA4 E-commerce Events --
export function trackViewItem(product: GA4Product): void {
  const key = dedupeKey("view_item", product.item_id);
  if (_sentEvents.has(key)) return;
  // Clear previous view_item entries so revisiting a product later still fires
  for (const k of _sentEvents) {
    if (k.startsWith("view_item:")) _sentEvents.delete(k);
  }
  _sentEvents.add(key);
  pushDataLayer({
    event: "view_item",
    ecommerce: {
      currency: product.currency,
      value: product.price,
      items: [product],
    },
  });
}

export function trackAddToCart(product: GA4Product, quantity: number): void {
  const item = { ...product, quantity };
  pushDataLayer({
    event: "add_to_cart",
    ecommerce: {
      currency: product.currency,
      value: product.price * quantity,
      items: [item],
    },
  });
}

export function trackRemoveFromCart(
  product: GA4Product,
  quantity: number,
): void {
  pushDataLayer({
    event: "remove_from_cart",
    ecommerce: {
      currency: product.currency,
      value: product.price * quantity,
      items: [{ ...product, quantity }],
    },
  });
}

export function trackBeginCheckout(params: {
  currency: string;
  value: number;
  items: GA4Product[];
  coupon?: string;
}): void {
  pushDataLayer({ event: "begin_checkout", ecommerce: params });
}

export function trackPurchase(params: {
  transaction_id: string;
  currency: string;
  value: number;
  tax: number;
  shipping: number;
  items: GA4Product[];
  coupon?: string;
}): void {
  const key = dedupeKey("purchase", params.transaction_id);
  if (_sentEvents.has(key)) return;
  _sentEvents.add(key);
  pushDataLayer({ event: "purchase", ecommerce: params });
}

export function trackSearch(query: string): void {
  pushDataLayer({ event: "search", search_term: query });
}

// Window type augmentation
declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    fbq?: (...args: unknown[]) => void;
    ttq?: Record<string, (...args: unknown[]) => void>;
  }
}
