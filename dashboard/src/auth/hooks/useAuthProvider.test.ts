import { ApolloError } from "@apollo/client";
import { AccountErrorCode } from "@dashboard/graphql";
import { useAuth, useAuthState } from "@saleor/sdk";
import { waitFor } from "@testing-library/react";
import { act, renderHook } from "@testing-library/react";

import { useAuthProvider } from "./useAuthProvider";

// Mock dependencies
vi.mock("@saleor/sdk");

const useAuthStateMock = {
  authenticated: false,
  authenticating: false,
  user: null,
};

const mockLogin = vi.fn();

vi.mock("@dashboard/utils/credentialsManagement", async () => ({
  login: vi.fn(),
  saveCredentials: vi.fn(),
  isSupported: true,
}));

const mockNavigate = vi.fn();

vi.mock("@dashboard/hooks/useNavigator", () => () => mockNavigate);

const mockNotify = vi.fn();
const mockIntl = {
  formatMessage: vi.fn(message => message.defaultMessage),
};
const mockApolloClient = {
  clearStore: vi.fn(),
};

vi.mock("@dashboard/graphql", async () => {
  const actualModule = await vi.importActual("@dashboard/graphql");

  return {
    __esModule: true,
    ...actualModule,
    useUserDetailsQuery: vi.fn(() => ({
      data: undefined,
    })),
  };
});

vi.mocked(useAuthState).mockReturnValue(useAuthStateMock);
vi.mocked(useAuth).mockReturnValue({
  login: mockLogin,
});
describe("useAuthProvider", () => {
  describe("handleLogin", () => {
    it("should handle successful login", async () => {
      // Arrange
      mockLogin.mockResolvedValueOnce({
        data: {
          tokenCreate: {
            errors: [],
            user: {
              email: "admin@example.com",
              userPermissions: ["MANAGE_ORDERS"],
              isStaff: true,
            },
          },
        },
      });

      // Act
      const { result } = renderHook(() =>
        useAuthProvider({
          intl: mockIntl as any,
          notify: mockNotify,
          apolloClient: mockApolloClient as any,
        }),
      );

      await act(async () => {
        await result.current.login!("admin@example.com", "password");
      });

      // Assert
      waitFor(() => {
        expect(mockLogin).toBeCalledtimes(1);
        expect(mockLogin).toHaveBeenCalledWith({
          email: "admin@example.com",
          password: "password",
          includeDetails: false,
        });
      });
    });

    it("should handle login with no permissions", async () => {
      // Arrange
      mockLogin.mockResolvedValueOnce({
        data: {
          tokenCreate: {
            errors: [],
            user: {
              email: "user@example.com",
              userPermissions: [],
              isStaff: false,
            },
          },
        },
      });

      // Act
      const { result } = renderHook(() =>
        useAuthProvider({
          intl: mockIntl as any,
          notify: mockNotify,
          apolloClient: mockApolloClient as any,
        }),
      );

      await act(async () => {
        await result.current.login!("user@example.com", "password");
      });

      // Assert
      waitFor(() => {
        expect(result.current.errors).toContain("noPermissionsError");
      });
    });

    it("should handle invalid credentials error", async () => {
      // Arrange
      mockLogin.mockResolvedValueOnce({
        data: {
          tokenCreate: {
            errors: [{ code: AccountErrorCode.INVALID_CREDENTIALS }],
            user: null,
          },
        },
      });

      // Act
      const { result } = renderHook(() =>
        useAuthProvider({
          intl: mockIntl as any,
          notify: mockNotify,
          apolloClient: mockApolloClient as any,
        }),
      );

      await act(async () => {
        await result.current.login!("wrong@example.com", "wrongpass");
      });

      // Assert
      waitFor(() => {
        expect(result.current.errors).toContain("invalidCredentials");
      });
    });

    it("should handle login attempt delayed error", async () => {
      // Arrange
      mockLogin.mockResolvedValueOnce({
        data: {
          tokenCreate: {
            errors: [{ code: AccountErrorCode.LOGIN_ATTEMPT_DELAYED }],
            user: null,
          },
        },
      });

      // Act
      const { result } = renderHook(() =>
        useAuthProvider({
          intl: mockIntl as any,
          notify: mockNotify,
          apolloClient: mockApolloClient as any,
        }),
      );

      await act(async () => {
        await result.current.login!("test@example.com", "password");
      });

      // Assert
      expect(result.current.errors).toContain("loginAttemptDelay");
    });

    it("should handle Apollo error", async () => {
      // Arrange
      mockLogin.mockRejectedValueOnce(
        new ApolloError({
          networkError: new Error("Network error"),
        }),
      );

      // Act
      const { result } = renderHook(() =>
        useAuthProvider({
          intl: mockIntl as any,
          notify: mockNotify,
          apolloClient: mockApolloClient as any,
        }),
      );

      await act(async () => {
        await result.current.login!("test@example.com", "password");
      });

      // Assert
      expect(result.current.errors).toContain("unknownLoginError");
    });

    it("should handle other login errors", async () => {
      // Arrange
      mockLogin.mockResolvedValueOnce({
        data: {
          tokenCreate: {
            errors: [{ code: AccountErrorCode.ACCOUNT_NOT_CONFIRMED }],
            user: null,
          },
        },
      });

      // Act
      const { result } = renderHook(() =>
        useAuthProvider({
          intl: mockIntl as any,
          notify: mockNotify,
          apolloClient: mockApolloClient as any,
        }),
      );

      await act(async () => {
        await result.current.login!("test@example.com", "password");
      });

      // Assert
      expect(result.current.errors).toContain("loginError");
    });
  });
});
