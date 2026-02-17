// @ts-strict-ignore
import DiscountedPrice from "@dashboard/components/DiscountedPrice/DiscountedPrice";
import Money from "@dashboard/components/Money";
import { SearchOrderVariantQuery } from "@dashboard/graphql";
import { Text } from "@saleor/macaw-ui-next";

interface OrderPriceLabelProps {
  pricing: SearchOrderVariantQuery["search"]["edges"][0]["node"]["variants"][0]["pricing"];
}

const OrderPriceLabel = ({ pricing }: OrderPriceLabelProps) => {
  if (pricing.onSale) {
    const { price, priceUndiscounted } = pricing;

    return (
      <div className="flex flex-col items-end justify-end">
        <DiscountedPrice discountedPrice={price.gross} regularPrice={priceUndiscounted.gross} />
      </div>
    );
  }

  return (
    <Text>
      <Money money={pricing.priceUndiscounted.gross} />
    </Text>
  );
};

export default OrderPriceLabel;
