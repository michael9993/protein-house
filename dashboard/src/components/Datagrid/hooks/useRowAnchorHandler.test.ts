import useNavigator from "@dashboard/hooks/useNavigator";
import { renderHook } from "@testing-library/react-hooks";

import { useRowAnchorHandler } from "./useRowAnchorHandler";

vi.mock("@dashboard/hooks/useNavigator", () => vi.fn());

vi.mock("@dashboard/hooks/useNavigator", () => ({
  __esModule: true,
  default: vi.fn(() => vi.fn()),
}));

describe("useRowAnchorHandler", () => {
  it("should navigate to the given path", () => {
    // Arrange
    const navigate = vi.fn();

    vi.mocked(useNavigator).mockReturnValue(navigate);

    const navigatorOpts = { replace: true };
    const handler = renderHook(() => useRowAnchorHandler(navigatorOpts)).result.current;
    const event = {
      preventDefault: vi.fn(),
      currentTarget: {
        dataset: {
          reactRouterPath: "/some-path",
        },
      },
    };

    // Act
    handler(event as any);

    // Assert
    expect(event.preventDefault).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith("/some-path", navigatorOpts);
  });

  it("should not prevent default when CMD key is pressed", () => {
    // Arrange
    const navigate = vi.fn();

    vi.mocked(useNavigator).mockReturnValue(navigate);

    const handler = renderHook(() => useRowAnchorHandler()).result.current;
    const event = {
      preventDefault: vi.fn(),
      metaKey: true,
      ctrlKey: false,
    };

    // Act
    handler(event as any);

    // Assert
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });

  it("should not prevent default when CTRL key is pressed", () => {
    // Arrange
    const navigate = vi.fn();

    vi.mocked(useNavigator).mockReturnValue(navigate);

    const handler = renderHook(() => useRowAnchorHandler()).result.current;
    const event = {
      preventDefault: vi.fn(),
      metaKey: false,
      ctrlKey: true,
    };

    // Act
    handler(event as any);

    // Assert
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
