import { ExtensionData } from "@dashboard/extensions/types";
import { render, screen } from "@testing-library/react";
import * as React from "react";

import { ExtensionItem } from "./ExtenionItem";

vi.mock("@dashboard/hooks/useNavigator", async () => ({
  __esModule: true,
  default: vi.fn(() => vi.fn()),
}));

vi.mock("@dashboard/utils/permissions", async () => ({
  useUserHasPermissions: vi.fn(() => true),
}));

vi.mock("@dashboard/components/Link", async () => ({
  // eslint-disable-next-line react/display-name
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@dashboard/featureFlags", async () => ({
  useFlag: vi.fn(() => ({ enabled: true })),
}));

vi.mock("@saleor/macaw-ui-next", async () => ({
  ...(await vi.importActual("@saleor/macaw-ui-next") as object),
  useTheme: () => ({ theme: "default" }),
}));

const baseApp = {
  type: "APP",
  kind: "OFFICIAL",
  name: {
    en: "Avatax",
  },
  id: "mirumee.avatax",
  logo: {
    light: {
      source: "http://example.com",
    },
    dark: {
      source: "http://example.com",
    },
  },
  repositoryUrl: "https://example.com/repo",
  manifestUrl: "https://example.com/manifest",
  description: {
    en: "Avatax description",
  },
};

describe("Extensions / Components / ExtensionItem", () => {
  it("should render extension with actions", () => {
    // Arrange
    const extension = { ...baseApp, installed: false } as ExtensionData;

    render(<ExtensionItem extension={extension} />);

    // Assert
    expect(screen.getByText("Avatax")).toBeInTheDocument();
    expect(screen.getByText("Avatax description")).toBeInTheDocument();
    expect(screen.getByText("Developed by {developer}")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Install" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View on GitHub" })).toBeInTheDocument();
    expect(screen.queryByText("Installed")).not.toBeInTheDocument();
  });

  it("should render installed extension with actions", () => {
    // Arrange
    const extension = {
      ...baseApp,
      installed: true,
      appId: "appId",
    } as ExtensionData;

    render(<ExtensionItem extension={extension} />);

    // Assert
    expect(screen.getByText("Avatax")).toBeInTheDocument();
    expect(screen.getByText("Avatax description")).toBeInTheDocument();
    expect(screen.getByText("Developed by {developer}")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Install" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View on GitHub" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View details" })).toBeInTheDocument();
    expect(screen.getByText("Installed")).toBeInTheDocument();
  });

  it("should render warning when extension is a plugin", () => {
    // Arrange
    const extension = {
      ...baseApp,
      type: "PLUGIN",
    } as ExtensionData;

    render(<ExtensionItem extension={extension} />);

    // Assert
    expect(
      screen.getByText(
        "We are working on replacing plugins with apps. Use apps unless no other option. {learnMore}",
      ),
    ).toBeInTheDocument();
  });
});
