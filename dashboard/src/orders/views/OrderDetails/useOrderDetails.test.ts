import { useUser } from "@dashboard/auth";
import { PermissionEnum, useOrderDetailsWithMetadataQuery } from "@dashboard/graphql";
import { renderHook } from "@testing-library/react-hooks";

import { useOrderDetails } from "./useOrderDetails";

vi.mock("@dashboard/auth");
vi.mock("@dashboard/graphql");

describe("useOrderDetails", () => {
  it("should be called with MANAGE_PRODUCTS permission", () => {
    // Arrange
    vi.mocked(useUser).mockReturnValue({
      user: {
        userPermissions: [{ code: PermissionEnum.MANAGE_PRODUCTS }],
      },
    });

    const mockData = { order: { id: "1", name: "Test Order" } };

    vi.mocked(useOrderDetailsWithMetadataQuery).mockReturnValue({
      data: mockData,
      loading: false,
    });

    // Act
    const { result } = renderHook(() => useOrderDetails("1"));

    // Assert
    expect(useOrderDetailsWithMetadataQuery).toHaveBeenCalledWith({
      displayLoader: true,
      variables: { id: "1", hasManageProducts: true },
    });
    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
  });

  it("should not be called with MANAGE_PRODUCTS permission", () => {
    // Arrange
    vi.mocked(useUser).mockReturnValue({
      user: {
        userPermissions: [{ code: PermissionEnum.MANAGE_ORDERS }],
      },
    });

    const mockData = { order: { id: "1", name: "Test Order" } };

    vi.mocked(useOrderDetailsWithMetadataQuery).mockReturnValue({
      data: mockData,
      loading: false,
    });

    // Act
    const { result } = renderHook(() => useOrderDetails("1"));

    // Assert
    expect(useOrderDetailsWithMetadataQuery).toHaveBeenCalledWith({
      displayLoader: true,
      variables: { id: "1", hasManageProducts: false },
    });
    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
  });
});
