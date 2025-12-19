import { storeConfig } from "@/config";
import { FAQPage } from "./FAQPage";

export const metadata = {
  title: `FAQ | ${storeConfig.store.name}`,
  description: `Frequently asked questions about ${storeConfig.store.name}. Find answers to common questions about orders, shipping, returns, and more.`,
};

export default function Page() {
  return <FAQPage />;
}

