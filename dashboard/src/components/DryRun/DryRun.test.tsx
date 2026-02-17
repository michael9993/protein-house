import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { WebhookEventTypeSyncEnum } from "@dashboard/graphql";
import { ThemeProvider } from "@saleor/macaw-ui";
import productsMocks from "@test/mocks/products";
import { render, screen } from "@testing-library/react";

import DryRun from "./DryRun";


const mocks: MockedResponse[] = [...productsMocks];

describe("DryRun", () => {
  it("Dialog is available on the webhook page", async () => {
    // Arrange
    const props = {
      query: "",
      showDialog: true,
      setShowDialog: vi.fn(),
      setResult: vi.fn(),
      syncEvents: [] as WebhookEventTypeSyncEnum[],
    };

    // Act
    render(
      <MockedProvider mocks={mocks} >
        {/* @ts-expect-error legacy types */}
        <ThemeProvider>
          <DryRun {...props} />
        </ThemeProvider>
      </MockedProvider>,
    );
    // Assert
    expect(screen.queryByTestId("dry-run")).toBeInTheDocument();
  });
});
