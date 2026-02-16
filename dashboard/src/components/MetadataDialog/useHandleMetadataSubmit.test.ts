import { DocumentNode, useApolloClient } from "@apollo/client";
import { MetadataFormData } from "@dashboard/components/Metadata";
import {
  OrderDetailsDocument,
  useUpdateMetadataMutation,
  useUpdatePrivateMetadataMutation,
} from "@dashboard/graphql";
import { renderHook } from "@testing-library/react-hooks";
import { act } from "react-dom/test-utils";

import { useHandleMetadataSubmit } from "./useHandleMetadataSubmit";

// Mocks
const mockNotify = vi.fn();

vi.mock("@dashboard/hooks/useNotifier", () => () => mockNotify);

vi.mock("@apollo/client", async () => ({
  ...(await vi.importActual("@apollo/client") as {}),
  useApolloClient: vi.fn(),
}));

vi.mock("@dashboard/graphql", async () => ({
  ...(await vi.importActual("@dashboard/graphql") as {}),
  useUpdateMetadataMutation: vi.fn(),
  useUpdatePrivateMetadataMutation: vi.fn(),
}));

// Test fixtures
const mockInitialData = {
  id: "test-id",
  metadata: [{ key: "existing-key", value: "existing-value" }],
  privateMetadata: [{ key: "private-key", value: "private-value" }],
};

const mockMetadataFormData: MetadataFormData = {
  metadata: [{ key: "new-key", value: "new-value" }],
  privateMetadata: [{ key: "new-private-key", value: "new-private-value" }],
};

const mockDocument: DocumentNode = OrderDetailsDocument;

describe("useHandleMetadataSubmit", () => {
  let mockUpdateMetadata: Mock;
  let mockUpdatePrivateMetadata: Mock;
  let mockClient: {
    refetchQueries: Mock;
  };
  let mockOnClose: Mock;
  let mockRefetch: Mock;

  beforeEach(() => {
    // Arrange
    vi.clearAllMocks();

    mockUpdateMetadata = vi.fn().mockResolvedValue({
      data: { updateMetadata: { errors: [] } },
    });

    mockUpdatePrivateMetadata = vi.fn().mockResolvedValue({
      data: { updatePrivateMetadata: { errors: [] } },
    });

    mockRefetch = vi.fn().mockResolvedValue({});

    mockClient = {
      refetchQueries: vi.fn(() => ({
        queries: [{ refetch: mockRefetch }],
      })),
    };

    mockOnClose = vi.fn();

    vi.mocked(useUpdateMetadataMutation).mockReturnValue([
      mockUpdateMetadata,
      { loading: false },
    ]);

    vi.mocked(useUpdatePrivateMetadataMutation).mockReturnValue([
      mockUpdatePrivateMetadata,
      { loading: false },
    ]);

    vi.mocked(useApolloClient).mockReturnValue(mockClient);
  });

  it("should return onSubmit, lastSubmittedData, and submitInProgress", () => {
    // Arrange
    // Act
    const { result } = renderHook(() =>
      useHandleMetadataSubmit({
        initialData: mockInitialData,
        onClose: mockOnClose,
        refetchDocument: mockDocument,
      }),
    );

    // Assert
    expect(result.current).toHaveProperty("onSubmit");
    expect(result.current).toHaveProperty("lastSubmittedData");
    expect(result.current).toHaveProperty("submitInProgress");
    expect(typeof result.current.onSubmit).toBe("function");
  });

  it("should handle undefined initialData gracefully", async () => {
    // Arrange
    const { result } = renderHook(() =>
      useHandleMetadataSubmit({
        initialData: undefined,
        onClose: mockOnClose,
        refetchDocument: mockDocument,
      }),
    );

    // Act
    await act(async () => {
      await result.current.onSubmit(mockMetadataFormData);
    });

    // Assert
    expect(mockClient.refetchQueries).toHaveBeenCalled();
  });

  it("should track lastSubmittedData", async () => {
    // Arrange
    const { result, rerender } = renderHook(() =>
      useHandleMetadataSubmit({
        initialData: mockInitialData,
        onClose: mockOnClose,
        refetchDocument: mockDocument,
      }),
    );

    // Act
    await act(async () => {
      await result.current.onSubmit(mockMetadataFormData);
    });

    rerender();

    // Assert
    expect(result.current.lastSubmittedData).toEqual(mockMetadataFormData);
  });

  it("should show success notification and close on successful submission", async () => {
    // Arrange
    const { result } = renderHook(() =>
      useHandleMetadataSubmit({
        initialData: mockInitialData,
        onClose: mockOnClose,
        refetchDocument: mockDocument,
      }),
    );

    // Act
    await act(async () => {
      await result.current.onSubmit(mockMetadataFormData);
    });

    // Assert
    expect(mockNotify).toHaveBeenCalledWith({
      status: "success",
      text: expect.any(String),
    });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should not close or show success when mutation returns errors", async () => {
    // Arrange
    mockUpdateMetadata.mockResolvedValue({
      data: { updateMetadata: { errors: [{ message: "Error" }] } },
    });

    const { result } = renderHook(() =>
      useHandleMetadataSubmit({
        initialData: mockInitialData,
        onClose: mockOnClose,
        refetchDocument: mockDocument,
      }),
    );

    // Act
    await act(async () => {
      await result.current.onSubmit(mockMetadataFormData);
    });

    // Assert
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalledWith(expect.objectContaining({ status: "success" }));
  });

  it("should call client.refetchQueries with refetchDocument", async () => {
    // Arrange
    const { result } = renderHook(() =>
      useHandleMetadataSubmit({
        initialData: mockInitialData,
        onClose: mockOnClose,
        refetchDocument: mockDocument,
      }),
    );

    // Act
    await act(async () => {
      await result.current.onSubmit(mockMetadataFormData);
    });

    // Assert
    expect(mockClient.refetchQueries).toHaveBeenCalledWith({
      include: [mockDocument],
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("should reflect loading state during mutation", () => {
    // Arrange
    vi.mocked(useUpdateMetadataMutation).mockReturnValue([
      mockUpdateMetadata,
      { loading: true },
    ]);

    // Act
    const { result } = renderHook(() =>
      useHandleMetadataSubmit({
        initialData: mockInitialData,
        onClose: mockOnClose,
        refetchDocument: mockDocument,
      }),
    );

    // Assert
    expect(result.current.submitInProgress).toBe(true);
  });

  it("should reflect loading state from privateMetadata mutation", () => {
    // Arrange
    vi.mocked(useUpdatePrivateMetadataMutation).mockReturnValue([
      mockUpdatePrivateMetadata,
      { loading: true },
    ]);

    // Act
    const { result } = renderHook(() =>
      useHandleMetadataSubmit({
        initialData: mockInitialData,
        onClose: mockOnClose,
        refetchDocument: mockDocument,
      }),
    );

    // Assert
    expect(result.current.submitInProgress).toBe(true);
  });
});
