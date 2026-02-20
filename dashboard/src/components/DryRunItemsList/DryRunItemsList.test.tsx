// @ts-strict-ignore
import { MockedProvider, MockedResponse } from "@apollo/client/testing";
import { productsMocks } from "@test/mocks/products";
import { render, screen } from "@testing-library/react";

import DryRunItemsList from "./DryRunItemsList";


const mocks: MockedResponse[] = [...productsMocks];

describe("DryRunItemsList", () => {
  it("is available on the webhook page", async () => {
    // Arrange
    const props = {
      objectId: null,
      setObjectId: vi.fn(),
      object: "PRODUCT",
    };

    // Act
    render(
      <MockedProvider mocks={mocks} >
        <DryRunItemsList {...props} />
      </MockedProvider>,
    );
    // Assert
    expect(screen.queryByTestId("dry-run-items-list")).toBeInTheDocument();
  });
});
