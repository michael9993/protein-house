import { useTheme } from "@dashboard/theme";
import { DefaultTheme } from "@saleor/macaw-ui-next";
import { render, screen } from "@testing-library/react";

import { SaleorLogo } from "./SaleorLogo";

vi.mock("@dashboard/theme", async () => {
  const actualTheme = await vi.importActual("@dashboard/theme");

  return {
    ...actualTheme,
    useTheme: vi.fn(),
  };
});

describe("SaleorLogo", () => {
  it("should display light mode logo when theme is defaultLight", () => {
    // Arrange
    const mockTheme: DefaultTheme = "defaultLight";

    vi.mocked(useTheme).mockReturnValue({
      theme: mockTheme,
    });

    // Act
    const { container } = render(<SaleorLogo />);

    // Assert — alt="" gives role="presentation" in @testing-library/dom v10+
    const img = container.querySelector("img");

    expect(img).toHaveAttribute("src", expect.stringContaining("sidebar-default-logo.png"));
  });

  it("should display dark mode logo when theme is defaultDark", () => {
    // Arrange
    const mockTheme: DefaultTheme = "defaultDark";

    vi.mocked(useTheme).mockReturnValue({
      theme: mockTheme,
    });

    // Act
    const { container } = render(<SaleorLogo />);

    // Assert — alt="" gives role="presentation" in @testing-library/dom v10+
    const img = container.querySelector("img");

    expect(img).toHaveAttribute(
      "src",
      expect.stringContaining("sidebar-deafult-logo-darkMode.png"),
    );
  });

  it("should throw error when theme is invalid", () => {
    // Arrange
    const mockTheme = "invalidTheme" as DefaultTheme;

    vi.mocked(useTheme).mockReturnValue({
      theme: mockTheme,
    });

    // Act & Assert
    expect(() => {
      render(<SaleorLogo />);
    }).toThrow("Invalid theme mode, should not happen.");
  });
});
