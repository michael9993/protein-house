import { UseDebounceFn } from "@dashboard/hooks/useDebounce";
import { renderHook } from "@testing-library/react-hooks";

import { PersistedColumn, RawColumn } from "./persistedColumn";
import { useMetadata } from "./useMetadata";
import { usePersistance } from "./usePersistance";

vi.mock("./useMetadata", () => ({
  useMetadata: vi.fn(() => ({
    metadata: {},
    persist: vi.fn(),
  })),
}));

vi.mock("@dashboard/hooks/useDebounce", () => (fn: UseDebounceFn<unknown>) => fn);

describe("Datagrid / persistance / usePersistance", () => {
  it("gets all persisted columns", () => {
    const rawColumns = [
      {
        id: "col-1",
        w: 100,
      },
      {
        id: "col-2",
        w: 200,
      },
    ];
    const persist = vi.fn();

    vi.mocked(useMetadata).mockReturnValue({
      metadata: {
        value: JSON.stringify(rawColumns),
      },
      persist,
    });

    const { result } = renderHook(() => usePersistance("grid_test"));

    expect(result.current.columns).toEqual([
      {
        id: "col-1",
        width: 100,
      },
      {
        id: "col-2",
        width: 200,
      },
    ]);
    expect(persist).not.toBeCalled();
  });

  it("updates and gets all persisted columns", () => {
    const rawColumns: RawColumn[] = [];
    const persist = vi.fn();

    vi.mocked(useMetadata).mockReturnValue({
      metadata: {
        value: JSON.stringify(rawColumns),
      },
      persist,
    });

    const { result, rerender } = renderHook(() => usePersistance("grid_test"));

    result.current.update([new PersistedColumn("col-1", 500)]);
    rerender();

    expect(result.current.columns).toEqual([new PersistedColumn("col-1", 500)]);
    expect(persist).toBeCalled();
  });
});
