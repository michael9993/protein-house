import { ProductElement } from "./ProductElement";
import { type ProductListItemFragment } from "@/gql/graphql";

export const ProductList = ({ products }: { products: readonly ProductListItemFragment[] }) => {
	return (
		<ul
			role="list"
			data-testid="ProductList"
			data-cd="plp-productGrid"
			className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3"
			style={{ backgroundColor: 'var(--cd-plp-productGrid-bg, transparent)' }}
		>
			{products.map((product, index) => (
				<ProductElement
					key={product.id}
					product={product}
					priority={index < 2}
					loading={index < 3 ? "eager" : "lazy"}
				/>
			))}
		</ul>
	);
};
