import { Button } from "@dashboard/components/Button";
import { hasPermissions } from "@dashboard/components/RequirePermissions";
import { categoryListUrl } from "@dashboard/categories/urls";
import { customerListUrl } from "@dashboard/customers/urls";
import { ExtensionsPaths } from "@dashboard/extensions/urls";
import {
  PermissionEnum,
  useInstalledAppsListQuery,
  type UserPermissionFragment,
} from "@dashboard/graphql";
import { orderListUrl } from "@dashboard/orders/urls";
import { productAddUrl } from "@dashboard/products/urls";
import { Box, Text } from "@saleor/macaw-ui-next";
import {
  BarChart3,
  Database,
  ImagePlus,
  LayoutGrid,
  Mail,
  Newspaper,
  Plus,
  Send,
  ShoppingCart,
  Sliders,
  Truck,
  Users,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { FormattedMessage } from "react-intl";

interface QuickActionsProps {
  userPermissions: UserPermissionFragment[];
}

const actions = [
  {
    label: <FormattedMessage defaultMessage="Add Product" id="dashboard-quick-add-product" />,
    icon: Plus,
    url: productAddUrl(),
    permission: PermissionEnum.MANAGE_PRODUCTS,
  },
  {
    label: <FormattedMessage defaultMessage="Orders" id="dashboard-quick-orders" />,
    icon: ShoppingCart,
    url: orderListUrl(),
    permission: PermissionEnum.MANAGE_ORDERS,
  },
  {
    label: <FormattedMessage defaultMessage="Customers" id="dashboard-quick-customers" />,
    icon: Users,
    url: customerListUrl(),
    permission: PermissionEnum.MANAGE_USERS,
  },
  {
    label: <FormattedMessage defaultMessage="Catalog" id="dashboard-quick-catalog" />,
    icon: LayoutGrid,
    url: categoryListUrl(),
    permission: PermissionEnum.MANAGE_PRODUCTS,
  },
];

const appMeta: Record<string, { icon: LucideIcon; order: number }> = {
  "Storefront Control": { icon: Sliders, order: 1 },
  "Sales Analytics": { icon: BarChart3, order: 2 },
  "Bulk Manager": { icon: Database, order: 3 },
  "Image Studio": { icon: ImagePlus, order: 4 },
  "Newsletter Management": { icon: Newspaper, order: 5 },
  "SMTP": { icon: Send, order: 6 },
  "Dropship Orchestrator": { icon: Truck, order: 7 },
};

export const QuickActions = ({ userPermissions }: QuickActionsProps) => {
  const { data: appsData } = useInstalledAppsListQuery({
    variables: { first: 100 },
  });

  const visibleActions = actions.filter(action =>
    hasPermissions(userPermissions, [action.permission]),
  );

  const installedApps = (appsData?.apps?.edges ?? [])
    .map(edge => edge.node)
    .filter(app => app.isActive && app.name && app.name in appMeta)
    .sort((a, b) => {
      const orderA = appMeta[a.name!]?.order ?? 99;
      const orderB = appMeta[b.name!]?.order ?? 99;
      return orderA - orderB;
    });

  return (
    <Box display="flex" flexDirection="column" gap={5}>
      {visibleActions.length > 0 && (
        <Box display="flex" flexDirection="column" gap={3}>
          <Text size={5} fontWeight="bold">
            <FormattedMessage defaultMessage="Quick Actions" id="dashboard-quick-actions-title" />
          </Text>
          <Box display="flex" gap={3} flexWrap="wrap">
            {visibleActions.map((action, index) => (
              <Button
                key={index}
                href={action.url}
                variant="secondary"
                size="medium"
                icon={<action.icon size={16} />}
              >
                {action.label}
              </Button>
            ))}
          </Box>
        </Box>
      )}

      {installedApps.length > 0 && (
        <Box display="flex" flexDirection="column" gap={3}>
          <Text size={5} fontWeight="bold">
            <FormattedMessage defaultMessage="Apps" id="dashboard-quick-apps-title" />
          </Text>
          <Box display="flex" gap={3} flexWrap="wrap">
            {installedApps.map(app => {
              const meta = appMeta[app.name!];
              const Icon = meta.icon;
              return (
                <Button
                  key={app.id}
                  href={ExtensionsPaths.resolveViewManifestExtension(app.id)}
                  variant="secondary"
                  size="medium"
                  icon={<Icon size={16} />}
                >
                  {app.name}
                </Button>
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
};
