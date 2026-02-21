import useRichText from "@dashboard/utils/richText/useRichText";
import { renderHook } from "@testing-library/react";

import { useRichTextSubmit } from "./useRichTextSubmit";

vi.mock("@dashboard/utils/richText/useRichText", () => ({ default: vi.fn() }));
describe("useRichTextSubmit", () => {
  it("submits value from editor succesfully", async () => {
    // Given
    const textEditorValue = {
      time: Date.now(),
      version: "2.0.0",
      blocks: [{ type: "rawHtml", data: { html: "<p>text editor value</p>", text: "text editor value" } }],
    };
    const getValue = vi.fn(() => Promise.resolve(textEditorValue));

    vi.mocked(useRichText).mockImplementation(() => ({
      getValue,
      handleChange: vi.fn(),
      defaultValue: "",
      isReadyForMount: true,
      isDirty: false,
    }));

    const submitFn = vi.fn();
    const { result } = renderHook(() => useRichTextSubmit("initial", submitFn, false));

    // When
    await result.current.handleSubmit();
    // Then
    expect(submitFn).toHaveBeenCalledWith(textEditorValue);
  });
});
