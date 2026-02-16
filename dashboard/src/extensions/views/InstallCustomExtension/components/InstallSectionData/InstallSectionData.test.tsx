import { render, screen } from "@testing-library/react";
import { Control, useWatch } from "react-hook-form";

import { ExtensionInstallFormData, InstallDetailsManifestData } from "../../types";
import { InstallExtensionManifestData } from "./InstallExtensionManifestData/InstallExtensionManifestData";
import { InstallSectionData } from "./InstallSectionData";

vi.mock("./InstallExtensionManifestData/InstallExtensionManifestData", () => ({
  InstallExtensionManifestData: vi.fn(() => <div>Mock Manifest Data</div>),
}));

vi.mock("react-hook-form", () => ({
  useWatch: vi.fn(),
}));

describe("InstallSectionData", () => {
  const mockControl = {} as Control<ExtensionInstallFormData>;
  const mockManifest: InstallDetailsManifestData = {
    name: "Test Extension",
    permissions: [],
    dataPrivacyUrl: "https://example.com/privacy",
    brand: {
      __typename: "AppManifestBrand",
      logo: {
        __typename: "AppManifestBrandLogo",
        default: "https://example.com/logo.png",
      },
    },
  };

  it("displays skeleton loading state when isFetchingManifest is true", () => {
    // Arrange
    vi.mocked(useWatch).mockReturnValue("https://example.com/manifest.json");

    const { container } = render(
      <InstallSectionData
        isFetchingManifest={true}
        manifest={undefined}
        lastFetchedManifestUrl={undefined}
        control={mockControl}
      />,
    );

    // Assert
    const skeletons = container.querySelectorAll('[data-macaw-ui-component="Skeleton"]');

    expect(skeletons).toHaveLength(7);
  });

  it("displays manifest data when manifest exists and lastFetchedManifestUrl matches form value", () => {
    // Arrange
    const manifestUrl = "https://example.com/manifest.json";

    vi.mocked(useWatch).mockReturnValue(manifestUrl);

    render(
      <InstallSectionData
        isFetchingManifest={false}
        manifest={mockManifest}
        lastFetchedManifestUrl={manifestUrl}
        control={mockControl}
      />,
    );

    // Assert
    expect(screen.getByText("Mock Manifest Data")).toBeInTheDocument();
    expect(InstallExtensionManifestData).toHaveBeenCalledWith(
      { manifest: mockManifest },
      expect.anything(),
    );
  });

  it("returns null when manifest exists but lastFetchedManifestUrl does not match form value", () => {
    // Arrange
    vi.mocked(useWatch).mockReturnValue("https://example.com/manifest.json");

    const { container } = render(
      <InstallSectionData
        isFetchingManifest={false}
        manifest={mockManifest}
        lastFetchedManifestUrl="https://different-url.com/manifest.json"
        control={mockControl}
      />,
    );

    // Assert
    expect(container).toBeEmptyDOMElement();
  });

  it("returns null when manifest doesn't exist and it's not being fetched", () => {
    // Arrange
    vi.mocked(useWatch).mockReturnValue("https://example.com/manifest.json");

    const { container } = render(
      <InstallSectionData
        isFetchingManifest={false}
        manifest={undefined}
        lastFetchedManifestUrl={undefined}
        control={mockControl}
      />,
    );

    // Assert
    expect(container).toBeEmptyDOMElement();
  });
});
