// @ts-strict-ignore
import useForm, { SubmitPromise } from "@dashboard/hooks/useForm";
import { act, render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider, useLocation, useNavigate } from "react-router";

import { ExitFormDialogContext } from "./ExitFormDialogProvider";
import { useExitFormDialog } from "./useExitFormDialog";
import { useExitFormDialogProvider } from "./useExitFormDialogProvider";

vi.mock("../../hooks/useNotifier", () => ({ default: () => vi.fn() }));

const MockExitFormDialogProvider = ({ children }) => {
  const { providerData } = useExitFormDialogProvider();

  return (
    <ExitFormDialogContext.Provider value={providerData}>{children}</ExitFormDialogContext.Provider>
  );
};
const initialPath = "/";
const targetPath = "/path";

const createSetup = (submitFn: () => SubmitPromise, confirmLeave = true) => {
  const result = { current: null as any };

  const TestHook = () => {
    const form = useForm({ field: "" }, submitFn, { confirmLeave });
    const exit = useExitFormDialog();
    const navigate = useNavigate();
    const location = useLocation();

    result.current = { form, exit, navigate, location };

    return null;
  };

  const router = createMemoryRouter(
    [
      {
        path: "*",
        element: (
          <MockExitFormDialogProvider>
            <TestHook />
          </MockExitFormDialogProvider>
        ),
      },
    ],
    { initialEntries: [initialPath] },
  );

  render(<RouterProvider router={router} />);

  return { result };
};

describe("useExitFormDialog", () => {
  it("blocks navigation after leaving dirty form", async () => {
    // Given
    const submitFn = vi.fn(() => Promise.resolve([]));
    const { result } = createSetup(submitFn);

    // When
    act(() => {
      result.current.form.change({
        target: { name: "field", value: "something" },
      });
    });
    act(() => {
      result.current.navigate(targetPath);
    });
    // Then
    expect(result.current.exit.shouldBlockNavigation()).toBe(true);
    expect(result.current.location.pathname).toBe(initialPath);
  });
  it("allows navigation after leaving dirty form if no confirmation is needed", async () => {
    // Given
    const submitFn = vi.fn(() => Promise.resolve([]));
    const { result } = createSetup(submitFn, false);

    // When
    act(() => {
      result.current.form.change({
        target: { name: "field", value: "something" },
      });
    });
    act(() => {
      result.current.navigate(targetPath);
    });
    // Then
    expect(result.current.exit.shouldBlockNavigation()).toBe(false);
    expect(result.current.location.pathname).toBe(targetPath);
  });
  it("navigates to full url with querystring", async () => {
    // Given
    const submitFn = vi.fn(() => Promise.resolve([]));
    const { result } = createSetup(submitFn);
    const qs = "?param=value";
    const targetPathWithQs = targetPath + qs;

    // When
    act(() => {
      result.current.form.change({
        target: { name: "field", value: "something" },
      });
    });
    act(() => {
      result.current.navigate(targetPathWithQs);
    });
    // Allow blocker to transition to "blocked" state before proceeding
    act(() => {
      result.current.exit.leave();
    });
    // Then
    expect(result.current.location.pathname).toBe(targetPath);
    expect(result.current.location.search).toBe(qs);
  });
});
