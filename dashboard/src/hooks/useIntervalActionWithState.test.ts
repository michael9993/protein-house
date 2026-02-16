import useLocalStorage from "@dashboard/hooks/useLocalStorage";
import { act, renderHook } from "@testing-library/react";
import { useState } from "react";

import { useIntervalActionWithState } from "./useIntervalActionWithState";

vi.mock("@dashboard/hooks/useLocalStorage", () => ({
  __esModule: true,
  default: vi.fn(() => {
    const [value, setValue] = useState(0);

    return [value, setValue];
  }),
}));

const TEST_KEY = "test-key";

describe("useIntervalActionWithState", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should execute action immediately if interval has passed", () => {
    // Arrange
    const action = vi.fn();

    // Act
    renderHook(() =>
      useIntervalActionWithState({
        action,
        interval: 1000,
        key: TEST_KEY,
      }),
    );

    // Assert
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("should execute action after interval", () => {
    // Arrange
    const action = vi.fn();

    // Act
    renderHook(() =>
      useIntervalActionWithState({
        action,
        interval: 1000,
        key: TEST_KEY,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Assert
    expect(action).toHaveBeenCalledTimes(2); // Once on mount, once after interval
  });

  it("should clear timeout on unmount", () => {
    // Arrange
    const action = vi.fn();

    // Act
    const { unmount } = renderHook(() =>
      useIntervalActionWithState({
        action,
        interval: 1000,
        key: TEST_KEY,
      }),
    );

    unmount();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Assert
    expect(action).toHaveBeenCalledTimes(1); // Only initial call
  });

  it("should handle multiple intervals", () => {
    // Arrange
    const action = vi.fn();

    // Act
    renderHook(() =>
      useIntervalActionWithState({
        action,
        interval: 1000,
        key: TEST_KEY,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    // Assert
    expect(action).toHaveBeenCalledTimes(3); // Initial + 2 intervals
  });

  it("should handle component rerenders", () => {
    // Arrange
    const action = vi.fn();

    // Act
    const { rerender } = renderHook(() =>
      useIntervalActionWithState({
        action,
        interval: 1000,
        key: TEST_KEY,
      }),
    );

    rerender();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Assert
    expect(action).toHaveBeenCalledTimes(2);
  });

  it("should calculate correct delay based on last invocation", () => {
    // Arrange
    const action = vi.fn();
    const mockTime = new Date().getTime();

    vi.mocked(useLocalStorage).mockReturnValue([mockTime - 500, vi.fn()]);

    // Act
    renderHook(() =>
      useIntervalActionWithState({
        action,
        interval: 1000,
        key: TEST_KEY,
      }),
    );

    expect(action).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Assert
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("should skip execution if skip is true", () => {
    // Arrange
    const action = vi.fn();

    // Act
    renderHook(() =>
      useIntervalActionWithState({
        action,
        interval: 1000,
        key: TEST_KEY,
        skip: true,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Assert
    expect(action).not.toHaveBeenCalled();
  });
});
