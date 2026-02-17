import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ExitFormDialog from "./ExitFormDialog";

vi.mock("@saleor/macaw-ui", () => ({
  // eslint-disable-next-line react/display-name
  DialogHeader: vi.fn(() => () => <></>),
}));
describe("ExitFormDialog", () => {
  it("closes when ignore changes is clicked", async () => {
    // Arrange
    const props = {
      onClose: vi.fn(),
      onLeave: vi.fn(),
      isOpen: true,
    };
    const user = userEvent.setup();
    // Act
    const { getByTestId } = render(<ExitFormDialog {...props} />);

    await user.click(getByTestId("ignore-changes"));
    // Assert
    expect(props.onLeave).toHaveBeenCalled();
  });
  it("closes when keep editing is clicked", async () => {
    // Arrange
    const props = {
      onClose: vi.fn(),
      onLeave: vi.fn(),
      isOpen: true,
    };
    const user = userEvent.setup();
    // Act
    const { getByTestId } = render(<ExitFormDialog {...props} />);

    await user.click(getByTestId("back"));
    // Assert
    expect(props.onClose).toHaveBeenCalled();
  });
});
