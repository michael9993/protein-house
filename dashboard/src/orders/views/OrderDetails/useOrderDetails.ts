import { useOrderDetailsWithMetadataQuery } from "@dashboard/graphql";
import { useHasManageProductsPermission } from "@dashboard/orders/hooks/useHasManageProductsPermission";
import { useState, useCallback } from "react";

export const useOrderDetails = (id: string) => {
  const hasManageProducts = useHasManageProductsPermission();
  const [isRefetching, setIsRefetching] = useState(false);
  const { data, loading, refetch } = useOrderDetailsWithMetadataQuery({
    displayLoader: true,
    variables: { id, hasManageProducts },
  });

  const refetchWithLoading = useCallback(async () => {
    setIsRefetching(true);
    try {
      await refetch();
    } finally {
      setIsRefetching(false);
    }
  }, [refetch]);

  return {
    data,
    loading: loading || isRefetching,
    refetch: refetchWithLoading,
    isRefetching,
  };
};
