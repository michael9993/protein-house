import { iconSize, iconStrokeWidthBySize } from "@dashboard/components/icons";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pencil } from "lucide-react";

import { RowActions } from "./RowActions";


describe("RowActions", () => {
  it("should render empty when menu items count equal to 0", () => {
    // Arrange & Act

    const { container } = render(
      <RowActions menuItems={[]} disabled={false} />,
    );

    // Assert
    expect(container.firstChild).toBeNull();
  });
  it("should render icon button when only one menu item and has icon props", () => {
    // Arrange & Act
    render(
      <RowActions
        menuItems={[
          {
            label: "Edit",
            onSelect: vi.fn(),
            Icon: (
              <Pencil
                size={iconSize.small}
                strokeWidth={iconStrokeWidthBySize.small}
                data-test-id="edit-icon"
              />
            ),
          },
        ]}
        disabled={false}
      />,
    );
    // Assert
    expect(screen.getByTestId("row-action-button")).toBeInTheDocument();
    expect(screen.getByTestId("edit-icon")).toBeInTheDocument();
  });
  it("should render card meu when only one menu item and has no icon props", () => {
    // Arrange & Act
    render(
      <RowActions
        menuItems={[
          {
            label: "Edit",
            onSelect: vi.fn(),
          },
        ]}
        disabled={false}
      />,
    );
    // Assert
    expect(screen.getByTestId("show-more-button")).toBeInTheDocument();
  });
  it("should render card menu with multiple items", async () => {
    // Arrange
    render(
      <RowActions
        menuItems={[
          {
            label: "Edit",
            onSelect: vi.fn(),
            testId: "edit-button",
          },
          {
            label: "Delete",
            onSelect: vi.fn(),
            testId: "delete-button",
          },
          {
            label: "Upgrade",
            onSelect: vi.fn(),
            testId: "upgrade-button",
          },
        ]}
        disabled={false}
      />,
    );
    // Act
    await userEvent.click(screen.getByTestId("show-more-button"));
    // Assert
    expect(screen.getByTestId("show-more-button")).toBeInTheDocument();
    expect(screen.getByTestId("edit-button")).toBeInTheDocument();
    expect(screen.getByTestId("delete-button")).toBeInTheDocument();
    expect(screen.getByTestId("upgrade-button")).toBeInTheDocument();
  });
  it("should fire callback when click on icon button when single menu item with icon props", async () => {
    // Arrange
    const onSelectCallback = vi.fn();

    render(
      <RowActions
        menuItems={[
          {
            label: "Edit",
            onSelect: onSelectCallback,
            Icon: <Pencil size={iconSize.small} strokeWidth={iconStrokeWidthBySize.small} />,
          },
        ]}
        disabled={false}
      />,
    );
    // Act
    await userEvent.click(screen.getByTestId("row-action-button"));
    // Assert
    expect(onSelectCallback).toHaveBeenCalled();
  });
  it("should fire callback when click on icon button when multiple menu item", async () => {
    // Arrange
    const onIconClickCallback = vi.fn();

    render(
      <RowActions
        menuItems={[
          {
            label: "Edit",
            onSelect: onIconClickCallback,
            testId: "edit-button",
          },
          {
            label: "Delete",
            onSelect: vi.fn(),
          },
          {
            label: "Upgrade",
            onSelect: vi.fn(),
          },
        ]}
        disabled={false}
      />,
    );
    // Act
    await userEvent.click(screen.getByTestId("show-more-button"));
    await userEvent.click(screen.getByTestId("edit-button"));
    // Assert
    expect(onIconClickCallback).toHaveBeenCalled();
  });
  it("should disabled show more button when RowAction disabled", async () => {
    // Arrange & Act
    render(
      <RowActions
        menuItems={[
          {
            label: "Edit",
            onSelect: vi.fn(),
          },
          {
            label: "Delete",
            onSelect: vi.fn(),
          },
        ]}
        disabled={true}
      />,
    );
    // Assert
    expect(screen.getByTestId("show-more-button")).toBeDisabled();
  });
  it("should disabled row action button when RowAction disabled", async () => {
    // Arrange & Act
    render(
      <RowActions
        menuItems={[
          {
            label: "Edit",
            onSelect: vi.fn(),
            Icon: <Pencil size={iconSize.small} strokeWidth={iconStrokeWidthBySize.small} />,
          },
        ]}
        disabled={true}
      />,
    );
    // Assert
    expect(screen.getByTestId("row-action-button")).toBeDisabled();
  });
});
