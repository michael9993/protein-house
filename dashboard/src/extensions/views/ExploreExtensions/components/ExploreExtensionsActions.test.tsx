import { CONST_TYPEFORM_URL } from "@dashboard/extensions/components/RequestExtensionsButton";
import { ExtensionsUrls } from "@dashboard/extensions/urls";
import { useFlag } from "@dashboard/featureFlags";
import { useHasManagedAppsPermission } from "@dashboard/hooks/useHasManagedAppsPermission";
import useNavigator from "@dashboard/hooks/useNavigator";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ExploreExtensionsActions } from "./ExploreExtensionsActions";

vi.mock("@dashboard/featureFlags", () => ({
  useFlag: vi.fn(),
}));

vi.mock("@dashboard/hooks/useHasManagedAppsPermission", () => ({
  useHasManagedAppsPermission: vi.fn(),
}));

vi.mock("@dashboard/hooks/useNavigator", () => ({ default: vi.fn() }));

vi.mock("@dashboard/extensions/components/RequestExtensionsButton", () => ({
  RequestExtensionsButton: () => (
    <a href={CONST_TYPEFORM_URL} target="_blank" rel="noopener noreferrer">
      Request integration
    </a>
  ),
  CONST_TYPEFORM_URL: "https://example.com/typeform",
}));
vi.mock("@dashboard/extensions/messages", () => ({
  buttonLabels: {
    addExtension: {
      defaultMessage: "Add Extension",
      id: "addExtension",
    },
    installFromManifest: {
      defaultMessage: "Install from Manifest",
      id: "installFromManifest",
    },
    installManually: {
      defaultMessage: "Install Manually",
      id: "installManually",
    },
  },
}));

describe("ExploreExtensionsActions", () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigator).mockReturnValue(mockNavigate);
    vi.mocked(useFlag).mockReturnValue({ enabled: true });
  });

  it("always renders request extensions button", () => {
    // Arrange
    vi.mocked(useHasManagedAppsPermission).mockReturnValue({ hasManagedAppsPermission: false });

    // Act
    render(<ExploreExtensionsActions />);

    // Assert
    const link = screen.getByRole("link", { name: "Request integration" });

    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", CONST_TYPEFORM_URL);
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders add extension dropdown when user has permission and extensions dev is enabled", () => {
    // Arrange
    vi.mocked(useHasManagedAppsPermission).mockReturnValue({ hasManagedAppsPermission: true });

    // Act
    render(<ExploreExtensionsActions />);

    // Assert
    expect(screen.getByTestId("add-extension-button")).toBeInTheDocument();
  });

  it("doesn't render add extension dropdown user doesn't have permission", () => {
    // Arrange
    vi.mocked(useHasManagedAppsPermission).mockReturnValue({ hasManagedAppsPermission: false });

    // Act
    render(<ExploreExtensionsActions />);

    // Assert
    expect(screen.queryByTestId("add-extension-button")).not.toBeInTheDocument();
  });

  it("navigates to install custom extension when selecting from dropdown", async () => {
    // Arrange
    vi.mocked(useHasManagedAppsPermission).mockReturnValue({ hasManagedAppsPermission: true });

    // Act
    render(<ExploreExtensionsActions />);
    await userEvent.click(screen.getByTestId("add-extension-button"));
    await userEvent.click(screen.getByTestId("install-custom-extension"));

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith(ExtensionsUrls.installCustomExtensionUrl());
  });

  it("navigates to add custom extension when selecting from dropdown", async () => {
    // Arrange
    vi.mocked(useHasManagedAppsPermission).mockReturnValue({ hasManagedAppsPermission: true });

    // Act
    render(<ExploreExtensionsActions />);
    await userEvent.click(screen.getByTestId("add-extension-button"));
    await userEvent.click(screen.getByTestId("add-custom-extension"));

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith(ExtensionsUrls.addCustomExtensionUrl());
  });
});
