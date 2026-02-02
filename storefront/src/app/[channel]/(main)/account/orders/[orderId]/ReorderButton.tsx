"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useBranding, useOrdersText, useCartDisplayMode } from "@/providers/StoreConfigProvider";
import { useCartDrawerSafe } from "@/providers/CartDrawerProvider";

interface OrderLine {
	variantId: string;
	quantity: number;
	productName: string;
}

interface ReorderButtonProps {
	channel: string;
	orderLines: OrderLine[];
	reorderAction: (formData: FormData) => Promise<{ success: boolean; error?: string; itemsAdded?: number }>;
}

export function ReorderButton({ channel, orderLines, reorderAction }: ReorderButtonProps) {
	const branding = useBranding();
	const ordersText = useOrdersText();
	const displayMode = useCartDisplayMode();
	const drawerContext = useCartDrawerSafe();
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [result, setResult] = useState<{ success: boolean; error?: string; itemsAdded?: number } | null>(null);

	const handleReorder = () => {
		const formData = new FormData();
		formData.append("lines", JSON.stringify(orderLines));
		formData.append("channel", channel);

		startTransition(async () => {
			const res = await reorderAction(formData);
			setResult(res);

			if (res.success) {
				setTimeout(() => {
					if (displayMode === "drawer" && drawerContext) {
						drawerContext.openDrawer();
					} else {
						router.push(`/${channel}/cart`);
					}
				}, 1500);
			}
		});
	};

	if (result?.success) {
		return (
			<div className="flex w-full flex-col items-center justify-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-green-700">
				<div className="flex items-center gap-2">
					<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
					</svg>
					<span className="text-sm font-medium">
						{result.itemsAdded} item{result.itemsAdded !== 1 ? "s" : ""} added to cart!
					</span>
				</div>
				<span className="text-xs text-green-600">Redirecting to cart...</span>
			</div>
		);
	}

	if (result?.error) {
		return (
			<div className="space-y-2">
				<div className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-red-700">
					<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<span className="text-sm font-medium">{result.error}</span>
				</div>
				<button
					onClick={() => setResult(null)}
					className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
				>
					{ordersText.tryAgain}
				</button>
			</div>
		);
	}

	return (
		<button
			onClick={handleReorder}
			disabled={isPending || orderLines.length === 0}
			className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
			style={{ backgroundColor: branding.colors.primary }}
		>
			{isPending ? (
				<>
					<svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
						<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
					</svg>
					{ordersText.addingToCart}
				</>
			) : (
				<>
					<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
					</svg>
					{ordersText.reorderItems} ({orderLines.length})
				</>
			)}
		</button>
	);
}

