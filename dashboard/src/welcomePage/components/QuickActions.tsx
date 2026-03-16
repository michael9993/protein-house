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
  AppWindow,
  BarChart3,
  Calculator,
  CreditCard,
  Database,
  FileText,
  ImagePlus,
  LayoutGrid,
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

// Known app icons — apps not listed here still show with a fallback icon
const appIcons: Record<string, LucideIcon> = {
  "Storefront Control": Sliders,
  "Sales Analytics": BarChart3,
  "Bulk Manager": Database,
  "Image Studio": ImagePlus,
  "Newsletter Management": Newspaper,
  "SMTP": Send,
  "Dropship Orchestrator": Truck,
  "Stripe": CreditCard,
  "Invoices": FileText,
  "Tax Manager": Calculator,
};

const getAppIcon = (name: string): LucideIcon => appIcons[name] ?? AppWindow;

export const QuickActions = ({ userPermissions }: QuickActionsProps) => {
  const { data: appsData } = useInstalledAppsListQuery({
    variables: { first: 100 },
  });

  const visibleActions = actions.filter(action =>
    hasPermissions(userPermissions, [action.permission]),
  );

  const installedApps = (appsData?.apps?.edges ?? [])
    .map(edge => edge.node)
    .filter(app => app.isActive && app.name)
    .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));

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
              const Icon = getAppIcon(app.name!);
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
