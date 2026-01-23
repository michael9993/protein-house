import { Breadcrumbs } from "@saleor/apps-ui";
import { Box } from "@saleor/macaw-ui";

import { Navigation } from "./navigation";

interface BasicLayoutProps {
  children: React.ReactNode;
  isLoading?: boolean;
  breadcrumbs?: { name: string; href?: string }[];
}

export const BasicLayout = ({ children, breadcrumbs, isLoading = false }: BasicLayoutProps) => {
  return (
    <Box padding={7} display="grid" gap={10}>
      <Navigation />
      {breadcrumbs?.length && (
        <Breadcrumbs>
          {breadcrumbs.map((breadcrumb) => (
            <Breadcrumbs.Item key={breadcrumb.name} href={breadcrumb.href}>
              {breadcrumb.name}
            </Breadcrumbs.Item>
          ))}
        </Breadcrumbs>
      )}
      {children}
    </Box>
  );
};
