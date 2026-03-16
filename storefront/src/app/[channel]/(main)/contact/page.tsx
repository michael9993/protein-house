import { storeConfig } from "@/config";
import { ContactPage } from "./ContactPage";

export const metadata = {
  title: "Contact Us",
  description: `Get in touch with ${storeConfig.store.name}. We're here to help!`,
};

export default function Page() {
  return <ContactPage />;
}

