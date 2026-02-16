import { renderHook } from "@testing-library/react-hooks";
import { useLocation } from "react-router";

import { useBackLinkWithState } from "./useBackLinkWithState";

vi.mock("react-router", () => ({
  useLocation: vi.fn(),
}));

describe("useBackLinkWithState", () => {
  // Arrange
  it("should return path if there is no previous location in state", () => {
    vi.mocked(useLocation).mockReturnValue({
      state: {},
    });

    // Act
    const { result } = renderHook(() =>
      useBackLinkWithState({
        path: "/orders",
      }),
    );

    // Assert
    expect(result.current).toBe("/orders");
  });

  it("should return the previous URL if it is an order list path", () => {
    // Arrange

    vi.mocked(useLocation).mockReturnValue({
      state: {
        prevLocation: {
          pathname: "/orders",
          search: "?asc=false&after=cursor",
        },
      },
    });

    // Act
    const { result } = renderHook(() =>
      useBackLinkWithState({
        path: "/orders",
      }),
    );

    // Assert
    expect(result.current).toBe("/orders?asc=false&after=cursor");
  });

  it("should return the previous URL if it is a draft order list path", () => {
    // Arrange
    vi.mocked(useLocation).mockReturnValue({
      state: {
        prevLocation: {
          pathname: "/orders/drafts",
          search: "?asc=false&after=cursor",
        },
      },
    });

    // Act
    const { result } = renderHook(() =>
      useBackLinkWithState({
        path: "/orders/drafts",
      }),
    );

    // Assert
    expect(result.current).toBe("/orders/drafts?asc=false&after=cursor");
  });

  it("should omit /dashboard from pathname when returning the previous URL", () => {
    // Arrange
    vi.mocked(useLocation).mockReturnValue({
      state: {
        prevLocation: {
          pathname: "/dashboard/collections/Q29sbGVjdGlvbjoxNjY",
          search: "",
        },
      },
    });

    // Act
    const { result } = renderHook(() =>
      useBackLinkWithState({
        path: "/collections",
      }),
    );

    // Assert
    expect(result.current).toBe("/collections/Q29sbGVjdGlvbjoxNjY");
  });
});
