"use client";

import { useFooterConfig, useFooterText, useStoreConfig } from "@/providers/StoreConfigProvider";
import { PolicyContentBlock } from "./PolicyContentBlock";
import type { StoreConfig } from "@/config/store.config";

type PolicyKey = "returnPolicy" | "shippingPolicy" | "privacyPolicy" | "termsOfService" | "accessibility";

const FALLBACK_TITLE_KEY: Record<PolicyKey, keyof NonNullable<ReturnType<typeof useFooterText>>> = {
  returnPolicy: "returnPolicyLink",
  shippingPolicy: "shippingLink",
  privacyPolicy: "privacyPolicyLink",
  termsOfService: "termsOfServiceLink",
  accessibility: "privacyPolicyLink", // fallback only — actual title from config
};

const POLICY_TO_PAGE_KEY: Record<PolicyKey, keyof StoreConfig["pages"]> = {
  returnPolicy: "returnPolicy",
  shippingPolicy: "shippingPolicy",
  privacyPolicy: "privacyPolicy",
  termsOfService: "termsOfService",
  accessibility: "privacyPolicy", // accessibility uses same page display pattern
};

/**
 * Shared policy page layout: title, optional header, main content (content || defaultContent || emptyMessage), optional footer.
 * Content supports simple markup: ## heading, ### subheading, * bullets, **bold**.
 * All text from Storefront Control → Footer → Policy Page Content. Nothing hardcoded.
 */
export function PolicyPageView({ policyKey }: { policyKey: PolicyKey }) {
  const { pages } = useStoreConfig();
  const footerConfig = useFooterConfig();
  const footerText = useFooterText();

  if (!pages[POLICY_TO_PAGE_KEY[policyKey]]) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-lg text-neutral-500">This page is not available.</p>
      </div>
    );
  }

  const footerConfigRecord = footerConfig as unknown as Record<string, string | undefined>;
  const pageTitle =
    footerConfigRecord[`${policyKey}PageTitle`]?.trim() ||
    (footerText?.[FALLBACK_TITLE_KEY[policyKey]] as string | undefined) ||
    "";
  const header = footerConfigRecord[`${policyKey}Header`]?.trim() || "";
  const content = footerConfigRecord[`${policyKey}Content`]?.trim() || "";
  const defaultContent = footerConfigRecord[`${policyKey}DefaultContent`]?.trim() || "";
  const footer = footerConfigRecord[`${policyKey}Footer`]?.trim() || "";
  const emptyMessage = footerConfig?.policyPageEmptyMessage?.trim() ?? "";

  const mainText = content || defaultContent || emptyMessage;

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 pb-20 sm:px-6 lg:px-8" dir="auto">
      <header className="mb-10 border-b pb-8" style={{ borderColor: "var(--store-neutral-200)" }}>
        {pageTitle ? (
          <h1
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: "var(--store-text)" }}
          >
            {pageTitle}
          </h1>
        ) : null}
      </header>

      {header ? (
        <div
          className="mb-8 rounded-xl border px-5 py-4 text-base shadow-sm"
          style={{
            color: "var(--store-text)",
            borderColor: "var(--store-neutral-200)",
            backgroundColor: "var(--store-neutral-50)",
          }}
        >
          <PolicyContentBlock text={header} />
        </div>
      ) : null}

      <div
        className="rounded-xl border px-6 py-6 shadow-sm sm:px-8 sm:py-8"
        style={{
          color: "var(--store-text)",
          borderColor: "var(--store-neutral-200)",
          backgroundColor: "var(--store-bg)",
        }}
      >
        <PolicyContentBlock text={mainText} className="policy-content" />
      </div>

      {footer ? (
        <footer
          className="mt-8 rounded-xl border px-5 py-4 text-sm"
          style={{
            color: "var(--store-text-muted)",
            borderColor: "var(--store-neutral-200)",
          }}
        >
          <PolicyContentBlock text={footer} />
        </footer>
      ) : null}
    </article>
  );
}
