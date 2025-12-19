import { type ReactNode } from "react";
import { useSummaryLineLineAttributesText, getSummaryLineProps } from "./utils";
import { type CheckoutLineFragment, type OrderLineFragment } from "@/checkout/graphql";
import { PhotoIcon } from "@/checkout/ui-kit/icons";

export type SummaryLine = CheckoutLineFragment | OrderLineFragment;

interface SummaryItemProps {
	line: SummaryLine;
	children: ReactNode;
}

export const SummaryItem = ({ line, children }: SummaryItemProps) => {
	const { productName, productImage } = getSummaryLineProps(line);

	const attributesText = useSummaryLineLineAttributesText(line);

	return (
		<li key={line.id} className="flex gap-3 rounded-lg p-2 transition-colors hover:bg-neutral-50" data-testid="SummaryItem">
			{/* Product Image */}
			<div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-neutral-200 bg-white">
				{productImage ? (
					<img
						src={productImage.url}
						alt={productImage.alt ?? ""}
						className="h-full w-full object-contain object-center p-1"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-neutral-100">
						<PhotoIcon />
					</div>
				)}
				{/* Quantity Badge */}
				<span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-700 text-xs font-medium text-white">
					{line.quantity}
				</span>
			</div>
			
			{/* Product Info */}
			<div className="flex min-w-0 flex-1 flex-col justify-center">
				<p className="truncate text-sm font-medium text-neutral-900">{productName}</p>
				{attributesText && (
					<p className="mt-0.5 truncate text-xs text-neutral-500">{attributesText}</p>
				)}
			</div>
			
			{/* Price Section */}
			<div className="flex flex-shrink-0 items-center">
				{children}
			</div>
		</li>
	);
};
