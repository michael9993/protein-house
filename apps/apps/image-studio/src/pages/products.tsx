import { useCallback } from "react";
import { useRouter } from "next/router";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProductBrowser } from "@/components/products/ProductBrowser";

export default function ProductsPage() {
  const router = useRouter();

  const handleEditImage = useCallback(
    (imageUrl: string) => {
      // Store in sessionStorage to avoid AppBridge RoutePropagator stripping the path
      sessionStorage.setItem("image-studio-pending-image", imageUrl);
      router.push("/editor");
    },
    [router]
  );

  return (
    <AppLayout
      activePage="products"
      title="Products"
      description="Browse and edit product images from your catalog"
    >
      <ProductBrowser onEditImage={handleEditImage} />
    </AppLayout>
  );
}
