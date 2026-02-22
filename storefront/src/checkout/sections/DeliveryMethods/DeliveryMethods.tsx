import React, { useMemo } from "react";
import { Title } from "@/checkout/components/Title";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { SelectBox } from "@/checkout/components/SelectBox";
import { SelectBoxGroup } from "@/checkout/components/SelectBoxGroup";
import { getFormattedMoney } from "@/checkout/lib/utils/money";
import { Divider } from "@/checkout/components/Divider";
import { type CommonSectionProps } from "@/checkout/lib/globalTypes";
import { useDeliveryMethodsForm } from "@/checkout/sections/DeliveryMethods/useDeliveryMethodsForm";
import { FormProvider } from "@/checkout/hooks/useForm/FormProvider";
import { useCheckoutUpdateState } from "@/checkout/state/updateStateStore";
import { DeliveryMethodsSkeleton } from "@/checkout/sections/DeliveryMethods/DeliveryMethodsSkeleton";
import { useUser } from "@/checkout/hooks/useUser";
import { useCheckoutText, formatText } from "@/checkout/hooks/useCheckoutText";
import { getProductShippingEstimate } from "@/lib/shipping";

export const DeliveryMethods: React.FC<CommonSectionProps> = ({ collapsed }) => {
	const { checkout } = useCheckout();
	const { authenticated } = useUser();
	// Filter out inactive (excluded) methods, then sort by lowest price first
	// Memoized to prevent unnecessary re-renders
	const shippingMethods = useMemo(
		() => [...(checkout?.shippingMethods ?? [])]
			.filter((m) => m.active !== false)
			.sort((a, b) => (a.price?.amount ?? 0) - (b.price?.amount ?? 0)),
		[checkout?.shippingMethods],
	);
	const shippingAddress = checkout?.shippingAddress;
	const form = useDeliveryMethodsForm();
	const { updateState } = useCheckoutUpdateState();
	const text = useCheckoutText();

	const getSubtitle = ({ min, max }: { min?: number | null; max?: number | null }) => {
		if (!min || !max) {
			return undefined;
		}

		const template = text.businessDaysText || "{min}-{max} business days";
		return formatText(template, { min, max });
	};

	if (!checkout || !checkout.isShippingRequired || collapsed) {
		return null;
	}

	// Group checkout lines by delivery speed for multi-supplier notice
	const deliveryGroups = useMemo(() => {
		const lines = (checkout as any)?.lines ?? [];
		if (lines.length < 2) return null;

		const groups: { label: string; items: string[]; maxDays: number }[] = [];
		const fast: string[] = [];
		const standard: string[] = [];
		const extended: string[] = [];

		for (const line of lines) {
			const productMeta = (line as any)?.variant?.product?.metadata;
			const est = getProductShippingEstimate(productMeta);
			const maxDays = est?.maxDays ?? 0;
			const name = (line as any)?.variant?.product?.name ?? "Item";

			if (maxDays > 0 && maxDays <= 5) fast.push(name);
			else if (maxDays > 5 && maxDays <= 14) standard.push(name);
			else if (maxDays > 14) extended.push(name);
		}

		if (fast.length > 0) groups.push({ label: "1-5 days", items: fast, maxDays: 5 });
		if (standard.length > 0) groups.push({ label: "6-14 days", items: standard, maxDays: 14 });
		if (extended.length > 0) groups.push({ label: "15+ days", items: extended, maxDays: 30 });

		// Only show if there are multiple speed groups
		return groups.length > 1 ? groups : null;
	}, [checkout]);

	return (
		<FormProvider form={form}>
			<Divider />
			<div className="py-4" data-testid="deliveryMethods">
				<Title className="mb-2">{text.deliveryMethodsTitle || "Delivery methods"}</Title>
				{!authenticated && !shippingAddress && (
					<p>{text.noDeliveryMethodsText || "Please fill in shipping address to see available shipping methods"}</p>
				)}
				{authenticated && !shippingAddress && updateState.checkoutShippingUpdate ? (
					<DeliveryMethodsSkeleton />
				) : (
					<>
						<SelectBoxGroup label={text.deliveryMethodsTitle || "delivery methods"}>
							{shippingMethods.map(
								({ id, name, price, minimumDeliveryDays: min, maximumDeliveryDays: max }) => (
									<SelectBox key={id} name="selectedMethodId" value={id}>
										<div className="min-h-12 pointer-events-none flex grow flex-col justify-center">
											<div className="flex flex-row items-center justify-between self-stretch">
												<p>{name}</p>
												<p>{getFormattedMoney(price)}</p>
											</div>
											<p className="font-xs" color="secondary">
												{getSubtitle({ min, max })}
											</p>
										</div>
									</SelectBox>
								),
							)}
						</SelectBoxGroup>
						{/* Multi-supplier delivery notice */}
						{deliveryGroups && (
							<div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
								<p className="text-sm font-medium text-amber-800 mb-1">
									Your order may arrive in multiple shipments
								</p>
								{deliveryGroups.map((group) => (
									<p key={group.label} className="text-xs text-amber-700">
										{group.items.join(", ")}: Ships in {group.label}
									</p>
								))}
							</div>
						)}
					</>
				)}
			</div>
		</FormProvider>
	);
};
