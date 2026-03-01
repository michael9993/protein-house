"use client";

import { useCheckoutState } from "../CheckoutStateProvider";
import { useCheckoutText } from "../hooks/useCheckoutText";
import type { StepIndex } from "../types";

export function CheckoutProgressBar() {
	const { state, openStep } = useCheckoutState();
	const t = useCheckoutText();

	const steps: { index: StepIndex; label: string }[] = [
		{ index: 0, label: t.contactInfoTitle ?? "Contact" },
		{ index: 1, label: t.shippingAddressTitle ?? "Shipping" },
		{ index: 2, label: t.deliveryMethodsTitle ?? "Delivery" },
		{ index: 3, label: t.paymentTitle ?? "Payment" },
	];

	return (
		<nav aria-label="Checkout progress" className="mt-4 print:hidden">
			<ol className="flex items-center justify-center gap-1 text-xs sm:gap-3 sm:text-sm">
				{steps.map(({ index, label }, i) => {
					const isCompleted = state.completedSteps.has(index);
					const isActive = state.activeStep === index;
					const isClickable = isCompleted && !isActive;

					return (
						<li key={index} className="flex items-center">
							<button
								type="button"
								aria-current={isActive ? "step" : undefined}
								aria-label={`Step ${index + 1}: ${label}${isCompleted ? " (completed)" : ""}`}
								disabled={!isClickable}
								onClick={isClickable ? () => openStep(index) : undefined}
								className={[
									"flex items-center gap-1.5 rounded px-1 py-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--store-primary,theme(colors.neutral.900))] focus-visible:ring-offset-1",
									isActive
										? "font-semibold text-neutral-900"
										: isCompleted
											? "cursor-pointer font-medium text-[var(--store-primary,theme(colors.neutral.900))] hover:underline"
											: "cursor-default text-neutral-400",
								].join(" ")}
							>
								{/* Step circle */}
								<span
									className={[
										"flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
										isCompleted
											? "bg-[var(--store-primary,theme(colors.neutral.900))] text-white"
											: isActive
												? "bg-neutral-900 text-white"
												: "bg-neutral-100 text-neutral-400",
									].join(" ")}
									aria-hidden="true"
								>
									{isCompleted ? (
										<svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
											<path
												fillRule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												clipRule="evenodd"
											/>
										</svg>
									) : (
										index + 1
									)}
								</span>

								{/* Label — hidden on mobile */}
								<span className="hidden sm:inline">{label}</span>
							</button>

							{/* Separator */}
							{i < steps.length - 1 && (
								<svg
									className="ms-1 h-4 w-4 shrink-0 text-neutral-300 rtl:rotate-180 sm:ms-3"
									fill="currentColor"
									viewBox="0 0 20 20"
									aria-hidden="true"
								>
									<path
										fillRule="evenodd"
										d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
										clipRule="evenodd"
									/>
								</svg>
							)}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}
