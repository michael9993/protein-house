import { AppLayout } from "@/components/layout/AppLayout";
import { TemplateBrowser } from "@/components/templates/TemplateBrowser";

export default function TemplatesPage() {
  return (
    <AppLayout
      activePage="templates"
      title="Templates"
      description="Pre-built e-commerce image templates"
    >
      <TemplateBrowser />
    </AppLayout>
  );
}
