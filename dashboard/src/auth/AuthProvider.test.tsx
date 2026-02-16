import { useApolloClient } from "@apollo/client";
import { useUserDetailsQuery } from "@dashboard/graphql";
import useNotifier from "@dashboard/hooks/useNotifier";
import { useAuth, useAuthState } from "@saleor/sdk";
import { act, renderHook } from "@testing-library/react-hooks";
import { useIntl } from "react-intl";

import { useAuthProvider } from "./hooks/useAuthProvider";

const originalWindowNavigator = window.navigator;
const adminCredentials = {
  email: "admin@example.com",
  password: "admin",
  token: null,
};
const nonStaffUserCredentials = {
  email: "client@example.com",
  password: "password",
};

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  Object.defineProperty(window, "navigator", {
    configurable: true,
    enumerable: true,
    value: {
      credentials: {
        get: vi.fn(),
      },
    },
  });
});
afterAll(() => {
  Object.defineProperty(window, "navigator", {
    configurable: true,
    enumerable: true,
    value: originalWindowNavigator,
  });
});
vi.mock("@saleor/sdk", () => ({
  useAuth: vi.fn(() => ({
    login: vi.fn(() => ({
      data: {
        tokenCreate: {
          errors: [],
          user: {
            userPermissions: [
              {
                code: "MANAGE_USERS",
                name: "Handle checkouts",
              },
            ],
          },
        },
      },
    })),
    logout: vi.fn(),
  })),
  useAuthState: vi.fn(() => undefined),
}));
vi.mock("@apollo/client", () => ({
  useApolloClient: vi.fn(() => ({
    clearStore: vi.fn(),
  })),
  ApolloError: vi.fn(),
}));
vi.mock("@dashboard/graphql", () => ({
  useUserDetailsQuery: vi.fn(() => ({
    data: undefined,
  })),
}));
vi.mock("@dashboard/hooks/useNotifier", () => ({
  __esModule: true,
  default: vi.fn(() => () => undefined),
}));
vi.mock("@dashboard/hooks/useNavigator", () => ({
  __esModule: true,
  default: vi.fn(() => () => undefined),
}));
vi.mock("@dashboard/hooks/useLocalStorage", () => ({
  __esModule: true,
  default: vi.fn(() => []),
}));
vi.mock("@dashboard/auth", () => ({
  useUser: vi.fn(),
}));
vi.mock("use-react-router", () => ({
  __esModule: true,
  default: vi.fn(() => ({
    location: {},
  })),
}));
describe("AuthProvider", () => {
  it("Staff user will be logged in if has valid credentials", async () => {
    // Arrange
    const intl = useIntl();
    const notify = useNotifier();
    const apolloClient = useApolloClient();

    vi.mocked(useAuthState).mockImplementation(() => ({
      authenticated: true,
      authenticating: false,
      user: {
        isStaff: true,
      },
    }));
    vi.mocked(useUserDetailsQuery).mockImplementation(() => ({
      data: {
        me: {
          email: adminCredentials.email,
          isStaff: true,
        },
      },
    }));

    // Act
    const hook = renderHook(() => useAuthProvider({ intl, notify, apolloClient }));

    await act(async () => {
      hook.result.current.login!(adminCredentials.email, adminCredentials.password);
    });
    // Assert
    expect(hook.result.current.user?.email).toBe(adminCredentials.email);
    expect(hook.result.current.authenticated).toBe(true);
  });
  it("User will not be logged in if doesn't have valid credentials", async () => {
    // Arrange
    const intl = useIntl();
    const notify = useNotifier();
    const apolloClient = useApolloClient();

    vi.mocked(useAuthState).mockImplementation(() => ({
      authenticated: false,
      authenticating: false,
    }));
    vi.mocked(useUserDetailsQuery).mockImplementation(() => ({
      data: {
        me: null,
      },
    }));

    // Act
    const hook = renderHook(() => useAuthProvider({ intl, notify, apolloClient }));

    // Assert
    expect(hook.result.current.user).toBe(null);
    expect(hook.result.current.authenticated).toBe(false);
  });
  it("Non-staff user will not be logged in", async () => {
    // Arrange
    const intl = useIntl();
    const notify = useNotifier();
    const apolloClient = useApolloClient();

    vi.mocked(useAuthState).mockImplementation(() => ({
      authenticated: false,
      authenticating: false,
    }));
    vi.mocked(useUserDetailsQuery).mockImplementation(() => ({
      data: {
        me: {
          email: nonStaffUserCredentials.email,
          isStaff: false,
        },
      },
    }));

    // Act
    const hook = renderHook(() => useAuthProvider({ intl, notify, apolloClient }));

    await act(async () => {
      hook.result.current.login!(nonStaffUserCredentials.email, nonStaffUserCredentials.password);
    });
    // Assert
    expect(hook.result.current.errors).toEqual([]);
    expect(hook.result.current.authenticated).toBe(false);
  });
  it("Should logout user without userPermissions", async () => {
    const intl = useIntl();
    const notify = useNotifier();
    const apolloClient = useApolloClient();

    vi.mocked(useAuth).mockImplementation(() => ({
      login: vi.fn(() => ({
        data: {
          tokenCreate: {
            errors: [],
            user: {
              userPermissions: [],
            },
          },
        },
      })),
      logout: vi.fn(),
    }));

    // Act
    const hook = renderHook(() => useAuthProvider({ intl, notify, apolloClient }));

    await act(async () => {
      hook.result.current.login!(nonStaffUserCredentials.email, nonStaffUserCredentials.password);
    });
    // Assert
    expect(hook.result.current.errors).toEqual(["noPermissionsError"]);
    expect(hook.result.current.authenticated).toBe(false);
  });

  it("should handle concurrent login attempts correctly", async () => {
    const intl = useIntl();
    const notify = useNotifier();
    const apolloClient = useApolloClient();

    vi.mocked(useAuthState).mockImplementation(() => ({
      authenticated: false,
      authenticating: false,
    }));

    const loginMock = vi.fn(
      () =>
        new Promise(resolve => {
          return resolve({
            data: {
              tokenCreate: {
                errors: [],
                user: {
                  userPermissions: [
                    {
                      code: "MANAGE_USERS",
                      name: "Handle checkouts",
                    },
                  ],
                },
              },
            },
          });
        }),
    );

    vi.mocked(useAuth).mockImplementation(() => ({
      login: loginMock,
      logout: vi.fn(),
    }));

    const { result } = renderHook(() => useAuthProvider({ intl, notify, apolloClient }));

    // Simulate two concurrent login attempts
    result.current.login!("email", "password");
    result.current.login!("email", "password");

    expect(loginMock).toHaveBeenCalledTimes(1);
  });
});
