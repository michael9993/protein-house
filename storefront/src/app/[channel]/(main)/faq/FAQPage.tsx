"use client";

import { useState } from "react";
import { useStoreConfig } from "@/providers/StoreConfigProvider";
import { useFaqText } from "@/providers/StoreConfigProvider";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  name: string;
  icon: string;
  items: FAQItem[];
}

const defaultCategories: FAQCategory[] = [
  {
    name: "Orders & Shipping",
    icon: "📦",
    items: [
      { question: "How long does shipping take?", answer: "Standard shipping takes 3-5 business days." },
      { question: "Do you offer free shipping?", answer: "Yes! We offer free standard shipping on qualifying orders." },
    ],
  },
];

function FAQAccordion({ items }: { items: FAQItem[] }) {
  const { branding } = useStoreConfig();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl transition-all"
          style={{
            backgroundColor: branding.colors.surface,
            border: `1px solid ${branding.colors.textMuted}20`,
          }}
        >
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="flex w-full items-center justify-between px-6 py-4 text-left"
          >
            <span
              className="font-medium"
              style={{ color: branding.colors.text }}
            >
              {item.question}
            </span>
            <svg
              className={`h-5 w-5 flex-shrink-0 transition-transform ${
                openIndex === index ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke={branding.colors.textMuted}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {openIndex === index && (
            <div
              className="border-t px-6 py-4"
              style={{ borderColor: `${branding.colors.textMuted}20` }}
            >
              <p
                className="text-sm leading-relaxed"
                style={{ color: branding.colors.textMuted }}
              >
                {item.answer}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function FAQPage() {
  const { store, branding, pages } = useStoreConfig();
  const faqText = useFaqText();

  const faqCategories: FAQCategory[] = (faqText.categories as FAQCategory[] | undefined) ?? defaultCategories;

  const [activeCategory, setActiveCategory] = useState(faqCategories[0]?.name ?? "");
  const [searchQuery, setSearchQuery] = useState("");

  if (!pages.faq) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-lg text-neutral-500">This page is not available.</p>
      </div>
    );
  }

  const filteredCategories = searchQuery
    ? faqCategories.map(cat => ({
        ...cat,
        items: cat.items.filter(
          item =>
            item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.answer.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(cat => cat.items.length > 0)
    : faqCategories;

  const activeItems = searchQuery
    ? filteredCategories.flatMap(cat => cat.items)
    : faqCategories.find(cat => cat.name === activeCategory)?.items || [];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden py-16 sm:py-20"
        style={{ backgroundColor: branding.colors.secondary }}
      >
        <div
          className="absolute -right-20 top-20 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: branding.colors.primary }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="heading text-4xl font-bold text-white sm:text-5xl">
              {faqText.heroTitle ?? "How Can We Help?"}
            </h1>
            <p className="mt-4 text-lg text-white/80">
              {faqText.heroDescription ?? "Find answers to frequently asked questions about orders, shipping, returns, and more."}
            </p>

            {/* Search */}
            <div className="mt-8">
              <div className="relative">
                <svg
                  className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="white"
                  opacity={0.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={faqText.searchPlaceholder ?? "Search for answers..."}
                  className="w-full rounded-full border-0 bg-white/10 py-4 pl-12 pr-6 text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {searchQuery ? (
            <div>
              <p
                className="mb-8 text-sm"
                style={{ color: branding.colors.textMuted }}
              >
                {(faqText.resultsLabel ?? "{count} result(s) for \"{query}\"")
                  .replace("{count}", String(activeItems.length))
                  .replace("{query}", searchQuery)}
              </p>
              {activeItems.length > 0 ? (
                <FAQAccordion items={activeItems} />
              ) : (
                <div className="rounded-xl p-12 text-center" style={{ backgroundColor: branding.colors.surface }}>
                  <p style={{ color: branding.colors.textMuted }}>
                    {faqText.noResultsText ?? "No results found. Try a different search term or"}{" "}
                    <LinkWithChannel
                      href="/contact"
                      className="font-medium underline"
                      style={{ color: branding.colors.primary }}
                    >
                      {faqText.contactUsLink ?? "contact us"}
                    </LinkWithChannel>
                    .
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid gap-12 lg:grid-cols-[280px_1fr]">
              {/* Category Sidebar */}
              <div className="lg:sticky lg:top-24 lg:self-start">
                <h2
                  className="mb-4 text-sm font-semibold uppercase tracking-wider"
                  style={{ color: branding.colors.textMuted }}
                >
                  {faqText.categoriesLabel ?? "Categories"}
                </h2>
                <nav className="space-y-2">
                  {faqCategories.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => setActiveCategory(category.name)}
                      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                        activeCategory === category.name ? "font-medium" : ""
                      }`}
                      style={{
                        backgroundColor: activeCategory === category.name
                          ? `${branding.colors.primary}15`
                          : "transparent",
                        color: activeCategory === category.name
                          ? branding.colors.primary
                          : branding.colors.text,
                      }}
                    >
                      <span className="text-xl">{category.icon}</span>
                      <span>{category.name}</span>
                      <span
                        className="ms-auto text-sm"
                        style={{ color: branding.colors.textMuted }}
                      >
                        {category.items.length}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* FAQ Items */}
              <div>
                <h2
                  className="mb-6 text-2xl font-bold"
                  style={{ color: branding.colors.text }}
                >
                  {activeCategory}
                </h2>
                <FAQAccordion items={activeItems} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Still Need Help */}
      <section
        className="py-16"
        style={{ backgroundColor: branding.colors.surface }}
      >
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="text-4xl">💬</div>
          <h2
            className="mt-4 heading text-2xl font-bold"
            style={{ color: branding.colors.text }}
          >
            {faqText.stillHaveQuestionsTitle ?? "Still Have Questions?"}
          </h2>
          <p
            className="mt-2"
            style={{ color: branding.colors.textMuted }}
          >
            {faqText.stillHaveQuestionsDescription ?? "Our support team is available 24/7 to help you out."}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <LinkWithChannel
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white transition-all hover:scale-105"
              style={{ backgroundColor: branding.colors.primary }}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {faqText.contactUsButton ?? "Contact Us"}
            </LinkWithChannel>
            {store.phone && (
              <a
                href={`tel:${store.phone}`}
                className="inline-flex items-center gap-2 rounded-full border-2 px-6 py-3 font-semibold transition-all hover:opacity-80"
                style={{
                  borderColor: branding.colors.primary,
                  color: branding.colors.primary,
                }}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {faqText.callUsButton ?? "Call Us"}
              </a>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
