import { Box, Text, PropsWithBox } from "@saleor/macaw-ui";
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
];

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
        __backgroundColor={isActive ? "rgba(59, 130, 246, 0.1)" : undefined}
        __borderLeft={isActive ? "3px solid #3b82f6" : "3px solid transparent"}
        __transition="all 0.15s ease"
      >
        <Box
          __width="28px"
          __height="28px"
          borderRadius={4}
          display="flex"
          alignItems="center"
          justifyContent="center"
          __backgroundColor={isActive ? "#3b82f6" : "#e5e7eb"}
          __color={isActive ? "white" : "#6b7280"}
          __fontSize="12px"
          __fontWeight="600"
        >
          {item.icon}
        </Box>
        <Text
          size={3}
          __fontWeight={isActive ? "600" : "400"}
          __color={isActive ? "#1e293b" : "#64748b"}
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
        __borderRight="1px solid #e2e8f0"
        paddingRight={4}
      >
        <Box marginBottom={6}>
          <Text variant="heading" size={5} __fontWeight="700">
            Bulk Manager
          </Text>
          <Text size={2} __color="#94a3b8" __display="block" __marginTop="4px">
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
