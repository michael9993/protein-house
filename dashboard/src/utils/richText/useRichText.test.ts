import { act, renderHook } from "@testing-library/react";

import useRichText from "./useRichText";

const triggerChange = vi.fn();

describe("useRichText", () => {
  it("properly informs RichTextEditor when data is ready to mount", () => {
    let initial: string | undefined;
    let loading = true;
    const { result, rerender } = renderHook(() => useRichText({ initial, loading, triggerChange }));

    expect(result.current.isReadyForMount).toBe(false);
    initial = JSON.stringify({
      blocks: [{ type: "paragraph", data: { text: "Some text" } }],
    });
    loading = false;
    rerender();
    // defaultValue is now an HTML string
    expect(result.current.defaultValue).toBe("<p>Some text</p>");
    expect(result.current.isReadyForMount).toBe(true);
    expect(result.current.isDirty).toBe(false);
  });

  it("returns empty string when JSON cannot be parsed", () => {
    let initial: string | undefined;
    let loading = true;
    const { result, rerender } = renderHook(() => useRichText({ initial, loading, triggerChange }));

    expect(result.current.isReadyForMount).toBe(false);
    initial = "this-isnt-valid-json";
    loading = false;
    rerender();
    // Invalid JSON is treated as raw HTML
    expect(result.current.defaultValue).toBe("this-isnt-valid-json");
    expect(result.current.isReadyForMount).toBe(true);
    expect(result.current.isDirty).toBe(false);
  });

  it("wraps HTML in OutputData when getValue is called", async () => {
    const { result } = renderHook(() => useRichText({ initial: "", triggerChange }));

    act(() => {
      result.current.handleChange("<p>Hello</p>");
    });

    const value = await result.current.getValue();

    expect(value.blocks).toHaveLength(1);
    expect(value.blocks[0].type).toBe("rawHtml");
    expect(value.blocks[0].data.html).toBe("<p>Hello</p>");
    expect(result.current.isDirty).toBe(false);
  });

  it("calls triggerChange when change is made in the editor", () => {
    triggerChange.mockClear();

    const { result } = renderHook(() => useRichText({ initial: "", triggerChange }));

    act(() => {
      result.current.handleChange("<p>Updated</p>");
    });
    expect(triggerChange).toHaveBeenCalled();
    expect(result.current.isDirty).toBe(true);
  });
});
