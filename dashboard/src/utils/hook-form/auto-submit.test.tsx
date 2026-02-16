import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";

import { useAutoSubmit } from "./auto-submit";

interface TestFormData {
  testField: string;
}

const DEBOUNCE_TIME = 1000;

// Test component for testing useAutoSubmit in useForm from react-hook-form
const TestFormComponent = ({ onSubmit }: { onSubmit: () => void }) => {
  const { control, watch, handleSubmit } = useForm<TestFormData>({
    defaultValues: {
      testField: "",
    },
  });

  useAutoSubmit({
    control,
    watch,
    onSubmit,
    debounceTime: DEBOUNCE_TIME,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} aria-label="test form">
      <input {...control.register("testField")} />
    </form>
  );
};

describe("useAutoSubmit", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should not call onSubmit immediately after input change", async () => {
    // Arrange
    const mockSubmit = vi.fn();
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });

    render(<TestFormComponent onSubmit={mockSubmit} />);

    const input = screen.getByRole("textbox");

    // Act
    await user.type(input, "hello");

    // Assert
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("should call onSubmit after debounce time has passed", async () => {
    // Arrange
    const mockSubmit = vi.fn();
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });

    render(<TestFormComponent onSubmit={mockSubmit} />);

    const input = screen.getByRole("textbox");

    // Act
    await user.type(input, "hello");

    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE_TIME);
    });

    // Assert
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });

  it("should reset debounce timer on subsequent input changes", async () => {
    // Arrange
    const mockSubmit = vi.fn();
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });

    render(<TestFormComponent onSubmit={mockSubmit} />);

    const input = screen.getByRole("textbox");

    // Act
    await user.type(input, "a");

    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE_TIME - 100);
    });

    await user.type(input, "b");

    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE_TIME);
    });

    // Assert
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });

  it("should not submit if component unmounts before debounce timeout", async () => {
    // Arrange
    const mockSubmit = vi.fn();
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });
    const { unmount } = render(<TestFormComponent onSubmit={mockSubmit} />);
    const input = screen.getByRole("textbox");

    // Act
    await user.type(input, "hello");

    unmount();

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_TIME);
    });

    // Assert
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("should cancel debounced submit when form is manually submitted", async () => {
    // Arrange
    const mockSubmit = vi.fn();
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime.bind(vi),
    });

    render(<TestFormComponent onSubmit={mockSubmit} />);

    const input = screen.getByRole("textbox");
    const form = screen.getByRole("form", { name: "test form" });

    // Act
    await user.type(input, "hello");
    // Submit form manually before debounce time passes
    fireEvent.submit(form);

    await act(async () => {
      // Advance timers to when debounced submit would have happened
      vi.advanceTimersByTime(DEBOUNCE_TIME);
    });

    // Assert
    expect(mockSubmit).toHaveBeenCalledTimes(1);
  });
});
