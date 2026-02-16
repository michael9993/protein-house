import { useCloud } from "@dashboard/auth/hooks/useCloud";
import { useDevModeContext } from "@dashboard/components/DevModePanel/hooks";
import { useNavigatorSearchContext } from "@dashboard/components/NavigatorSearch/useNavigatorSearchContext";
import { ThemeProvider as LegacyThemeProvider } from "@saleor/macaw-ui";
import { ThemeProvider } from "@saleor/macaw-ui-next";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode } from "react";
import { MemoryRouter } from "react-router";

import { Sidebar } from "./Sidebar";
import { SidebarProvider } from "./SidebarContext";

vi.mock("./menu/hooks/useMenuStructure", () => ({
  useMenuStructure: vi.fn(() => []),
}));
vi.mock("@dashboard/featureFlags/useFlagsInfo", () => ({
  useFlagsInfo: vi.fn(() => []),
}));
vi.mock("@dashboard/auth/hooks/useCloud", () => ({
  useCloud: vi.fn(() => ({
    isAuthenticatedViaCloud: false,
  })),
}));
vi.mock("@dashboard/components/DevModePanel/hooks", () => ({
  useDevModeContext: vi.fn(() => ({
    variables: "",
    setVariables: vi.fn(),
    isDevModeVisible: false,
    setDevModeVisibility: vi.fn(),
    devModeContent: "",
    setDevModeContent: vi.fn(),
  })),
}));
vi.mock("@dashboard/components/NavigatorSearch/useNavigatorSearchContext", () => ({
  useNavigatorSearchContext: vi.fn(() => ({
    isNavigatorVisible: false,
    setNavigatorVisibility: vi.fn(),
  })),
}));
vi.mock("@dashboard/components/ProductAnalytics/useAnalytics", () => ({
  useAnalytics: vi.fn(() => ({
    initialize: vi.fn(),
    trackEvent: vi.fn(),
  })),
}));
vi.mock("@dashboard/ripples/state", () => ({
  useAllRipplesModalState: vi.fn(() => ({
    isModalOpen: false,
    setModalState: vi.fn(),
  })),
}));

const Wrapper = ({ children }: { children: ReactNode }) => {
  return (
    <MemoryRouter>
      {/* @ts-expect-error - legacy types */}
      <LegacyThemeProvider>
        <ThemeProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ThemeProvider>
      </LegacyThemeProvider>
    </MemoryRouter>
  );
};

describe("Sidebar", () => {
  it('should render "Saleor Cloud" link when is cloud instance', () => {
    // Arrange
    vi.mocked(useCloud).mockImplementation(() => ({
      isAuthenticatedViaCloud: true,
    }));
    // Act
    render(<Sidebar />, { wrapper: Wrapper });
    // Assert
    expect(screen.getByTestId("cloud-environment-link")).toBeInTheDocument();
  });
  it('should not render "Saleor Cloud" link when is not cloud instance', () => {
    // Arrange
    vi.mocked(useCloud).mockImplementation(() => ({
      isAuthenticatedViaCloud: false,
    }));
    // Act
    render(<Sidebar />, { wrapper: Wrapper });
    // Assert
    expect(screen.queryByTestId("cloud-environment-link")).not.toBeInTheDocument();
  });
  it("should render keyboard shortcuts", () => {
    // Arrange & Act
    render(<Sidebar />, { wrapper: Wrapper });
    // Assert
    expect(screen.getByText("Command menu")).toBeInTheDocument();
    expect(screen.getByText("Playground")).toBeInTheDocument();
  });
  it("should call callback when click on playground shortcut", async () => {
    // Arrange
    const actionCallback = vi.fn();

    vi.mocked(useDevModeContext).mockImplementationOnce(() => ({
      variables: "",
      setVariables: vi.fn(),
      isDevModeVisible: false,
      setDevModeVisibility: actionCallback,
      devModeContent: "",
      setDevModeContent: vi.fn(),
    }));
    render(<Sidebar />, { wrapper: Wrapper });
    // Act
    await userEvent.click(screen.getByText("Playground"));
    // Assert
    expect(actionCallback).toHaveBeenCalledWith(true);
  });
  it("should call callback when click on search shortcut", async () => {
    // Arrange
    const actionCallback = vi.fn();

    vi.mocked(useNavigatorSearchContext).mockImplementationOnce(() => ({
      isNavigatorVisible: false,
      setNavigatorVisibility: actionCallback,
    }));
    render(<Sidebar />, { wrapper: Wrapper });
    // Act
    await userEvent.click(screen.getByText("Command menu"));
    // Assert
    expect(actionCallback).toHaveBeenCalledWith(true);
  });
});
