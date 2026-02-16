import { useOrderDraftBulkCancelMutation } from "@dashboard/graphql";
import { renderHook } from "@testing-library/react-hooks";

import { useBulkDeletion } from "./useBulkDeletion";

vi.mock("@dashboard/graphql", () => ({
  useOrderDraftBulkCancelMutation: vi.fn(() => [vi.fn(), {}]),
}));
describe("Order draft list useBulkDeletion", () => {
  it("deletes order drafts for by given ids", async () => {
    // Arrange
    const onComplete = vi.fn();
    const selectedRowIds = ["id1", "id2"];
    const orderDraftBulkDelete = vi.fn();
    const useOrderDraftBulkCancelMutationMock = useOrderDraftBulkCancelMutation as Mock;

    useOrderDraftBulkCancelMutationMock.mockReturnValue([orderDraftBulkDelete, {}]);

    // Act
    const { result } = renderHook(() => useBulkDeletion(onComplete));

    await result.current.onOrderDraftBulkDelete(selectedRowIds);
    // Assert
    expect(orderDraftBulkDelete).toBeCalledWith({
      variables: {
        ids: ["id1", "id2"],
      },
    });
  });
});
