import { fetchStorefrontConfig } from "@/lib/storefront-control";
import { FAQPage } from "./FAQPage";

export const metadata = {
  title: "FAQ",
  description: "Frequently asked questions. Find answers to common questions about orders, shipping, returns, and more.",
};

export default async function Page(props: { params: Promise<{ channel: string }> }) {
  const { channel } = await props.params;
  const config = await fetchStorefrontConfig(channel);

  // Build FAQ JSON-LD from config
  const faqData = (config.content as Record<string, unknown> | undefined)?.faq as { categories?: Array<{ name: string; items: Array<{ question: string; answer: string }> }> } | undefined;
  const categories = faqData?.categories;
  const allItems = categories?.flatMap((cat) => cat.items) || [];

  const faqJsonLd = allItems.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  } : null;

  return (
    <>
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <FAQPage />
    </>
  );
}

