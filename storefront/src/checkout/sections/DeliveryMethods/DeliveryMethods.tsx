import React, { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useCheckout } from "@/checkout/hooks/useCheckout";
import { SelectBox } from "@/checkout/components/SelectBox";
import { SelectBoxGroup } from "@/checkout/components/SelectBoxGroup";
import { Button } from "@/checkout/components/Button";
import { getFormattedMoney } from "@/checkout/lib/utils/money";
import { useDeliveryMethodsForm } from "@/checkout/sections/DeliveryMethods/useDeliveryMethodsForm";
import { FormProvider } from "@/checkout/hooks/useForm/FormProvider";
import { DeliveryMethodsSkeleton } from "@/checkout/sections/DeliveryMethods/DeliveryMethodsSkeleton";
import { useCheckoutUpdateState } from "@/checkout/state/updateStateStore";
import { useCheckoutText, formatText } from "@/checkout/hooks/useCheckoutText";

/** Max retries when fetching shipping methods */
const MAX_FETCH_RETRIES = 4;
/** Delay between retries */
const RETRY_INTERVAL_MS = 3_000;

/**
 * State machine:
 *   idle → ready → fetching → loaded
 *                → error
 *   loaded/error → ready (when address changes on server)
 *
 * The "ready" state has two sub-states based on `isAddressSaving`:
 *   - saving=true:  button visible but disabled ("Saving address...")
 *   - saving=false: button clickable ("Calculate Shipping Rates")
 */
type FetchState = "idle" | "ready" | "fetching" | "loaded" | "error";

export const DeliveryMethods: React.FC = () => {
	const { checkout, refetch } = useCheckout();

	// Filter out inactive methods, sort cheapest first
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

	// True while the address mutation is in-flight (Zustand store, instant)
	const isAddressSaving = updateState.checkoutShippingUpdate === "loading";

	const [fetchState, setFetchState] = useState<FetchState>("idle");
	const abortRef = useRef(false);
	const fetchIdRef = useRef(0);

	// Full address fingerprint — tracks ALL shipping-relevant fields
	const addressFingerprint = shippingAddress
		? [
			shippingAddress.country?.code,
			shippingAddress.city,
			shippingAddress.postalCode,
			shippingAddress.streetAddress1,
			shippingAddress.streetAddress2,
			shippingAddress.countryArea,
			shippingAddress.cityArea,
		].join("|")
		: null;
	const lastFetchedFingerprintRef = useRef<string | null>(null);

	// Minimum address requirements for shipping rate calculation:
	// country + street address + city + postal code (all must be non-empty)
	const hasMinimumAddress = !!(
		shippingAddress?.country?.code &&
		shippingAddress.streetAddress1?.trim() &&
		shippingAddress.city?.trim() &&
		shippingAddress.postalCode?.trim()
	);

	// --- State transitions ---

	// On mount / when minimum address requirements are first met
	useEffect(() => {
		if (!shippingAddress || !hasMinimumAddress) {
			setFetchState("idle");
			return;
		}
		if (shippingMethods.length > 0) {
			setFetchState("loaded");
			lastFetchedFingerprintRef.current = addressFingerprint;
		} else if (fetchState === "idle") {
			setFetchState("ready");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [hasMinimumAddress]);

	// Instant visual reset when address mutation fires.
	// Shows the "ready" state immediately, but the button is disabled while saving.
	useEffect(() => {
		if (isAddressSaving && (fetchState === "loaded" || fetchState === "error")) {
			abortRef.current = true;
			setFetchState("ready");
		}
	}, [isAddressSaving, fetchState]);

	// After address save completes: update the fingerprint so we know
	// this is the "saved" state and the button can be clicked
	const prevSavingRef = useRef(false);
	useEffect(() => {
		if (prevSavingRef.current && !isAddressSaving && fetchState === "ready") {
			// Address just finished saving — update fingerprint to current
			lastFetchedFingerprintRef.current = null; // clear so next fetch records new one
		}
		prevSavingRef.current = isAddressSaving;
	}, [isAddressSaving, fetchState]);

	// Fallback: detect address changes via fingerprint (handles page reload, edge cases)
	useEffect(() => {
		if (!addressFingerprint || !hasMinimumAddress || fetchState === "idle" || fetchState === "fetching") return;

		if (
			lastFetchedFingerprintRef.current &&
			addressFingerprint !== lastFetchedFingerprintRef.current
		) {
			abortRef.current = true;
			lastFetchedFingerprintRef.current = null;
			setFetchState("ready");
		}
	}, [addressFingerprint, hasMinimumAddress, fetchState]);

	// When methods arrive reactively during fetching, transition to loaded
	useEffect(() => {
		if (shippingMethods.length > 0 && fetchState === "fetching") {
			setFetchState("loaded");
			lastFetchedFingerprintRef.current = addressFingerprint;
			abortRef.current = true;
		}
	}, [shippingMethods.length, fetchState, addressFingerprint]);

	// Fetch function — user-triggered only, retries until methods arrive
	const fetchShippingMethods = useCallback(async () => {
		// Guard: don't fetch while address is still saving
		if (isAddressSaving) return;

		const currentFetchId = ++fetchIdRef.current;
		abortRef.current = false;
		setFetchState("fetching");

		for (let attempt = 0; attempt < MAX_FETCH_RETRIES; attempt++) {
			if (abortRef.current || currentFetchId !== fetchIdRef.current) return;

			refetch({ requestPolicy: "network-only" });

			// Wait for webhook to process and methods to arrive
			await new Promise((r) => setTimeout(r, RETRY_INTERVAL_MS));
		}

		// All retries exhausted — if still fetching, show error
		if (currentFetchId === fetchIdRef.current && !abortRef.current) {
			setFetchState((prev) => (prev === "fetching" ? "error" : prev));
		}
	}, [refetch, isAddressSaving]);

	// Cleanup on unmount
	useEffect(() => () => { abortRef.current = true; }, []);

	const getSubtitle = ({ min, max }: { min?: number | null; max?: number | null }) => {
		if (!min || !max) return undefined;
		const template = text.businessDaysText || "{min}-{max} business days";
		return formatText(template, { min, max });
	};

	if (!checkout || !checkout.isShippingRequired) {
		return null;
	}

	// --- Render ---

	// No address yet or address incomplete
	if (!shippingAddress || !hasMinimumAddress || fetchState === "idle") {
		return (
			<div data-testid="deliveryMethods">
				<p className="text-sm" style={{ color: "var(--store-text-muted)" }}>
					{text.noDeliveryMethodsText || "Please fill in shipping address to see available shipping methods"}
				</p>
			</div>
		);
	}

	return (
		<FormProvider form={form}>
			<div data-testid="deliveryMethods" className="space-y-4">
				{/* Ready state — calculate button (disabled while address saves) */}
				{fetchState === "ready" && (
					<div
						className="rounded-lg border p-5 text-center"
						style={{
							borderColor: "var(--store-neutral-200)",
							backgroundColor: "var(--store-surface, var(--store-bg))",
						}}
					>
						<div className="mb-3">
							<p className="text-sm font-medium" style={{ color: "var(--store-text)" }}>
								{isAddressSaving
									? (text.updatingShippingRates || "Updating address...")
									: (text.shippingAddressDetected || "Shipping address detected")
								}
							</p>
							{!isAddressSaving && (
								<p className="mt-1 text-xs" style={{ color: "var(--store-text-muted)" }}>
									{text.calculateShippingHint || "Click below to see available shipping options and pricing for your address."}
								</p>
							)}
						</div>
						{isAddressSaving ? (
							<div className="flex items-center justify-center gap-2 py-2">
								<div
									className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
									style={{ color: "var(--store-primary)" }}
								/>
								<span className="text-sm" style={{ color: "var(--store-text-muted)" }}>
									{text.savingAddressText || "Saving address..."}
								</span>
							</div>
						) : (
							<Button
								label={
									<span className="flex items-center justify-center gap-2">
										<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
											<path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25V3.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v3.026M3.375 14.25h10.688c.404 0 .798.136 1.114.395l2.964 2.427a1.125 1.125 0 01.395.863v.115a1.125 1.125 0 01-1.125 1.125H3.375" />
										</svg>
										{text.calculateShippingButton || "Calculate Shipping Rates"}
									</span>
								}
								className="w-full"
								onClick={() => void fetchShippingMethods()}
							/>
						)}
					</div>
				)}

				{/* Fetching state — spinner + skeleton */}
				{fetchState === "fetching" && (
					<div className="space-y-3">
						<div
							className="flex items-center gap-3 rounded-lg border p-4"
							style={{
								borderColor: "var(--store-neutral-200)",
								backgroundColor: "var(--store-surface, var(--store-bg))",
							}}
						>
							<div
								className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
								style={{ color: "var(--store-primary)" }}
							/>
							<span className="text-sm" style={{ color: "var(--store-text-muted)" }}>
								{text.calculatingShippingText || text.fetchingShippingRates || "Calculating shipping rates..."}
							</span>
						</div>
						<DeliveryMethodsSkeleton />
					</div>
				)}

				{/* Error state — retry button + address hint */}
				{fetchState === "error" && (
					<div
						className="rounded-lg border p-5 text-center"
						style={{
							borderColor: "var(--store-neutral-200)",
							backgroundColor: "var(--store-surface, var(--store-bg))",
						}}
					>
						<div className="mb-1">
							<svg className="mx-auto h-8 w-8" style={{ color: "var(--store-text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
								<path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
							</svg>
						</div>
						<p className="text-sm font-medium" style={{ color: "var(--store-text)" }}>
							{text.shippingFetchErrorText || "Could not fetch shipping rates"}
						</p>
						<p className="mt-1 text-xs" style={{ color: "var(--store-text-muted)" }}>
							{text.shippingFetchErrorHint || "Please verify your shipping address is correct and try again."}
						</p>
						<Button
							label={text.tryAgainButton || "Try Again"}
							variant="secondary"
							className="mt-3"
							onClick={() => void fetchShippingMethods()}
						/>
					</div>
				)}

				{/* Loaded state — methods displayed */}
				{fetchState === "loaded" && (
					<>
						{shippingMethods.length === 0 ? (
							<div
								className="rounded-lg border p-4 text-center"
								style={{
									borderColor: "var(--store-warning, #f59e0b)",
									backgroundColor: "color-mix(in srgb, var(--store-warning, #f59e0b) 8%, transparent)",
								}}
							>
								<p className="text-sm font-medium" style={{ color: "var(--store-text)" }}>
									{text.noShippingMethodsAvailable || "No shipping methods available for this address"}
								</p>
								<p className="mt-1 text-xs" style={{ color: "var(--store-text-muted)" }}>
									{text.noShippingMethodsHint || "Please check that your address details are correct, or try a different address."}
								</p>
								<Button
									label={text.tryAgainButton || "Try Again"}
									variant="secondary"
									className="mt-3"
									onClick={() => void fetchShippingMethods()}
								/>
							</div>
						) : (
							<SelectBoxGroup label={text.deliveryMethodsTitle || "delivery methods"}>
								{shippingMethods.map(
									({ id, name, price, minimumDeliveryDays: min, maximumDeliveryDays: max }) => (
										<SelectBox key={id} name="selectedMethodId" value={id}>
											<div className="min-h-12 pointer-events-none flex grow flex-col justify-center">
												<div className="flex flex-row items-center justify-between self-stretch">
													<p>{name}</p>
													<p
														className={price.amount === 0 ? "font-medium" : ""}
														style={price.amount === 0 ? { color: "var(--store-success, #16a34a)" } : undefined}
													>
														{price.amount === 0 ? (text.freeShippingLabel || "Free") : getFormattedMoney(price)}
													</p>
												</div>
												<p className="font-xs" color="secondary">
													{getSubtitle({ min, max })}
												</p>
											</div>
										</SelectBox>
									),
								)}
							</SelectBoxGroup>
						)}
					</>
				)}
			</div>
		</FormProvider>
	);
};
