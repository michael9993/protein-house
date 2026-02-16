import { appDetails } from "@dashboard/extensions/fixtures";
import { render } from "@testing-library/react";

import { AppDetailsPage } from "./AppDetailsPage";

const mockHeader = vi.fn();

vi.mock("./Header", () => ({
  Header: (props: unknown) => {
    mockHeader(props);

    return <></>;
  },
}));

const mockAboutCard = vi.fn();

vi.mock("./AboutCard", () => ({
  AboutCard: (props: unknown) => {
    mockAboutCard(props);

    return <></>;
  },
}));

const mockPermissionsCard = vi.fn();

vi.mock("./PermissionsCard", () => ({
  PermissionsCard: (props: unknown) => {
    mockPermissionsCard(props);

    return <></>;
  },
}));

const mockDataPrivacyCard = vi.fn();

vi.mock("./DataPrivacyCard", () => ({
  DataPrivacyCard: (props: unknown) => {
    mockDataPrivacyCard(props);

    return <></>;
  },
}));
beforeEach(() => {
  mockHeader.mockClear();
  mockAboutCard.mockClear();
  mockPermissionsCard.mockClear();
  mockDataPrivacyCard.mockClear();
});
/**
 * TODO Rewrite tests to actually render the tree
 */
describe("Apps AppDetailsPage", () => {
  it("displays app details when app data passed", () => {
    // Arrange
    const onAppActivateOpen = vi.fn();
    const onAppDeactivateOpen = vi.fn();
    const onAppDeleteOpen = vi.fn();

    // Act
    render(
      <AppDetailsPage
        data={appDetails}
        loading={false}
        onAppActivateOpen={onAppActivateOpen}
        onAppDeactivateOpen={onAppDeactivateOpen}
        onAppDeleteOpen={onAppDeleteOpen}
      />,
    );
    // Assert
    expect(mockHeader).toHaveBeenCalledWith({
      data: appDetails,
      onAppActivateOpen,
      onAppDeactivateOpen,
      onAppDeleteOpen,
    });
    expect(mockAboutCard).toHaveBeenCalledWith(
      expect.objectContaining({
        aboutApp: appDetails.aboutApp,
        loading: false,
      }),
    );
    expect(mockPermissionsCard).toHaveBeenCalledWith(
      expect.objectContaining({
        permissions: appDetails.permissions,
        loading: false,
      }),
    );
    expect(mockDataPrivacyCard).toHaveBeenCalledWith(
      expect.objectContaining({
        dataPrivacyUrl: appDetails.dataPrivacyUrl,
        loading: false,
      }),
    );
  });
});
