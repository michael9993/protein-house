export interface SearchEntry {
  /** Full config path, e.g. "content.cart.cartTitle" */
  fieldPath: string;
  /** Human-readable label, e.g. "Cart Title" */
  label: string;
  /** Breadcrumb trail, e.g. "Content > Shop > Cart Page" */
  description: string;
  /** English default value (searchable for content fields) */
  defaultValue?: string;
  /** Field type for icon display */
  fieldType: "text" | "boolean" | "number" | "color" | "enum" | "array" | "object" | "action";
  /** Admin page route */
  page: string;
  /** Tab within the page */
  tab: string;
  /** Section anchor ID for scroll-to */
  sectionId: string;
  /** Form field name (path relative to the page form) */
  formFieldName: string;
  /** Display category (Store, Design, Pages, Commerce, Content, Integrations) */
  category: string;
  /** Extra search terms */
  keywords: string[];
}

export interface LocationRule {
  /** Config path prefix to match */
  prefix: string;
  /** Admin page route */
  page: string;
  /** Tab slug */
  tab: string;
  /** Section anchor ID */
  sectionId: string;
  /** Display category */
  category: string;
  /** Human-readable section name for breadcrumb */
  sectionLabel: string;
  /** Prefix to strip from fieldPath to get formFieldName */
  formPrefix?: string;
}
