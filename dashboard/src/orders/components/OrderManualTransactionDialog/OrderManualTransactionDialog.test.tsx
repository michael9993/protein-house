import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { OrderManualTransactionDialog } from "./OrderManualTransactionDialog";

describe("OrderManualTransactionDialog", () => {
  it("should call onClose when click in close button", async () => {
    // Arrange
    const onClose = vi.fn();

    render(
      <OrderManualTransactionDialog
        error={undefined}
        dialogProps={{
          open: true,
          onClose,
        }}
        submitState="default"
        currency="USD"
        onAddTransaction={vi.fn()}
      />,
    );

    // Act
    await act(async () => {
      await userEvent.click(screen.getByTestId("close-button"));
    });

    // Assert
    expect(onClose).toHaveBeenCalled();
  });
});
