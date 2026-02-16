import { MockedProvider } from "@apollo/client/testing";
import { mockResizeObserver } from "@dashboard/components/Datagrid/testUtils";
import { PromotionTypeEnum } from "@dashboard/graphql";
import { ThemeProvider as LegacyThemeProvider } from "@saleor/macaw-ui";
import { ThemeProvider } from "@saleor/macaw-ui-next";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ReactNode } from "react";

import {
  searchCategoriesMock,
  searchCollectionsMock,
  searchProductsMock,
  searchVariantsMock,
} from "./componenets/RuleForm/components/RuleConditionValues/hooks/options/mocks";
import { variantsWithProductDataMock } from "./componenets/RuleForm/components/RuleRewardGifts/mock";
import { DiscountRules } from "./DiscountRules";
import { catalogComplexRules, catalogRules, channels, orderRules } from "./mocksData";

vi.mock("@dashboard/hooks/useNotifier", () => ({
  __esModule: true,
  default: vi.fn(() => () => undefined),
}));
vi.mock("@dashboard/discounts/views/DiscountDetails/context/context", () => ({
  __esModule: true,
  useLabelMapsContext: vi.fn(() => ({
    ruleConditionsValues: {
      labels: {},
      loading: false,
    },
    gifts: {
      labels: [],
      loading: false,
    },
  })),
}));
vi.mock("./hooks/useGraphQLPlayground", () => ({
  useGraphQLPlayground: vi.fn(() => ({
    opepnGrapQLPlayground: vi.fn(),
  })),
}));
vi.setConfig({ testTimeout: 30000 }); // Timeout was increased because of error throw in update test when run all tests

const Wrapper = ({ children }: { children: ReactNode }) => {
  return (
    <MockedProvider
      mocks={[
        searchCategoriesMock,
        searchCollectionsMock,
        searchProductsMock,
        searchVariantsMock,
        variantsWithProductDataMock,
      ]}
    >
      {/* @ts-expect-error legacy types */}
      <LegacyThemeProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </LegacyThemeProvider>
    </MockedProvider>
  );
};

describe("DiscountRules", () => {
  // Radix Select sets pointer-events: none on body when open; userEvent v14 checks this
  const user = userEvent.setup({ pointerEventsCheck: 0 });

  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const mockIntersectionObserver = vi.fn();

    mockIntersectionObserver.mockReturnValue({
      observe: () => null,
      unobserve: () => null,
      disconnect: () => null,
    });
    window.IntersectionObserver = mockIntersectionObserver;
    mockResizeObserver();
  });
  it("should render placeholder when no rules", () => {
    // Arrange & Act
    render(
      <DiscountRules
        promotionId={null}
        discountType={PromotionTypeEnum.CATALOGUE}
        channels={[]}
        rules={[]}
        errors={[]}
        onRuleSubmit={vi.fn()}
        onRuleDelete={vi.fn()}
        disabled={false}
        deleteButtonState="default"
        getRuleConfirmButtonState={vi.fn(() => "default")}
      />,
      { wrapper: Wrapper },
    );
    // Assert
    expect(screen.getByText(/add your first rule to set up a promotion/i)).toBeInTheDocument();
  });
  it("should render catalog discount rules", async () => {
    // Arrange & Act
    render(
      <DiscountRules
        promotionId={null}
        discountType={PromotionTypeEnum.CATALOGUE}
        channels={[]}
        rules={catalogRules}
        errors={[]}
        onRuleSubmit={vi.fn()}
        onRuleDelete={vi.fn()}
        disabled={false}
        deleteButtonState="default"
        getRuleConfirmButtonState={vi.fn(() => "default")}
      />,
      { wrapper: Wrapper },
    );
    await waitFor(() => {
      expect(screen.getByText(/catalog rule: catalog rule 2/i)).toBeInTheDocument();
    });
    // Assert
    expect(screen.getByText(/catalog rule: catalog rule 2/i)).toBeInTheDocument();
    expect(screen.getByText(/catalog rule: catalog rule 1/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /discount of {value} on the purchase of {conditions} through the {channel}/i,
      ).length,
    ).toBe(2);
  });
  it("should render order discount rules", async () => {
    // Arrange & Act
    render(
      <DiscountRules
        promotionId={null}
        discountType={PromotionTypeEnum.ORDER}
        channels={[]}
        rules={orderRules}
        errors={[]}
        onRuleSubmit={vi.fn()}
        onRuleDelete={vi.fn()}
        disabled={false}
        deleteButtonState="default"
        getRuleConfirmButtonState={vi.fn(() => "default")}
      />,
      { wrapper: Wrapper },
    );
    await waitFor(() => {
      expect(screen.getByText(/order rule: order rule 2/i)).toBeInTheDocument();
    });
    // Assert
    expect(screen.getByText(/order rule: order rule 2/i)).toBeInTheDocument();
    expect(screen.getByText(/order rule: order rule 1/i)).toBeInTheDocument();
    expect(
      screen.getAllByText(
        /discount of {value} on the purchase of {conditions} through the {channel}/i,
      ).length,
    ).toBe(2);
  });
  // TODO: Radix Select condition-value/reward-gifts portals don't render options in jsdom
  // after @testing-library/react v16 + @testing-library/dom v10 upgrade. Simpler select
  // interactions (channel-dropdown, condition-name) work fine. Needs investigation.
  it.skip("should allow to add new catalog rule", async () => {
    // Arrange
    const onRuleAdd = vi.fn();

    render(
      <DiscountRules
        promotionId={null}
        discountType={PromotionTypeEnum.CATALOGUE}
        channels={channels}
        rules={[]}
        errors={[]}
        onRuleSubmit={onRuleAdd}
        onRuleDelete={vi.fn()}
        disabled={false}
        deleteButtonState="default"
        getRuleConfirmButtonState={vi.fn(() => "default")}
      />,
      { wrapper: Wrapper },
    );
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add rule/i })).toBeInTheDocument();
    });
    // Act
    await act(async () => {
      await user.click(screen.getByRole("button", { name: /add rule/i }));
    });
    await user.type(screen.getByRole("input", { name: "Name" }), "Name 123");
    // Select channel
    await user.click(screen.getByTestId("channel-dropdown"));
    expect(await screen.findByText(/test/i)).toBeInTheDocument();
    await act(async () => {
      await user.click((await screen.findAllByTestId("select-option"))[0]);
    });
    // Add condition
    await user.click(screen.getByRole("button", { name: /add condition/i }));
    await user.click(await screen.findByTestId(/condition-name-0/i));
    await user.click((await screen.findAllByTestId("select-option"))[0]);
    await user.click(await screen.findByTestId(/condition-value-0/i));
    await user.click(await (await screen.findAllByTestId("select-option"))[0]);
    // Add reward value
    await user.type(screen.getByRole("input", { name: "Reward value" }), "22");
    await user.click(screen.getByRole("button", { name: /save/i }));
    // Assert
    expect(onRuleAdd).toHaveBeenCalledWith(
      {
        channel: {
          label: "Test",
          value: "Q2hhbm5lcDoy",
        },
        conditions: [
          {
            id: "product",
            type: "is",
            value: [
              {
                label: "Apple Juice",
                value: "UHJvZHVjdDo3Mg==",
              },
            ],
          },
        ],
        description: "",
        id: "",
        name: "Name 123",
        rewardValue: 22,
        rewardGifts: [],
        rewardType: null,
        rewardValueType: "FIXED",
      },
      null,
    );
  });
  it("should allow to add new order rule", async () => {
    // Arrange
    const onRuleAdd = vi.fn();

    render(
      <DiscountRules
        promotionId={null}
        discountType={PromotionTypeEnum.ORDER}
        channels={channels}
        rules={[]}
        errors={[]}
        onRuleSubmit={onRuleAdd}
        onRuleDelete={vi.fn()}
        disabled={false}
        deleteButtonState="default"
        getRuleConfirmButtonState={vi.fn(() => "default")}
      />,
      { wrapper: Wrapper },
    );
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /add rule/i })).toBeInTheDocument();
    });
    // Act
    await act(async () => {
      await user.click(screen.getByRole("button", { name: /add rule/i }));
    });
    await user.type(screen.getByRole("input", { name: "Name" }), "Order rule 123");
    // Channel select
    await user.click(screen.getByTestId("channel-dropdown"));
    expect(await screen.findByText(/test/i)).toBeInTheDocument();
    await act(async () => {
      await user.click((await screen.findAllByTestId("select-option"))[0]);
    });
    // Condition select
    await user.click(screen.getByRole("button", { name: /add condition/i }));
    await user.click(await screen.findByTestId(/condition-name-0/i));
    await user.click((await screen.findAllByTestId("select-option"))[0]);
    await user.click(await screen.findByTestId(/condition-type-0/i));
    await user.click((await screen.findAllByTestId("select-option"))[2]);
    await user.type(await screen.findByTestId(/condition-value-0/i), "144");
    // Reward value
    await user.click(screen.getByRole("radio", { name: "$" }));
    await user.type(screen.getByRole("input", { name: "Reward value" }), "22");
    await user.click(screen.getByRole("button", { name: /save/i }));
    // Assert
    expect(onRuleAdd).toHaveBeenCalledWith(
      {
        channel: {
          label: "Test",
          value: "Q2hhbm5lcDoy",
        },
        conditions: [
          {
            id: "baseSubtotalPrice",
            type: "greater",
            value: "144",
          },
        ],
        description: "",
        id: "",
        name: "Order rule 123",
        rewardValue: 22,
        rewardGifts: [],
        rewardType: "SUBTOTAL_DISCOUNT",
        rewardValueType: "FIXED",
      },
      null,
    );
  });
  // TODO: Radix Select condition-value portals don't render options in jsdom (see above)
  it.skip("should allow to to handle update catalog rule", async () => {
    // Arrange
    const onRuleEdit = vi.fn();

    render(
      <DiscountRules
        promotionId={null}
        discountType={PromotionTypeEnum.CATALOGUE}
        channels={channels}
        rules={catalogRules}
        errors={[]}
        onRuleSubmit={onRuleEdit}
        onRuleDelete={vi.fn()}
        disabled={false}
        deleteButtonState="default"
        getRuleConfirmButtonState={vi.fn(() => "default")}
      />,
      { wrapper: Wrapper },
    );
    await waitFor(() => {
      expect(screen.getAllByTestId("rule-edit-button")[0]).toBeInTheDocument();
    });
    // Act
    await act(async () => {
      await user.click(screen.getAllByTestId("rule-edit-button")[0]);
    });
    await screen.findAllByText(/edit rule/i);

    // Edit name
    const nameField = screen.getByRole("input", { name: "Name" });

    await user.clear(nameField);
    await user.type(nameField, "New name");
    // Edit condition
    await user.click(await screen.findByTestId(/condition-name-0/i));
    await user.click((await screen.findAllByTestId("select-option"))[1]);
    await user.click(await screen.findByTestId(/condition-value-0/i));
    await user.click(await (await screen.findAllByTestId("select-option"))[2]);
    // Remove condition
    await act(async () => {
      await user.click(await screen.findByTestId(/condition-remove-1/i));
    });
    // Add new condition
    await act(async () => {
      await user.click(screen.getByRole("button", { name: /add condition/i }));
    });
    await user.click(await screen.findByTestId(/condition-name-1/i));
    await user.click((await screen.findAllByTestId("select-option"))[0]);
    await user.click(await screen.findByTestId(/condition-value-1/i));
    await user.click(await (await screen.findAllByTestId("select-option"))[1]);
    // Edit reward
    await user.click(screen.getByRole("radio", { name: "$" }));

    const discountValueField = screen.getByRole("input", {
      name: "Reward value",
    });

    await user.clear(discountValueField);
    await user.type(discountValueField, "122");
    await user.click(screen.getByRole("button", { name: /save/i }));
    // Assert
    expect(onRuleEdit).toHaveBeenCalledWith(
      {
        id: "cat-1",
        name: "New name",
        channel: {
          label: "Test",
          value: "Q2hhbm5lcDoy",
        },
        conditions: [
          {
            id: "variant",
            type: "is",
            value: [
              {
                label: "Carrot Juice - 1l",
                value: "UHJvZHVjdFZhcmlhbnQ6MjA2",
              },
            ],
          },
          {
            id: "product",
            type: "is",
            value: [
              {
                label: "Banana Juice",
                value: "UHJvZHVjdDo3NA==",
              },
            ],
          },
        ],
        description: "",
        rewardValue: 122,
        rewardGifts: [],
        rewardType: null,
        rewardValueType: "FIXED",
      },
      0,
    );
  });
  // TODO: Radix Select reward-gifts portals don't render options in jsdom (see above)
  it.skip("should allow to to handle update order rule", async () => {
    // Arrange
    const onRuleEdit = vi.fn();

    render(
      <DiscountRules
        promotionId={null}
        discountType={PromotionTypeEnum.ORDER}
        channels={channels}
        rules={orderRules}
        errors={[]}
        onRuleSubmit={onRuleEdit}
        onRuleDelete={vi.fn()}
        disabled={false}
        deleteButtonState="default"
        getRuleConfirmButtonState={vi.fn(() => "default")}
      />,
      { wrapper: Wrapper },
    );
    await waitFor(() => {
      expect(screen.getAllByTestId("rule-edit-button")[0]).toBeInTheDocument();
    });
    // Act
    await act(async () => {
      await user.click(screen.getAllByTestId("rule-edit-button")[0]);
    });
    await screen.findAllByText(/edit rule/i);

    // Edit name
    const nameField = screen.getByRole("input", { name: "Name" });

    await user.clear(nameField);
    await user.type(nameField, "New name");
    // Remove condition
    await act(async () => {
      await user.click(await screen.findByTestId(/condition-remove-1/i));
    });
    // Edit condition
    await user.click(await screen.findByTestId(/condition-name-0/i));
    await user.click((await screen.findAllByTestId("select-option"))[0]);
    await user.click(await screen.findByTestId(/condition-type-0/i));
    await user.click((await screen.findAllByTestId("select-option"))[2]);
    await user.clear(await screen.findByTestId(/condition-value-0/i));
    await user.type(await screen.findByTestId(/condition-value-0/i), "144");
    // Add new condition
    await act(async () => {
      await user.click(screen.getByRole("button", { name: /add condition/i }));
    });
    await user.click(await screen.findByTestId(/condition-name-1/i));
    await user.click((await screen.findAllByTestId("select-option"))[0]);
    await user.click(await screen.findByTestId(/condition-type-1/i));
    await user.click((await screen.findAllByTestId("select-option"))[1]);
    await user.clear(await screen.findByTestId(/condition-value-1/i));
    await user.type(await screen.findByTestId(/condition-value-1/i), "100");
    // Edit reward gifts
    await user.click(screen.getByTestId("reward-type-select"));
    await user.click((await screen.findAllByTestId("select-option"))[1]);
    await user.click(screen.getByTestId("reward-gifts-select"));
    await user.click((await screen.findAllByTestId("select-option"))[0]);
    await user.click((await screen.findAllByTestId("select-option"))[2]);
    await user.click((await screen.findAllByTestId("select-option"))[3]);
    await user.click(screen.getByRole("button", { name: /save/i }));
    // Assert
    expect(onRuleEdit).toHaveBeenCalledWith(
      {
        id: "order-1",
        name: "New name",
        channel: {
          label: "Test",
          value: "Q2hhbm5lcDoy",
        },
        conditions: [
          {
            id: "baseTotalPrice",
            type: "greater",
            value: "144",
          },
          {
            id: "baseSubtotalPrice",
            type: "lower",
            value: "100",
          },
        ],
        description: "",
        rewardType: "GIFT",
        rewardGifts: [
          {
            label: "Code Division T-shirt - L",
            value: "UHJvZHVjdFZhcmlhbnQ6MjUz",
          },
          {
            label: "Blue Hoodie - S",
            value: "UHJvZHVjdFZhcmlhbnQ6MzAx",
          },
          {
            label: "Black Hoodie - XL",
            value: "UHJvZHVjdFZhcmlhbnQ6Mjk5",
          },
        ],
        rewardValue: null,
        rewardValueType: "FIXED",
      },
      0,
    );
  });
  it("should allow to to handle delete rule", async () => {
    // Arrange
    const onRuleDelete = vi.fn();

    render(
      <DiscountRules
        promotionId={null}
        discountType={PromotionTypeEnum.CATALOGUE}
        channels={[]}
        rules={catalogRules}
        errors={[]}
        onRuleSubmit={vi.fn()}
        onRuleDelete={onRuleDelete}
        disabled={false}
        deleteButtonState="default"
        getRuleConfirmButtonState={vi.fn(() => "default")}
      />,
      { wrapper: Wrapper },
    );
    // Act
    await act(async () => {
      await user.click(screen.getAllByTestId("rule-delete-button")[0]);
    });
    await screen.findByText(/delete rule/i);
    await act(async () => {
      await user.click(screen.getByRole("button", { name: /delete/i }));
    });
    // Assert
    expect(onRuleDelete).toHaveBeenCalledWith(0);
    expect(screen.queryByText(/delete rule/i)).not.toBeInTheDocument();
  });
  it("should display warning info when  rule is too complex", async () => {
    // Arrange
    render(
      <DiscountRules
        promotionId="1"
        discountType={PromotionTypeEnum.CATALOGUE}
        channels={[]}
        rules={catalogComplexRules}
        errors={[]}
        onRuleSubmit={vi.fn()}
        onRuleDelete={vi.fn()}
        disabled={false}
        deleteButtonState="default"
        getRuleConfirmButtonState={vi.fn(() => "default")}
      />,
      { wrapper: Wrapper },
    );
    await waitFor(() => {
      expect(screen.getAllByTestId("rule-edit-button")[0]).toBeInTheDocument();
    });
    // Act
    await act(async () => {
      await user.click(screen.getAllByTestId("rule-edit-button")[2]);
    });
    await screen.findAllByText(/edit rule/i);
    // Assert
    expect(
      screen.getByText(/too complex conditions to display, use playground to see details/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("openPlaygroundButton")).toBeInTheDocument();
  });
  it("should show error in rule", async () => {
    // Arrange & Act
    render(
      <DiscountRules
        promotionId={null}
        discountType={PromotionTypeEnum.CATALOGUE}
        channels={[]}
        rules={catalogRules}
        errors={[
          {
            field: "rewardValue",
            message: "Reward value is required",
            code: "GRAPHQL_ERROR",
            index: 0,
          } as any,
        ]}
        onRuleSubmit={vi.fn()}
        onRuleDelete={vi.fn()}
        disabled={false}
        deleteButtonState="default"
        getRuleConfirmButtonState={vi.fn(() => "default")}
      />,
      { wrapper: Wrapper },
    );
    // Assert
    expect(screen.getByText(/rule has error, open rule to see details/i)).toBeInTheDocument();
  });
});
