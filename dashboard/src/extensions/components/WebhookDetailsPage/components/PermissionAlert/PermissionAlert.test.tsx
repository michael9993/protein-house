// jest-dom matchers loaded globally in testUtils/setup.ts

import { Fetcher } from "@graphiql/toolkit";
import { ApolloMockedProvider } from "@test/ApolloMockedProvider";
import { render, screen } from "@testing-library/react";

import { PermissionAlert } from "./PermissionAlert";

vi.mock("@graphiql/toolkit", () => ({
  clear: vi.fn(),
  createGraphiQLFetcher: vi.fn(_x => vi.fn() as Fetcher),
}));

vi.mock("@saleor/macaw-ui", () => ({
  useTheme: vi.fn(() => () => ({})),
  // eslint-disable-next-line react/display-name
  DialogHeader: vi.fn(() => () => <></>),
}));
beforeEach(() => {
  window.localStorage.clear();
});
describe("WebhookSubscriptionQuery", () => {
  it("is available on the webhook page", async () => {
    // Arrange
    const props = {
      query: `subscription {
        event {
          ... on SaleUpdated {
            version
            sale {
              name
            }
          }
          ... on OrderCreated {
            version
            order {
              invoices {
                number
              }
            }
          }
        }
      }
      `,
    };

    render(
      <ApolloMockedProvider>
        <PermissionAlert {...props} />
      </ApolloMockedProvider>,
    );
    // FIXME async components don't work with the current setup
    // await waitFor(() => new Promise((res) => setTimeout(res, 500)))
    // Assert
    expect(screen.queryByTestId("permission-alert")).toBeInTheDocument();
  });
});
