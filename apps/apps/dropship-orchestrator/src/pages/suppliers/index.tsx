import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { useRouter } from "next/router";

import { NavBar } from "@/components/ui/NavBar";
import { trpcClient } from "@/modules/trpc/trpc-client";

function supplierStatusCls(status: string): string {
  switch (status) {
    case "connected":
      return "bg-green-50 text-green-800";
    case "error":
      return "bg-red-50 text-red-800";
    case "token_expiring":
      return "bg-yellow-50 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function SupplierList() {
  const router = useRouter();
  const { data: suppliers, isLoading, error, refetch } = trpcClient.suppliers.list.useQuery();
  const toggleMutation = trpcClient.suppliers.toggle.useMutation({
    onSuccess: () => refetch(),
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold text-text-primary">Loading suppliers...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold text-red-700">Error loading suppliers</h1>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  if (!suppliers) return null;

  return (
    <div className="flex flex-col gap-6">
      <NavBar />

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Suppliers</h1>
          <p className="text-sm text-text-muted">Manage dropshipping supplier connections</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="p-5 rounded-lg border border-border flex justify-between items-center"
          >
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold text-text-primary">{supplier.name}</h2>
              <div className="flex gap-4 items-center">
                <span className={`px-3 py-1 rounded-lg text-xs ${supplierStatusCls(supplier.status)}`}>
                  {supplier.status.replace("_", " ").toUpperCase()}
                </span>
                <span className="text-xs text-text-muted">
                  Type: {supplier.type}
                </span>
                {supplier.lastConnectedAt && (
                  <span className="text-xs text-text-muted">
                    Last connected: {new Date(supplier.lastConnectedAt).toLocaleDateString()}
                  </span>
                )}
                {supplier.tokenExpiresAt && (
                  <span className="text-xs text-text-muted">
                    Token expires: {new Date(supplier.tokenExpiresAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <button
                className="px-2.5 py-1 text-sm font-medium border border-border rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
                onClick={() => router.push(`/suppliers/${supplier.type}`)}
              >
                Configure
              </button>
              <button
                className={`px-2.5 py-1 text-sm font-medium rounded-md disabled:opacity-50 transition-colors ${
                  supplier.enabled
                    ? "text-white bg-brand hover:bg-brand-light"
                    : "border border-border hover:bg-gray-50"
                }`}
                disabled={toggleMutation.isLoading}
                onClick={() =>
                  toggleMutation.mutate({
                    supplierId: supplier.id,
                    enabled: !supplier.enabled,
                  })
                }
              >
                {supplier.enabled ? "Disable" : "Enable"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {suppliers.length === 0 && (
        <div className="p-8 flex justify-center">
          <p className="text-sm text-text-muted">No suppliers configured</p>
        </div>
      )}
    </div>
  );
}

export default function SuppliersPage() {
  const { appBridgeState } = useAppBridge();

  if (!appBridgeState?.ready) {
    return (
      <div className="p-8">
        <p className="text-sm">Connecting to Saleor Dashboard...</p>
      </div>
    );
  }

  return <SupplierList />;
}
