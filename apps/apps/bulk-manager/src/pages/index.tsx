import { Box, Text } from "@saleor/macaw-ui";
import Link from "next/link";
import { AppLayout, colors } from "@/modules/ui/app-layout";

interface EntityCard {
  label: string;
  description: string;
  href: string;
  features: string[];
  icon: string;
}

const entities: EntityCard[] = [
  {
    label: "Products",
    description: "Bulk import/export products and variants with pricing and stock",
    href: "/products",
    features: ["CSV/Excel Import", "Export", "Upsert Mode", "Bulk Delete", "Template"],
    icon: "P",
  },
  {
    label: "Categories",
    description: "Manage product categories in bulk with parent relationships",
    href: "/categories",
    features: ["CSV/Excel Import", "Export", "Upsert Mode", "Bulk Delete", "Template"],
    icon: "C",
  },
  {
    label: "Collections",
    description: "Create and manage collections with product assignments",
    href: "/collections",
    features: ["CSV/Excel Import", "Export", "Upsert Mode", "Bulk Delete", "Template"],
    icon: "L",
  },
  {
    label: "Customers",
    description: "Import customer accounts and export customer data",
    href: "/customers",
    features: ["CSV/Excel Import", "Export", "Upsert Mode", "Bulk Delete", "Template"],
    icon: "U",
  },
  {
    label: "Orders",
    description: "Export order data, bulk fulfill, and bulk cancel orders",
    href: "/orders",
    features: ["Export", "Bulk Fulfill", "Bulk Cancel", "Status Filters", "Date Range"],
    icon: "O",
  },
  {
    label: "Vouchers",
    description: "Import and export discount vouchers and coupon codes",
    href: "/vouchers",
    features: ["CSV/Excel Import", "Export", "Upsert Mode", "Bulk Delete", "Template"],
    icon: "V",
  },
  {
    label: "Gift Cards",
    description: "Import and export gift cards with balances and expiry dates",
    href: "/gift-cards",
    features: ["CSV/Excel Import", "Export", "Upsert Mode", "Bulk Delete", "Template"],
    icon: "G",
  },
  {
    label: "Translations",
    description: "Import translations for products, categories, and collections in any language",
    href: "/translations",
    features: ["CSV/Excel Import", "Multi-Language", "Products", "Categories", "Collections", "Template"],
    icon: "T",
  },
];

export default function DashboardPage() {
  return (
    <AppLayout>
      <Box>
        <Text variant="heading" size={6} __fontWeight="700" __display="block" __color={colors.text}>
          Bulk Manager
        </Text>
        <Text size={3} __color={colors.textMuted} __display="block" marginBottom={8}>
          Import, export, and perform batch operations on your store data
        </Text>

        <Box
          display="grid"
          __gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))"
          gap={6}
        >
          {entities.map((entity) => (
            <Link
              key={entity.href}
              href={entity.href}
              style={{ textDecoration: "none" }}
            >
              <Box
                padding={6}
                borderRadius={4}
                __border={`1px solid ${colors.border}`}
                __transition="all 0.2s ease"
                cursor="pointer"
                __height="100%"
                __display="flex"
                __flexDirection="column"
              >
                <Box display="flex" alignItems="center" gap={3} marginBottom={3}>
                  <Box
                    __width="40px"
                    __height="40px"
                    borderRadius={4}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    __backgroundColor={colors.accentBg}
                    __color={colors.brand}
                    __fontSize="16px"
                    __fontWeight="700"
                  >
                    {entity.icon}
                  </Box>
                  <Text variant="heading" size={4} __fontWeight="600" __color={colors.text}>
                    {entity.label}
                  </Text>
                </Box>

                <Text size={2} __color={colors.textMuted} __display="block" marginBottom={4}>
                  {entity.description}
                </Text>

                <Box display="flex" __flexWrap="wrap" gap={2} __marginTop="auto">
                  {entity.features.map((feature) => (
                    <Box
                      key={feature}
                      __padding="2px 8px"
                      borderRadius={4}
                      __backgroundColor={colors.badgeBg}
                    >
                      <Text size={1} __color={colors.badgeText}>
                        {feature}
                      </Text>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Link>
          ))}
        </Box>
      </Box>
    </AppLayout>
  );
}
