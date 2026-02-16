import { useAppsInstallationsQuery } from "@dashboard/graphql";
import { useHasManagedAppsPermission } from "@dashboard/hooks/useHasManagedAppsPermission";
import { renderHook } from "@testing-library/react-hooks";

import { usePendingInstallation } from "./usePendingInstallation";

vi.mock("@dashboard/graphql", async () => ({
  ...(await vi.importActual("@dashboard/graphql") as object),
  useAppsInstallationsQuery: vi.fn(() => ({
    data: {
      appsInstallations: [
        {
          id: "1",
          status: "PENDING",
          appName: "Test App",
          brand: {
            name: "Test Brand",
            id: "test-brand-id",
          },
        },
        {
          id: "2",
          status: "FAILED",
          appName: "Failed App",
          brand: {
            name: "Failed Brand",
            id: "failed-brand-id",
          },
        },
      ],
    },
    loading: false,
    refetch: vi.fn(),
  })),
}));

vi.mock("./useActiveAppsInstallations", async () => ({
  useActiveAppsInstallations: vi.fn(() => ({
    handleRemoveInProgress: vi.fn(),
    deleteInProgressAppOpts: {
      deleteInProgressAppStatus: "PENDING",
    },
    handleAppInstallRetry: vi.fn(),
  })),
}));

vi.mock("@dashboard/hooks/useHasManagedAppsPermission", async () => ({
  useHasManagedAppsPermission: vi.fn(() => ({
    useHasManagedAppsPermission: true,
  })),
}));

describe("InstalledExtensions / hooks / usePendingInstallation", () => {
  it("should skip fetching app installations when user doesn't have MANAGE_APP permissions", () => {
    vi.mocked(useHasManagedAppsPermission).mockReturnValueOnce(false);

    const refetchExtensions = vi.fn();
    const onCloseModal = vi.fn();
    const onFailedInstallationRemove = vi.fn();
    const searchQuery = "";

    renderHook(() =>
      usePendingInstallation({
        refetchExtensions,
        onCloseModal,
        onFailedInstallationRemove,
        searchQuery,
      }),
    );

    expect(useAppsInstallationsQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: true,
      }),
    );
  });

  it("should return list of pending installations", () => {
    // Arrange
    const refetchExtensions = vi.fn();
    const onCloseModal = vi.fn();
    const onFailedInstallationRemove = vi.fn();
    const searchQuery = "";

    const { result } = renderHook(() =>
      usePendingInstallation({
        refetchExtensions,
        onCloseModal,
        onFailedInstallationRemove,
        searchQuery,
      }),
    );

    // Assert
    expect(result.current).toEqual({
      pendingInstallations: [
        {
          id: "1",
          name: "Test App",
          actions: expect.any(Object),
          info: expect.any(Object),
          logo: expect.any(Object),
        },
        {
          id: "2",
          name: "Failed App",
          actions: expect.any(Object),
          info: expect.any(Object),
          logo: expect.any(Object),
        },
      ],
      pendingInstallationsLoading: undefined,
      handleRemoveInProgress: expect.any(Function),
      deleteInProgressAppStatus: undefined,
    });
  });
});
