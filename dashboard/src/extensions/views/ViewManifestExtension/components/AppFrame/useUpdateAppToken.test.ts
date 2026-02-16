import { renderHook, waitFor } from "@testing-library/react";

import { useUpdateAppToken } from "./useUpdateAppToken";

describe("useUpdateAppToken", function () {
  const postMessage = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });
  it("Doesnt do anything if disabled", async () => {
    renderHook(props => useUpdateAppToken(props), {
      initialProps: {
        enabled: true,
        appToken: "initialToken",
        postToExtension: postMessage,
      },
    });

    await waitFor(() => {
      expect(postMessage).not.toHaveBeenCalled();
    });
  });
  it("Doesnt do anything if re-rendered, but token stays the same between renders", async () => {
    const localPostMessage = vi.fn();
    const { rerender } = renderHook(props => useUpdateAppToken(props), {
      initialProps: {
        enabled: true,
        appToken: "initialToken",
        postToExtension: postMessage,
      },
    });

    rerender({
      enabled: true,
      appToken: "initialToken",
      // simulate props change due to reference change
      postToExtension: localPostMessage,
    });

    await waitFor(() => {
      expect(postMessage).not.toHaveBeenCalled();
      expect(localPostMessage).not.toHaveBeenCalled();
    });
  });
  it("Calls postMessage if token changes in props and enabled", async () => {
    const { rerender } = renderHook(props => useUpdateAppToken(props), {
      initialProps: {
        enabled: true,
        appToken: "initialToken",
        postToExtension: postMessage,
      },
    });

    rerender({
      enabled: true,
      appToken: "updatedToken",
      // simulate props change due to reference change
      postToExtension: postMessage,
    });

    await waitFor(() => {
      expect(postMessage).toHaveBeenCalledWith({
        type: "tokenRefresh",
        payload: {
          token: "updatedToken",
        },
      });
    });
  });
});
