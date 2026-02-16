import { useUser } from "@dashboard/auth";
import { useUserAccountUpdateMutation } from "@dashboard/graphql";
import { renderHook } from "@testing-library/react";

import {
  DELIVERY_ATTEMPT_KEY,
  useSidebarWebhookAlertMetadata,
} from "./useSidebarWebhookAlertMetadata";

vi.mock("@dashboard/auth", () => ({
  useUser: vi.fn().mockReturnValue({ user: null }),
}));

vi.mock("@dashboard/graphql", () => ({
  useUserAccountUpdateMutation: vi.fn(),
}));

describe("useSidebarWebhookAlertMetadata", () => {
  const mockSaveMetadata = vi.fn();
  const mockMetadataInput = {
    lastClickDate: "2023-01-01",
    lastFailedAttemptDate: "2023-01-02",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useUserAccountUpdateMutation).mockReturnValue([mockSaveMetadata]);
  });

  it("should persist metadata correctly", async () => {
    // Arrange & Act
    const { result } = renderHook(() => useSidebarWebhookAlertMetadata());

    await result.current.persist(mockMetadataInput);

    // Assert
    expect(mockSaveMetadata).toHaveBeenCalledWith({
      variables: {
        input: {
          metadata: [
            {
              key: DELIVERY_ATTEMPT_KEY,
              value: JSON.stringify(mockMetadataInput),
            },
          ],
        },
      },
    });
  });

  it("should return parsed metadata when it exists", () => {
    // Arrange
    vi.mocked(useUser).mockReturnValue({
      user: {
        metadata: [
          {
            key: DELIVERY_ATTEMPT_KEY,
            value: JSON.stringify(mockMetadataInput),
          },
        ],
      },
    });

    // Act
    const { result } = renderHook(() => useSidebarWebhookAlertMetadata());

    // Assert
    expect(result.current.sidebarDotRemoteState).toEqual(mockMetadataInput);
  });

  it("should return null when metadata doesn't exist", () => {
    // Arrange
    vi.mocked(useUser).mockReturnValue({
      user: {
        metadata: [],
      },
    });

    // Act
    const { result } = renderHook(() => useSidebarWebhookAlertMetadata());

    // Assert
    expect(result.current.sidebarDotRemoteState).toBeNull();
  });

  it("should return null when metadata is invalid JSON", () => {
    // Arrange
    vi.mocked(useUser).mockReturnValue({
      user: {
        metadata: [
          {
            key: DELIVERY_ATTEMPT_KEY,
            value: "invalid-json",
          },
        ],
      },
    });

    // Act
    const { result } = renderHook(() => useSidebarWebhookAlertMetadata());

    // Assert
    expect(result.current.sidebarDotRemoteState).toBeNull();
  });
});
