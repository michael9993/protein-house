import { render, screen, waitFor } from "@testing-library/react";
import { useIntl } from "react-intl";
import { Link } from "react-router";

import { useUser } from "../auth";
import { PermissionEnum, UserFragment } from "../graphql";
import { ConfigurationPage } from "./ConfigurationPage";
import { MenuSection } from "./types";

vi.mock("@dashboard/featureFlags", () => ({
  useFlag: vi.fn(() => ({ enabled: true })),
}));
vi.mock("@dashboard/hooks/useNavigator", () => ({ default: () => vi.fn() }));
vi.mock("react-router", () => ({
  Link: vi.fn(({ children }) => children),
}));
vi.mock("@dashboard/auth", () => ({
  useUser: vi.fn(),
}));
vi.mock("./styles", () => ({
  useStyles: vi.fn(() => ({})),
}));

const mockUser: UserFragment = {
  __typename: "User",
  id: "1",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  isStaff: true,
  dateJoined: new Date().toISOString(),
  restrictedAccessToChannels: false,
  metadata: [],
  userPermissions: [
    {
      code: PermissionEnum.MANAGE_PRODUCT_TYPES_AND_ATTRIBUTES,
      name: "Manage product types and attributes",
      __typename: "UserPermission",
    },
  ],
  avatar: null,
  accessibleChannels: null,
};

const mockMenu: MenuSection[] = [
  {
    label: "Test Section",
    menuItems: [
      {
        title: "Test Item",
        description: "Test Description",
        icon: <div>Test Icon</div>,
        url: "/test-url",
        permissions: [PermissionEnum.MANAGE_PRODUCT_TYPES_AND_ATTRIBUTES],
        testId: "test-item",
      },
    ],
  },
];

const mockVersionInfo = {
  dashboardVersion: "1.0.0",
  coreVersion: "2.0.0",
};

const renderComponent = (props = {}) => {
  return render(
    <ConfigurationPage menu={mockMenu} user={mockUser} versionInfo={mockVersionInfo} {...props} />,
  );
};

describe("ConfigurationPage", () => {
  beforeEach(() => {
    vi.mocked(useIntl).mockReturnValue({
      formatMessage: ({ defaultMessage }: { defaultMessage: string }) => defaultMessage,
    });
    vi.mocked(Link).mockImplementation(({ children }) => <div>{children}</div>);
    vi.mocked(useUser).mockReturnValue({ user: mockUser });
  });

  it("should display all menu items and their details when rendered", async () => {
    // Arrange
    renderComponent();

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Test Section")).toBeInTheDocument();
      expect(screen.getByText("Test Item")).toBeInTheDocument();
      expect(screen.getByText("Test Description")).toBeInTheDocument();
    });
  });

  it("should render version information in the DOM", async () => {
    // Arrange
    renderComponent();

    // Assert - version info is always in the DOM (visibility controlled by CSS)
    await waitFor(() => {
      expect(screen.getByText(/dashboard 1.0.0/)).toBeInTheDocument();
      expect(screen.getByText(/core v2.0.0/)).toBeInTheDocument();
    });
  });

  it("should not display menu items that user lacks permissions for", async () => {
    // Arrange
    const menuWithRestrictedItem: MenuSection[] = [
      {
        label: "Test Section",
        menuItems: [
          {
            title: "Restricted Item",
            description: "Restricted Description",
            icon: <div>Test Icon</div>,
            url: "/restricted-url",
            permissions: [PermissionEnum.MANAGE_STAFF],
            testId: "restricted-item",
          },
        ],
      },
    ];

    renderComponent({ menu: menuWithRestrictedItem });

    // Assert
    await waitFor(() => {
      expect(screen.queryByText("Restricted Item")).not.toBeInTheDocument();
    });
  });

  it("should not display menu items marked as hidden", async () => {
    // Arrange
    const menuWithHiddenItem: MenuSection[] = [
      {
        label: "Test Section",
        menuItems: [
          {
            title: "Hidden Item",
            description: "Hidden Description",
            icon: <div>Test Icon</div>,
            url: "/hidden-url",
            permissions: [PermissionEnum.MANAGE_PRODUCT_TYPES_AND_ATTRIBUTES],
            hidden: true,
            testId: "hidden-item",
          },
        ],
      },
    ];

    renderComponent({ menu: menuWithHiddenItem });

    // Assert
    await waitFor(() => {
      expect(screen.queryByText("Hidden Item")).not.toBeInTheDocument();
    });
  });

  it("should render menu items with correct test IDs for testing purposes", async () => {
    // Arrange
    renderComponent();

    // Assert
    await waitFor(() => {
      expect(screen.getByTestId("test-item-settings-subsection-test item")).toBeInTheDocument();
    });
  });

  it("should handle missing version information gracefully", async () => {
    // Arrange
    renderComponent({ versionInfo: { dashboardVersion: undefined, coreVersion: undefined } });

    // Assert
    await waitFor(() => {
      expect(screen.queryByText(/dashboard/)).not.toBeInTheDocument();
      expect(screen.queryByText(/core/)).not.toBeInTheDocument();
    });
  });

  it("should handle empty menu sections gracefully", async () => {
    // Arrange
    const emptyMenu: MenuSection[] = [
      {
        label: "Empty Section",
        menuItems: [],
      },
    ];

    renderComponent({ menu: emptyMenu });

    // Assert
    await waitFor(() => {
      expect(screen.queryByText("Empty Section")).not.toBeInTheDocument();
    });
  });

  it("should handle multiple menu sections with different permissions", async () => {
    // Arrange
    const multiSectionMenu: MenuSection[] = [
      {
        label: "Section 1",
        menuItems: [
          {
            title: "Item 1",
            description: "Item 1 Description",
            icon: <div>Item 1 Icon</div>,
            url: "/item1-url",
            permissions: [PermissionEnum.MANAGE_PRODUCT_TYPES_AND_ATTRIBUTES],
            testId: "item1",
          },
        ],
      },
      {
        label: "Section 2",
        menuItems: [
          {
            title: "Item 2",
            description: "Item 2 Description",
            icon: <div>Item 2 Icon</div>,
            url: "/item2-url",
            permissions: [PermissionEnum.MANAGE_STAFF],
            testId: "item2",
          },
        ],
      },
    ];

    renderComponent({ menu: multiSectionMenu });

    // Assert
    await waitFor(() => {
      expect(screen.getByText("Section 1")).toBeInTheDocument();
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.queryByText("Section 2")).not.toBeInTheDocument();
      expect(screen.queryByText("Item 2")).not.toBeInTheDocument();
    });
  });
});
