import { MessageSquare } from "lucide-react";

interface Prompt {
  label: string;
  text: string;
}

function isEntityDetail(pathname: string, prefix: string): boolean {
  const match = pathname.match(new RegExp(`^${prefix}/([^/]+)$`));
  return !!match && !["add", "drafts"].includes(match[1]);
}

function getContextualPrompts(pathname: string): Prompt[] {
  // Entity detail pages get more specific prompts
  if (isEntityDetail(pathname, "/orders")) {
    return [
      { label: "What should I do with this order?", text: "Based on this order's current status, what are my next steps?" },
      { label: "Fulfill this order", text: "Walk me through fulfilling this order step by step." },
      { label: "Issue a refund", text: "How do I process a refund for this order?" },
      { label: "Why can't I fulfill?", text: "This order can't be fulfilled. What could be wrong?" },
    ];
  }

  if (isEntityDetail(pathname, "/products")) {
    return [
      { label: "What's missing on this product?", text: "Review this product's setup. What might be missing or incomplete?" },
      { label: "Publish to channels", text: "How do I publish this product to all channels?" },
      { label: "Add variants", text: "How do I add size and color variants to this product?" },
      { label: "Why isn't it on the storefront?", text: "This product isn't showing on the storefront. What could be wrong?" },
    ];
  }

  if (isEntityDetail(pathname, "/customers")) {
    return [
      { label: "Customer overview", text: "Give me a summary of this customer's activity and history." },
      { label: "View their orders", text: "How do I see all orders from this customer?" },
      { label: "Add a note", text: "How do I add a note to this customer's profile?" },
      { label: "Manage addresses", text: "How do I edit or add addresses for this customer?" },
    ];
  }

  // List pages
  if (pathname.startsWith("/orders")) {
    return [
      { label: "How do I fulfill an order?", text: "How do I fulfill an order and add a tracking number?" },
      { label: "How do refunds work?", text: "How do I process a refund for an order?" },
      { label: "What are draft orders?", text: "What are draft orders and when should I use them?" },
      { label: "Order statuses explained", text: "Explain the different order statuses and what they mean." },
    ];
  }

  if (pathname.startsWith("/products")) {
    return [
      { label: "How do I create a product?", text: "Walk me through creating a new product with variants." },
      { label: "Managing inventory", text: "How do I manage stock levels across warehouses?" },
      { label: "Product types explained", text: "What are product types and how do attributes work?" },
      { label: "Bulk import products", text: "How can I bulk import products from a CSV file?" },
    ];
  }

  if (pathname.startsWith("/customers")) {
    return [
      { label: "Customer management", text: "What can I do on the customer management page?" },
      { label: "Customer groups", text: "How can I segment customers for targeted promotions?" },
      { label: "Order history", text: "How do I view a customer's order history?" },
      { label: "Bulk import customers", text: "How can I bulk import customers from a spreadsheet?" },
    ];
  }

  if (pathname.startsWith("/discounts") || pathname.startsWith("/vouchers")) {
    return [
      { label: "Discounts vs vouchers", text: "What's the difference between discounts and vouchers?" },
      { label: "Create a voucher", text: "How do I create a percentage-off voucher code?" },
      { label: "Auto discounts", text: "How do automatic discounts work? When do they apply?" },
      { label: "Usage limits", text: "Can I limit how many times a voucher can be used?" },
    ];
  }

  if (pathname.startsWith("/shipping")) {
    return [
      { label: "Set up shipping", text: "How do I set up shipping zones and rates?" },
      { label: "Weight-based rates", text: "How do I create weight-based shipping rates?" },
      { label: "Free shipping", text: "How can I offer free shipping above a certain order value?" },
      { label: "Multiple warehouses", text: "How does shipping work with multiple warehouses?" },
    ];
  }

  if (pathname.startsWith("/configuration")) {
    return [
      { label: "Tax configuration", text: "How do I configure taxes for different countries?" },
      { label: "Permission groups", text: "How do I set up staff permissions and access control?" },
      { label: "Channel settings", text: "How do channels work for multi-market selling?" },
      { label: "Site settings", text: "Where can I update store name, description, and contact info?" },
    ];
  }

  return [
    { label: "Getting started", text: "Give me an overview of the main dashboard sections and what I can do." },
    { label: "Configure storefront", text: "How do I customize the storefront appearance and homepage?" },
    { label: "Process orders", text: "Walk me through the order fulfillment workflow." },
    { label: "Manage products", text: "How do I add products with variants and set prices per channel?" },
  ];
}

interface SuggestedPromptsProps {
  pathname: string;
  onSelect: (text: string) => void;
}

export function SuggestedPrompts({ pathname, onSelect }: SuggestedPromptsProps) {
  const prompts = getContextualPrompts(pathname);

  return (
    <div className="flex h-full flex-col items-center justify-center px-2">
      <div className="mb-3 text-3xl">&#x2728;</div>
      <p className="mb-1 text-[13px] font-medium text-neutral-700">
        How can I help?
      </p>
      <p className="mb-4 text-[11px] text-neutral-400">
        Try one of these or ask your own question.
      </p>
      <div className="flex w-full flex-col gap-2">
        {prompts.map(p => (
          <button
            key={p.label}
            onClick={() => onSelect(p.text)}
            className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-transparent px-3 py-2.5 text-left text-[12px] text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <MessageSquare className="h-3.5 w-3.5 shrink-0 opacity-40" />
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
