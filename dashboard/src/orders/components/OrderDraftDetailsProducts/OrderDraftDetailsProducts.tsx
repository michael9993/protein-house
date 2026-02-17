import { OrderDetailsFragment, OrderErrorFragment } from "@dashboard/graphql";
import { Skeleton } from "@saleor/macaw-ui-next";

import { OrderDraftDetailsDatagrid } from "../OrderDraftDetailsDatagrid/OrderDraftDetailsDatagrid";

export interface FormData {
  quantity: number;
}

interface OrderDraftDetailsProductsProps {
  order?: OrderDetailsFragment;
  errors: OrderErrorFragment[];
  loading: boolean;
  onOrderLineChange: (id: string, data: FormData) => void;
  onOrderLineRemove: (id: string) => void;
  onOrderLineShowMetadata: (id: string) => void;
}

const OrderDraftDetailsProducts = ({
  order,
  errors,
  loading,
  onOrderLineChange,
  onOrderLineRemove,
  onOrderLineShowMetadata,
}: OrderDraftDetailsProductsProps) => {
  const lines = order?.lines ?? [];
  const formErrors = errors.filter(error => error.field === "lines");

  if (order === undefined) {
    return <Skeleton className="mx-8" />;
  }

  return (
    <OrderDraftDetailsDatagrid
      lines={lines}
      loading={loading}
      onOrderLineRemove={onOrderLineRemove}
      onOrderLineChange={onOrderLineChange}
      errors={formErrors}
      onOrderLineShowMetadata={onOrderLineShowMetadata}
    />
  );
};

OrderDraftDetailsProducts.displayName = "OrderDraftDetailsProducts";
export default OrderDraftDetailsProducts;
