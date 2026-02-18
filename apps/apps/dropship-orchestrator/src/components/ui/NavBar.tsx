import { Box, Button } from "@saleor/macaw-ui";
import { useRouter } from "next/router";

export const NAV_ITEMS = [
  { label: "Dashboard", path: "/" },
  { label: "Suppliers", path: "/suppliers" },
  { label: "Orders", path: "/orders" },
  { label: "Exceptions", path: "/exceptions" },
  { label: "Settings", path: "/settings" },
  { label: "Audit Log", path: "/audit" },
] as const;

export function NavBar() {
  const router = useRouter();
  const currentPath = router.pathname;

  function isActive(itemPath: string): boolean {
    if (itemPath === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(itemPath);
  }

  return (
    <Box display="flex" gap={2} marginBottom={6} flexWrap="wrap">
      {NAV_ITEMS.map((item) => (
        <Button
          key={item.path}
          variant={isActive(item.path) ? "primary" : "secondary"}
          size="small"
          onClick={() => router.push(item.path)}
        >
          {item.label}
        </Button>
      ))}
    </Box>
  );
}
