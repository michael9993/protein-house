"use client";

import type { AddressSuggestion, AddressFormValues } from "../types";

interface AddressSuggestionDialogProps {
	originalAddress: AddressFormValues;
	suggestion: AddressSuggestion;
	onAccept: (address: AddressFormValues) => void;
	onKeepOriginal: () => void;
	onClose: () => void;
}

function AddressBlock({ address }: { address: AddressFormValues }) {
	return (
		<address className="not-italic text-sm text-neutral-700 space-y-0.5">
			<p>
				{address.firstName} {address.lastName}
			</p>
			<p>{address.streetAddress1}</p>
			{address.streetAddress2 && <p>{address.streetAddress2}</p>}
			<p>
				{[address.city, address.countryArea, address.postalCode].filter(Boolean).join(", ")}
			</p>
			<p>{address.countryCode}</p>
		</address>
	);
}

/**
 * "Did you mean...?" dialog shown when Google Address Validation returns
 * UNCONFIRMED_BUT_PLAUSIBLE. User can accept the suggestion, keep original,
 * or dismiss without a choice (treated as keep original).
 */
export function AddressSuggestionDialog({
	originalAddress,
	suggestion,
	onAccept,
	onKeepOriginal,
}: AddressSuggestionDialogProps) {
	const hasSuggestion = !!suggestion.suggestedAddress;

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="suggestion-dialog-title"
			className="fixed inset-0 z-50 flex items-center justify-center p-4"
		>
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/40 backdrop-blur-sm"
				onClick={onKeepOriginal}
				aria-hidden="true"
			/>

			{/* Dialog panel */}
			<div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
				<h2 id="suggestion-dialog-title" className="text-base font-semibold text-neutral-900">
					{suggestion.verdict === "UNCONFIRMED"
						? "We couldn't verify this address"
						: "Did you mean this address?"}
				</h2>

				<p className="mt-1 text-sm text-neutral-500">
					{suggestion.verdict === "UNCONFIRMED"
						? "We couldn't find this address in our database. You can still continue with it."
						: "We found a slightly different version of your address."}
				</p>

				{hasSuggestion && suggestion.suggestedAddress && (
					<div className="mt-4 grid grid-cols-2 gap-4">
						<div className="rounded-lg border border-neutral-200 p-3">
							<p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
								You entered
							</p>
							<AddressBlock address={originalAddress} />
						</div>
						<div className="rounded-lg border border-[var(--store-primary,theme(colors.neutral.900))] bg-neutral-50 p-3">
							<p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--store-primary,theme(colors.neutral.900))]">
								Suggested
							</p>
							<AddressBlock address={suggestion.suggestedAddress} />
						</div>
					</div>
				)}

				<div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
					<button
						type="button"
						onClick={onKeepOriginal}
						className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
					>
						Keep my address
					</button>

					{hasSuggestion && suggestion.suggestedAddress ? (
						<button
							type="button"
							onClick={() => onAccept(suggestion.suggestedAddress!)}
							className="rounded-lg bg-[var(--store-primary,theme(colors.neutral.900))] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
						>
							Use suggested address
						</button>
					) : (
						<button
							type="button"
							onClick={onKeepOriginal}
							className="rounded-lg bg-[var(--store-primary,theme(colors.neutral.900))] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
						>
							Continue anyway
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
