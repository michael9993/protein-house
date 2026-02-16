import useRichText from "@dashboard/utils/richText/useRichText";
import { renderHook } from "@testing-library/react";

import { useRichTextSubmit } from "./useRichTextSubmit";

vi.mock("@dashboard/utils/richText/useRichText", () => ({ default: vi.fn() }));
describe("useRichTextSubmit", () => {
  it("submits value from editor succesfully", async () => {
    // Given
    const textEditorValue = "text editor value";
    const getValue = vi.fn(() => textEditorValue);

    vi.mocked(useRichText).mockImplementation(() => ({ getValue }));

    const submitFn = vi.fn();
    const { result } = renderHook(() => useRichTextSubmit("initial", submitFn, false));

    // When
    await result.current.handleSubmit();
    // Then
    expect(submitFn).toHaveBeenCalledWith(textEditorValue);
  });
});
