import { useUser } from "@dashboard/auth";
import {
  OrderDetailsWithMetadataDocument,
  PermissionEnum,
  useOrderSendRefundMutation,
} from "@dashboard/graphql";
import { renderHook } from "@testing-library/react";

import { useOrderSendRefund } from "./useOrderSendRefund";

const mockSendRefund = vi.fn();

vi.mock("@dashboard/auth");
vi.mock("@dashboard/graphql");

describe("useOrderSendRefund", () => {
  it("should pass correct variables to mutation hook with required permissions", async () => {
    // Arrange
    vi.mocked(useUser).mockReturnValue({
      user: {
        userPermissions: [{ code: PermissionEnum.MANAGE_PRODUCTS }],
      },
    });

    const mockData = { data: { orderSendRefund: { success: true } } };

    vi.mocked(useOrderSendRefundMutation).mockReturnValue([
      mockSendRefund,
      { status: "success", loading: false, error: null, data: mockData },
    ]);

    // Act
    renderHook(() => useOrderSendRefund({ transactionId: "123", orderId: "456", amount: 100 }));

    // Assert
    expect(useOrderSendRefundMutation).toHaveBeenCalledWith({
      refetchQueries: [
        {
          query: OrderDetailsWithMetadataDocument,
          variables: { id: "456", hasManageProducts: true },
        },
      ],
      variables: {
        transactionId: "123",
        amount: 100,
      },
    });
  });

  it("should pass correct variables to mutation hook without required permissions", async () => {
    // Arrange
    vi.mocked(useUser).mockReturnValue({
      user: {
        userPermissions: [{ code: PermissionEnum.MANAGE_ORDERS }],
      },
    });

    const mockData = { data: { orderSendRefund: { success: true } } };

    vi.mocked(useOrderSendRefundMutation).mockReturnValue([
      mockSendRefund,
      { status: "success", loading: false, error: null, data: mockData },
    ]);

    // Act
    renderHook(() => useOrderSendRefund({ transactionId: "123", orderId: "456", amount: 100 }));

    // Assert
    expect(useOrderSendRefundMutation).toHaveBeenCalledWith({
      refetchQueries: [
        {
          query: OrderDetailsWithMetadataDocument,
          variables: { id: "456", hasManageProducts: false },
        },
      ],
      variables: {
        transactionId: "123",
        amount: 100,
      },
    });
  });
});
