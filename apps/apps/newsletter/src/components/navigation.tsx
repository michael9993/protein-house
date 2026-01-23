import { Box, Button, Text } from "@saleor/macaw-ui";
import { useRouter } from "next/router";

interface NavigationItem {
  label: string;
  path: string;
  icon?: string;
}

const navigationItems: NavigationItem[] = [
  { label: "Home", path: "/", icon: "🏠" },
  { label: "Subscribers", path: "/subscribers", icon: "👥" },
  { label: "Templates", path: "/templates", icon: "📧" },
  { label: "Campaigns", path: "/campaigns", icon: "📢" },
  { label: "Images", path: "/images", icon: "🖼️" },
];

export const Navigation = () => {
  const router = useRouter();

  return (
    <Box
      display="flex"
      gap={2}
      padding={4}
      borderBottomWidth={1}
      borderBottomStyle="solid"
      borderColor="default1"
      marginBottom={4}
      flexWrap="wrap"
    >
      {navigationItems.map((item) => {
        const isActive = router.pathname === item.path || 
          (item.path !== "/" && router.pathname.startsWith(item.path));
        
        return (
          <Button
            key={item.path}
            variant={isActive ? "primary" : "secondary"}
            size="small"
            onClick={() => router.push(item.path)}
          >
            {item.icon && <Text marginRight={1}>{item.icon}</Text>}
            {item.label}
          </Button>
        );
      })}
    </Box>
  );
};
