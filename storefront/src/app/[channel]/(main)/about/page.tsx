import { storeConfig } from "@/config";
import { AboutPage } from "./AboutPage";
import { getCMSPage } from "@/lib/cms";

export const metadata = {
  title: "About Us",
  description: `Learn about ${storeConfig.store.name} - ${storeConfig.store.tagline}`,
};

/**
 * About Page
 * 
 * Content can be managed in: Dashboard > Content > Pages
 * Create a page with slug "about" to customize content.
 * 
 * The page content (rich text/HTML) will be displayed in the main section.
 * If no CMS page exists, default content is shown.
 */
export default async function Page() {
  // Fetch about page content from Dashboard > Content > Pages
  const cmsPage = await getCMSPage("about");
  
  return <AboutPage cmsContent={cmsPage} />;
}

