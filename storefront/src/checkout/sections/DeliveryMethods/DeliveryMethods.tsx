import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { SelectBox } from "@/checkout/components/SelectBox";
import { SelectBoxGroup } from "@/checkout/components/SelectBoxGroup";
import { getFormattedMoney } from "@/checkout/lib/utils/money";
import { useDeliveryMethodsForm } from "@/checkout/sections/DeliveryMethods/useDeliveryMethodsForm";
import { FormProvider } from "@/checkout/hooks/useForm/FormProvider";
import { useCheckoutUpdateState } from "@/checkout/state/updateStateStore";
import { DeliveryMethodsSkeleton } from "@/checkout/sections/DeliveryMethods/DeliveryMethodsSkeleton";
import { useUser } from "@/checkout/hooks/useUser";
import { useCheckoutText, formatText } from "@/checkout/hooks/useCheckoutText";
import { getProductShippingEstimate } from "@/lib/shipping";

/** How long to show the loading state before declaring no methods available */
const SHIPPING_FETCH_TIMEOUT_MS = 20_000;
/** How often to refetch checkout while waiting for shipping methods */
const SHIPPING_POLL_INTERVAL_MS = 3_000;

export const DeliveryMethods: React.FC = () => {
	const { checkout, refetch } = useCheckout();
	const { authenticated } = useUser();
	// Filter out inactive (excluded) methods, then sort by lowest price first
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

	// Track address fingerprint to detect when a new address is set
	const addressFingerprint = shippingAddress
		? `${shippingAddress.postalCode}-${shippingAddress.country?.code}-${shippingAddress.city}`
		: null;

	// Loading state: when address is set but methods are empty, wait for webhook
	const [waitingForMethods, setWaitingForMethods] = useState(false);
	const waitingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const prevAddressRef = useRef<string | null>(null);

	const clearTimers = useCallback(() => {
		if (waitingTimerRef.current) {
			clearTimeout(waitingTimerRef.current);
			waitingTimerRef.current = null;
		}
		if (pollTimerRef.current) {
			clearInterval(pollTimerRef.current);
			pollTimerRef.current = null;
		}
	}, []);

	// When address changes and methods are empty, start waiting
	useEffect(() => {
		if (addressFingerprint && addressFingerprint !== prevAddressRef.current && shippingMethods.length === 0) {
			prevAddressRef.current = addressFingerprint;
			setWaitingForMethods(true);
			clearTimers();

			// Poll every 3s to catch when webhook results arrive
			pollTimerRef.current = setInterval(() => {
				refetch({ requestPolicy: "network-only" });
			}, SHIPPING_POLL_INTERVAL_MS);

			// Timeout: stop waiting and show error
			waitingTimerRef.current = setTimeout(() => {
				setWaitingForMethods(false);
				if (pollTimerRef.current) {
					clearInterval(pollTimerRef.current);
					pollTimerRef.current = null;
				}
			}, SHIPPING_FETCH_TIMEOUT_MS);
		} else if (addressFingerprint) {
			prevAddressRef.current = addressFingerprint;
		}

		return () => clearTimers();
	}, [addressFingerprint]); // eslint-disable-line react-hooks/exhaustive-deps

	// When methods arrive, stop waiting
	useEffect(() => {
		if (shippingMethods.length > 0) {
			setWaitingForMethods(false);
			clearTimers();
		}
	}, [shippingMethods.length, clearTimers]);

	// Determine if we should show the loading state
	const isLoadingMethods = shippingAddress
		&& shippingMethods.length === 0
		&& (waitingForMethods || updateState.checkoutShippingUpdate === "loading");

	const getSubtitle = ({ min, max }: { min?: number | null; max?: number | null }) => {
		if (!min || !max) {
			return undefined;
		}

		const template = text.businessDaysText || "{min}-{max} business days";
		return formatText(template, { min, max });
	};

	if (!checkout || !checkout.isShippingRequired) {
		return null;
	}

	// Group checkout lines by delivery speed for multi-supplier notice
	const deliveryGroups = useMemo(() => {
		const lines = checkout?.lines ?? [];
		if (lines.length < 2) return null;

		const groups: { label: string; items: string[]; maxDays: number }[] = [];
		const fast: string[] = [];
		const standard: string[] = [];
		const extended: string[] = [];

		for (const line of lines) {
			const productMeta = line?.variant?.product?.metadata;
			const est = getProductShippingEstimate(productMeta);
			const maxDays = est?.maxDays ?? 0;
			const name = line?.variant?.product?.name ?? "Item";

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
			<div data-testid="deliveryMethods">
				{!authenticated && !shippingAddress && (
					<p>{text.noDeliveryMethodsText || "Please fill in shipping address to see available shipping methods"}</p>
				)}
				{authenticated && !shippingAddress && updateState.checkoutShippingUpdate ? (
					<DeliveryMethodsSkeleton />
				) : isLoadingMethods ? (
					<div className="space-y-3">
						<div className="flex items-center gap-3 rounded-lg border p-4" style={{ borderColor: "var(--store-neutral-200)", backgroundColor: "var(--store-surface, var(--store-bg))" }}>
							<div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: "var(--store-primary)" }} />
							<span className="text-sm" style={{ color: "var(--store-text-muted)" }}>
								{text.fetchingShippingRates || "Calculating shipping rates..."}
							</span>
						</div>
						<DeliveryMethodsSkeleton />
					</div>
				) : (
					<>
						{shippingAddress && shippingMethods.length === 0 && (
							<div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
								{text.noShippingMethodsAvailable || "No shipping methods available for this address. Please try a different shipping address."}
							</div>
						)}
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
