import * as ConfigMock from "@dashboard/config";
import { useHasManagedAppsPermission } from "@dashboard/hooks/useHasManagedAppsPermission";
import { render, screen } from "@testing-library/react";
import * as React from "react";

import { AppInstallButton } from "./AppInstallButton";

vi.mock("@dashboard/hooks/useHasManagedAppsPermission");

vi.mock("@dashboard/featureFlags", async () => ({
  useFlag: vi.fn(() => ({ enabled: true })),
}));

vi.mock("@dashboard/components/Link", async () => ({
  // eslint-disable-next-line react/display-name
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@dashboard/config", async () => ({
  __esModule: true,
  ...(await vi.importActual("@dashboard/config") as object),
  IS_CLOUD_INSTANCE: true,
}));

describe("Extensions / ExtensionItem / AppInstallButton", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("should render disabled install button when has no permissions", () => {
    // Arrange
    ConfigMock.IS_CLOUD_INSTANCE = true;
    vi.mocked(useHasManagedAppsPermission).mockReturnValue({
      hasManagedAppsPermission: false,
    });

    // Act
    render(<AppInstallButton manifestUrl="test-manifest" />);

    // Assert
    expect(screen.getByText("Install")).toBeVisible();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should render disabled install button when no cloud instance", () => {
    // Arrange
    ConfigMock.IS_CLOUD_INSTANCE = false;
    vi.mocked(useHasManagedAppsPermission).mockReturnValue({ hasManagedAppsPermission: true });

    // Act
    render(<AppInstallButton manifestUrl="test-manifest" />);

    // Assert
    expect(screen.getByText("Install")).toBeVisible();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("should render install button when has permissions and cloud instance", () => {
    // Arrange
    ConfigMock.IS_CLOUD_INSTANCE = true;
    vi.mocked(useHasManagedAppsPermission).mockReturnValue({ hasManagedAppsPermission: true });

    // Act
    render(<AppInstallButton manifestUrl="test-manifest" />);

    // Assert
    expect(screen.getByText("Install")).toBeVisible();
    expect(screen.getByRole("button")).toBeEnabled();
  });
});
