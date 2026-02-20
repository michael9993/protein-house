import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text, Button } from "@/components/ui/primitives";
import { useRouter } from "next/router";

import { trpcClient } from "@/modules/trpc/trpc-client";
import { NavBar } from "@/components/ui/NavBar";

function SupplierList() {
  const router = useRouter();
  const { data: suppliers, isLoading, error, refetch } = trpcClient.suppliers.list.useQuery();
  const toggleMutation = trpcClient.suppliers.toggle.useMutation({
    onSuccess: () => refetch(),
  });

  if (isLoading) {
    return (
      <Box padding={8}>
        <Text variant="heading" size="large">Loading suppliers...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box padding={8}>
        <Text variant="heading" size="large" color="critical1">Error loading suppliers</Text>
        <Text>{error.message}</Text>
      </Box>
    );
  }

  if (!suppliers) return null;

  return (
    <Box display="flex" flexDirection="column" gap={6}>
      <NavBar />

      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Text variant="heading" size="large">Suppliers</Text>
          <Text color="default2">Manage dropshipping supplier connections</Text>
        </Box>
      </Box>

      <Box display="flex" flexDirection="column" gap={3}>
        {suppliers.map((supplier) => (
          <Box
            key={supplier.id}
            padding={5}
            borderRadius={4}
            borderWidth={1}
            borderStyle="solid"
            borderColor="default1"
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box display="flex" flexDirection="column" gap={1}>
              <Text variant="heading" size="medium">{supplier.name}</Text>
              <Box display="flex" gap={4} alignItems="center">
                <Box
                  paddingX={3}
                  paddingY={1}
                  borderRadius={4}
                  backgroundColor={
                    supplier.status === "connected"
                      ? "success1"
                      : supplier.status === "error"
                        ? "critical1"
                        : supplier.status === "token_expiring"
                          ? "warning1"
                          : "default2"
                  }
                >
                  <Text variant="caption">{supplier.status.replace("_", " ").toUpperCase()}</Text>
                </Box>
                <Text color="default2" variant="caption">
                  Type: {supplier.type}
                </Text>
                {supplier.lastConnectedAt && (
                  <Text color="default2" variant="caption">
                    Last connected: {new Date(supplier.lastConnectedAt).toLocaleDateString()}
                  </Text>
                )}
                {supplier.tokenExpiresAt && (
                  <Text color="default2" variant="caption">
                    Token expires: {new Date(supplier.tokenExpiresAt).toLocaleDateString()}
                  </Text>
                )}
              </Box>
            </Box>

            <Box display="flex" gap={2} alignItems="center">
              <Button
                variant="secondary"
                size="small"
                onClick={() => router.push(`/suppliers/${supplier.type}`)}
              >
                Configure
              </Button>
              <Button
                variant={supplier.enabled ? "primary" : "secondary"}
                size="small"
                disabled={toggleMutation.isLoading}
                onClick={() =>
                  toggleMutation.mutate({
                    supplierId: supplier.id,
                    enabled: !supplier.enabled,
                  })
                }
              >
                {supplier.enabled ? "Disable" : "Enable"}
              </Button>
            </Box>
          </Box>
        ))}
      </Box>

      {suppliers.length === 0 && (
        <Box padding={8} display="flex" justifyContent="center">
          <Text color="default2">No suppliers configured</Text>
        </Box>
      )}
    </Box>
  );
}

export default function SuppliersPage() {
  const { appBridgeState } = useAppBridge();

  if (!appBridgeState?.ready) {
    return (
      <Box padding={8}>
        <Text>Connecting to Saleor Dashboard...</Text>
      </Box>
    );
  }

  return <SupplierList />;
}
