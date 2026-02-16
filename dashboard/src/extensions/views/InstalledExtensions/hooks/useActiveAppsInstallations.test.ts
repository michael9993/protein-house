import { AppsInstallationsQuery } from "@dashboard/graphql";
import useLocalStorage from "@dashboard/hooks/useLocalStorage";
import { renderHook } from "@testing-library/react-hooks";

import { useActiveAppsInstallations } from "./useActiveAppsInstallations";

vi.mock("@apollo/client", () => ({
  gql: vi.fn(),
  useApolloClient: vi.fn(),
}));

vi.mock("@dashboard/hooks/useLocalStorage");
vi.mock("@dashboard/graphql", () => ({
  useAppRetryInstallMutation: vi.fn(() => [vi.fn(), {}]),
  useAppDeleteFailedInstallationMutation: vi.fn(() => [vi.fn(), {}]),
}));

vi.useFakeTimers();

describe("useActiveAppsInstallations", () => {
  afterEach(() => {
    vi.clearAllTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("install app notify should not be called when apps in progress data loading", () => {
    // Arrange
    const mockedActiveInstallations = [
      {
        id: "1",
        name: "app1",
      },
    ];
    const appInProgressLoading = true;
    const appsInProgressData = {
      appInstallations: [],
    } as unknown as AppsInstallationsQuery;
    const mockNotify = vi.fn();

    vi.mocked(useLocalStorage).mockReturnValue([mockedActiveInstallations, vi.fn()]);

    renderHook(() =>
      useActiveAppsInstallations({
        appsInProgressData,
        appsInProgressRefetch: vi.fn(),
        appInProgressLoading,
        appsRefetch: vi.fn(),
        installedAppNotify: mockNotify,
        removeInProgressAppNotify: vi.fn(),
        onInstallSuccess: vi.fn(),
        onInstallError: vi.fn(),
        onRemoveInProgressAppSuccess: vi.fn(),
      }),
    );

    expect(mockNotify).not.toHaveBeenCalled();
  });

  it("should call install app notify when apps in progress data loaded and no item found", () => {
    // Arrange
    const mockedActiveInstallations = [
      {
        id: "1",
        name: "app1",
      },
    ];
    const appsInProgressData = {
      appsInstallations: [],
    } as unknown as AppsInstallationsQuery;
    const mockNotify = vi.fn();

    vi.mocked(useLocalStorage).mockReturnValue([mockedActiveInstallations, vi.fn()]);

    const { rerender } = renderHook(
      ({ appsInProgressData, appInProgressLoading }) =>
        useActiveAppsInstallations({
          appsInProgressData,
          appsInProgressRefetch: vi.fn(),
          appInProgressLoading,
          appsRefetch: vi.fn(),
          installedAppNotify: mockNotify,
          removeInProgressAppNotify: vi.fn(),
          onInstallSuccess: vi.fn(),
          onInstallError: vi.fn(),
          onRemoveInProgressAppSuccess: vi.fn(),
        }),
      {
        initialProps: {
          appsInProgressData: undefined,
          appInProgressLoading: true,
        } as {
          appsInProgressData: AppsInstallationsQuery | undefined;
          appInProgressLoading: boolean;
        },
      },
    );

    rerender({
      appsInProgressData,
      appInProgressLoading: false,
    });

    expect(mockNotify).toHaveBeenCalled();
  });
});
