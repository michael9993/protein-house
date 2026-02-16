import useNavigator from "@dashboard/hooks/useNavigator";
import { globalSearchUrl } from "@dashboard/search/urls";
import { renderHook } from "@testing-library/react-hooks";
import { useHotkeys } from "react-hotkeys-hook";

import { useActionItems } from "./useActionItems";
import { useCommandMenuInput } from "./useCommandMenuInput";
import { useKeyboardNavigation } from "./useKeyboardNavigation";
import { useNavigatorSearchContext } from "./useNavigatorSearchContext";

vi.mock("@dashboard/hooks/useNavigator");
vi.mock("@dashboard/search/urls");
vi.mock("react-hotkeys-hook");
vi.mock("./useActionItems");
vi.mock("./useCommandMenuInput");
vi.mock("./useNavigatorSearchContext");

describe("useKeyboardNavigation", () => {
  const mockNavigate = vi.fn();
  const mockSetNavigatorVisibility = vi.fn();
  const mockUpdateAriaActiveDescendant = vi.fn();
  const mockClearActiveDescendant = vi.fn();
  const mockResetInput = vi.fn();
  const mockResetFocus = vi.fn();
  const mockCollectLinks = vi.fn();
  const mockCollectTableRows = vi.fn();
  const mockFocusFirst = vi.fn();
  const mockFocusNext = vi.fn();
  const mockFocusPrevious = vi.fn();
  const mockGetActiveFocusedElement = vi.fn();
  const mockTakeAction = vi.fn();
  const mockUseHotkeys = vi.fn();

  const defaultMockElement = {
    id: "test-element-id",
    getAttribute: vi.fn(),
    setAttribute: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useNavigator).mockReturnValue(mockNavigate);
    vi.mocked(globalSearchUrl).mockReturnValue("/search?q=test");
    vi.mocked(useHotkeys).mockImplementation(mockUseHotkeys);

    vi.mocked(useNavigatorSearchContext).mockReturnValue({
      isNavigatorVisible: true,
      setNavigatorVisibility: mockSetNavigatorVisibility,
    });

    vi.mocked(useCommandMenuInput).mockReturnValue({
      updateAriaActiveDescendant: mockUpdateAriaActiveDescendant,
      clearActiveDescendant: mockClearActiveDescendant,
      resetInput: mockResetInput,
    });

    vi.mocked(useActionItems).mockReturnValue({
      resetFocus: mockResetFocus,
      collectLinks: mockCollectLinks,
      collectTableRows: mockCollectTableRows,
      focusFirst: mockFocusFirst,
      focusNext: mockFocusNext,
      focusPrevious: mockFocusPrevious,
      getActiveFocusedElement: mockGetActiveFocusedElement,
      takeAction: mockTakeAction,
    });

    mockGetActiveFocusedElement.mockReturnValue(defaultMockElement);
  });

  describe("initialization", () => {
    it("should return correct interface", () => {
      const { result } = renderHook(() => useKeyboardNavigation({ query: "test" }));

      expect(result.current).toMatchObject({
        scope: expect.objectContaining({ current: null }),
        resetFocus: mockResetFocus,
        collectLinks: mockCollectLinks,
        collectTableRows: mockCollectTableRows,
      });
    });

    it("should register hotkeys with correct settings", () => {
      renderHook(() => useKeyboardNavigation({ query: "test" }));

      const expectedHotkeysSettings = {
        enableOnFormTags: true,
        scopes: ["command-menu"],
      };

      expect(useHotkeys).toHaveBeenCalledWith("tab", expect.any(Function), expectedHotkeysSettings);
      expect(useHotkeys).toHaveBeenCalledWith("up", expect.any(Function), expectedHotkeysSettings);
      expect(useHotkeys).toHaveBeenCalledWith(
        "down",
        expect.any(Function),
        expectedHotkeysSettings,
      );
      expect(useHotkeys).toHaveBeenCalledWith(
        "ctrl+enter, meta+enter",
        expect.any(Function),
        expectedHotkeysSettings,
      );
      expect(useHotkeys).toHaveBeenCalledWith(
        "enter",
        expect.any(Function),
        expectedHotkeysSettings,
      );
    });
  });

  describe("query change effect", () => {
    it("should focus first element and update aria active descendant when query changes", () => {
      const { rerender } = renderHook(({ query }) => useKeyboardNavigation({ query }), {
        initialProps: { query: "initial" },
      });

      expect(mockFocusFirst).toHaveBeenCalledTimes(1);
      expect(mockGetActiveFocusedElement).toHaveBeenCalledTimes(1);
      expect(mockUpdateAriaActiveDescendant).toHaveBeenCalledWith("test-element-id");

      rerender({ query: "new query" });

      expect(mockFocusFirst).toHaveBeenCalledTimes(2);
      expect(mockGetActiveFocusedElement).toHaveBeenCalledTimes(2);
      expect(mockUpdateAriaActiveDescendant).toHaveBeenCalledWith("test-element-id");
    });

    it("should clear aria active descendant when no active focused element", () => {
      mockGetActiveFocusedElement.mockReturnValue(undefined);

      renderHook(() => useKeyboardNavigation({ query: "test" }));

      expect(mockFocusFirst).toHaveBeenCalled();
      expect(mockGetActiveFocusedElement).toHaveBeenCalled();
      expect(mockUpdateAriaActiveDescendant).not.toHaveBeenCalled();
      expect(mockClearActiveDescendant).toHaveBeenCalled();
    });
  });

  describe("visibility change effect", () => {
    it("should reset focus when navigator becomes invisible", () => {
      const { rerender } = renderHook(() => useKeyboardNavigation({ query: "test" }));

      vi.mocked(useNavigatorSearchContext).mockReturnValue({
        isNavigatorVisible: false,
        setNavigatorVisibility: mockSetNavigatorVisibility,
      });

      rerender();

      expect(mockResetFocus).toHaveBeenCalled();
    });

    it("should not reset focus when navigator is visible", () => {
      renderHook(() => useKeyboardNavigation({ query: "test" }));

      expect(mockResetFocus).not.toHaveBeenCalled();
    });
  });

  describe("hotkey handlers", () => {
    let hotkeyHandlers: Record<string, (event: KeyboardEvent) => boolean>;

    beforeEach(() => {
      hotkeyHandlers = {};
      vi.mocked(useHotkeys).mockImplementation((keys, handler) => {
        hotkeyHandlers[keys] = handler;
      });

      renderHook(() => useKeyboardNavigation({ query: "test" }));
    });

    describe("tab key", () => {
      it("should prevent default and focus next element", () => {
        const mockEvent = { preventDefault: vi.fn() } as any;

        const result = hotkeyHandlers["tab"](mockEvent);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockFocusNext).toHaveBeenCalled();
        expect(result).toBe(false);
      });
    });

    describe("up key", () => {
      it("should prevent default and focus previous element", () => {
        const mockEvent = { preventDefault: vi.fn() } as any;

        const result = hotkeyHandlers["up"](mockEvent);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockFocusPrevious).toHaveBeenCalled();
        expect(result).toBe(false);
      });
    });

    describe("down key", () => {
      it("should prevent default and focus next element", () => {
        const mockEvent = { preventDefault: vi.fn() } as any;

        const result = hotkeyHandlers["down"](mockEvent);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockFocusNext).toHaveBeenCalled();
        expect(result).toBe(false);
      });
    });

    describe("ctrl+enter and meta+enter keys", () => {
      it("should prevent default, hide navigator, reset focus and navigate to global search", () => {
        const mockEvent = { preventDefault: vi.fn() } as any;
        const query = "test query";

        renderHook(() => useKeyboardNavigation({ query }));

        const result = hotkeyHandlers["ctrl+enter, meta+enter"](mockEvent);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockSetNavigatorVisibility).toHaveBeenCalledWith(false);
        expect(mockResetFocus).toHaveBeenCalled();
        expect(globalSearchUrl).toHaveBeenCalledWith({ query });
        expect(mockNavigate).toHaveBeenCalledWith("/search?q=test");
        expect(result).toBe(false);
      });
    });

    describe("enter key", () => {
      it("should prevent default, take action, reset input and hide navigator", () => {
        const mockEvent = { preventDefault: vi.fn() } as any;

        const result = hotkeyHandlers["enter"](mockEvent);

        expect(mockEvent.preventDefault).toHaveBeenCalled();
        expect(mockTakeAction).toHaveBeenCalled();
        expect(mockResetInput).toHaveBeenCalled();
        expect(mockSetNavigatorVisibility).toHaveBeenCalledWith(false);
        expect(result).toBe(false);
      });
    });
  });

  describe("dependency integration", () => {
    it("should use all dependencies correctly", () => {
      renderHook(() => useKeyboardNavigation({ query: "test" }));

      expect(useNavigator).toHaveBeenCalled();
      expect(useNavigatorSearchContext).toHaveBeenCalled();
      expect(useCommandMenuInput).toHaveBeenCalled();
      expect(useActionItems).toHaveBeenCalled();
    });
  });
});
