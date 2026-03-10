import { Box, Text } from "@saleor/macaw-ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { ReactNode } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "H" },
  { label: "Products", href: "/products", icon: "P" },
  { label: "Categories", href: "/categories", icon: "C" },
  { label: "Collections", href: "/collections", icon: "L" },
  { label: "Customers", href: "/customers", icon: "U" },
  { label: "Orders", href: "/orders", icon: "O" },
  { label: "Vouchers", href: "/vouchers", icon: "V" },
  { label: "Gift Cards", href: "/gift-cards", icon: "G" },
  { label: "Translations", href: "/translations", icon: "T" },
];

// Color palette — matches sales-analytics & storefront-control apps
const colors = {
  brand: "#18181B",
  brandLight: "#3F3F46",
  surface: "#F9FAFB",
  surfaceAlt: "#FAFAFA",
  text: "#111827",
  textSecondary: "#374151",
  textMuted: "#6B7280",
  textLight: "#9CA3AF",
  border: "#E5E7EB",
  inputBorder: "#D1D5DB",
  accent: "#18181B",
  accentBg: "#F4F4F5",
  accentBgHover: "#E4E4E7",
  accentSubtle: "rgba(24, 24, 27, 0.05)",
  badgeBg: "#F4F4F5",
  badgeText: "#3F3F46",
  infoBg: "#F0F9FF",
  infoBorder: "#BAE6FD",
  infoText: "#0369A1",
};

function NavButton({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link href={item.href} style={{ textDecoration: "none", display: "block" }}>
      <Box
        padding={3}
        borderRadius={4}
        display="flex"
        alignItems="center"
        gap={3}
        cursor="pointer"
        __backgroundColor={isActive ? colors.accentBg : undefined}
        __borderLeft={isActive ? `3px solid ${colors.brand}` : "3px solid transparent"}
        __transition="all 0.15s ease"
      >
        <Box
          __width="28px"
          __height="28px"
          borderRadius={4}
          display="flex"
          alignItems="center"
          justifyContent="center"
          __backgroundColor={isActive ? colors.brand : colors.border}
          __color={isActive ? "white" : colors.textMuted}
          __fontSize="12px"
          __fontWeight="600"
        >
          {item.icon}
        </Box>
        <Text
          size={3}
          __fontWeight={isActive ? "600" : "400"}
          __color={isActive ? colors.text : colors.textMuted}
        >
          {item.label}
        </Text>
      </Box>
    </Link>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const currentPath = router.pathname;

  return (
    <Box display="flex" gap={8} __minHeight="calc(100vh - 80px)">
      {/* Sidebar */}
      <Box
        __width="220px"
        __minWidth="220px"
        __borderRight={`1px solid ${colors.border}`}
        paddingRight={4}
      >
        <Box marginBottom={6}>
          <Text variant="heading" size={5} __fontWeight="700" __color={colors.text}>
            Bulk Manager
          </Text>
          <Text size={2} __color={colors.textLight} __display="block" __marginTop="4px">
            Import, export & batch ops
          </Text>
        </Box>

        <Box display="flex" flexDirection="column" gap={1}>
          {navItems.map((item) => (
            <NavButton
              key={item.href}
              item={item}
              isActive={
                item.href === "/"
                  ? currentPath === "/"
                  : currentPath.startsWith(item.href)
              }
            />
          ))}
        </Box>
      </Box>

      {/* Main content */}
      <Box __flex="1" __minWidth="0">
        {children}
      </Box>
    </Box>
  );
}

// Exported for consistent colors across all bulk-manager pages
export { colors };
