import * as dndKit from "@dnd-kit/core";
import { act, renderHook } from "@testing-library/react-hooks";

import { ProductVariantItem } from "../types";
import { useVariantDrag } from "./useVariantDrag";

vi.mock("@dnd-kit/core", async () => ({
  ...(await vi.importActual("@dnd-kit/core") as object),
  useSensors: vi.fn(() => "mockedSensors"),
  useSensor: vi.fn(),
  PointerSensor: vi.fn(),
}));

const mockVariants = [
  { id: "1", name: "Variant 1" },
  { id: "2", name: "Variant 2" },
  { id: "3", name: "Variant 3" },
];
const mockOnReorder = vi.fn();

describe("useVariantDrag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not call onReorder when over is null", () => {
    // Arrange & Act
    const { result } = renderHook(() =>
      useVariantDrag({
        variants: mockVariants as unknown as ProductVariantItem[],
        onReorder: mockOnReorder,
      }),
    );

    act(() => {
      result.current.handleDragEnd({
        active: { id: "1" },
        over: null,
      } as dndKit.DragEndEvent);
    });

    // Assert
    expect(mockOnReorder).not.toHaveBeenCalled();
    expect(result.current.isSaving).toBe(false);
  });

  it("should not call onReorder when active.id equals over.id", () => {
    // Arrange & Act
    const { result } = renderHook(() =>
      useVariantDrag({
        variants: mockVariants as unknown as ProductVariantItem[],
        onReorder: mockOnReorder,
      }),
    );

    act(() => {
      result.current.handleDragEnd({
        active: { id: "1" },
        over: { id: "1" },
      } as dndKit.DragEndEvent);
    });

    // Assert
    expect(mockOnReorder).not.toHaveBeenCalled();
    expect(result.current.isSaving).toBe(false);
  });

  it("should handle successful reorder", () => {
    // Arrange & Act
    const { result } = renderHook(() =>
      useVariantDrag({
        variants: mockVariants as unknown as ProductVariantItem[],
        onReorder: mockOnReorder,
      }),
    );

    act(() => {
      result.current.handleDragEnd({
        active: { id: "1" },
        over: { id: "2" },
      } as dndKit.DragEndEvent);
    });

    // Assert
    expect(mockOnReorder).toHaveBeenCalledWith({
      oldIndex: 0,
      newIndex: 1,
    });
    expect(result.current.isSaving).toBe(false);
  });
});
