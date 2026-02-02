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
	const isGift = (line as { isGift?: boolean }).isGift;
	const attributesText = useSummaryLineLineAttributesText(line);

	return (
		<li key={line.id} className="flex gap-3 rounded-lg p-2 transition-colors" data-testid="SummaryItem">
			{/* Product Image */}
			<div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border bg-white" style={{ borderColor: "var(--store-neutral-200)" }}>
				{productImage ? (
					<img
						src={productImage.url}
						alt={productImage.alt ?? ""}
						className="h-full w-full object-contain object-center p-1"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center" style={{ backgroundColor: "var(--store-neutral-100)" }}>
						<PhotoIcon />
					</div>
				)}
			</div>
			
			{/* Product Info */}
			<div className="flex min-w-0 flex-1 flex-col justify-center">
				<p className="truncate text-sm font-medium" style={{ color: "var(--store-text)" }}>
					{productName}
					{isGift && (
						<span className="ml-1.5 inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-800">
							Gift
						</span>
					)}
				</p>
				{attributesText && (
					<p className="mt-0.5 truncate text-xs" style={{ color: "var(--store-text-muted)" }}>{attributesText}</p>
				)}
			</div>
			
			{/* Price Section */}
			<div className="flex flex-shrink-0 items-center">
				{children}
			</div>
		</li>
	);
};
