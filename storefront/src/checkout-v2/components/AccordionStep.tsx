"use client";

import { useEffect, useRef, type ReactNode, type KeyboardEvent } from "react";
import type { StepIndex } from "../types";

interface AccordionStepProps {
	/** Step index (0-3) */
	step: StepIndex;
	/** Step title shown in the header */
	title: string;
	/** Whether this step is currently open / active */
	isActive: boolean;
	/** Whether this step has been completed */
	isCompleted: boolean;
	/** Whether this step is locked (prior steps not yet complete) */
	isLocked: boolean;
	/** Short summary shown when step is collapsed + completed */
	summary?: ReactNode;
	/** Step content shown when expanded */
	children: ReactNode;
	/** Called when user clicks the header to (re-)open this step */
	onEdit?: () => void;
	/** Label for the edit button (default: "Edit") */
	editLabel?: string;
}

/**
 * Generic accordion step with WCAG 2.1 AA accessibility:
 * - role="region" on the panel
 * - aria-expanded, aria-controls on the button
 * - aria-labelledby linking panel to button
 * - Enter/Space keyboard support
 * - Auto-focus first input when expanded
 */
export function AccordionStep({
	step,
	title,
	isActive,
	isCompleted,
	isLocked,
	summary,
	children,
	onEdit,
	editLabel = "Edit",
}: AccordionStepProps) {
	const headerId = `checkout-step-${step}-header`;
	const panelId = `checkout-step-${step}-panel`;
	const panelRef = useRef<HTMLDivElement>(null);

	// Auto-focus first focusable element when step opens
	useEffect(() => {
		if (isActive && panelRef.current) {
			const focusable = panelRef.current.querySelector<HTMLElement>(
				'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])',
			);
			if (focusable) {
				// Small delay to let layout settle
				const raf = requestAnimationFrame(() => focusable.focus());
				return () => cancelAnimationFrame(raf);
			}
		}
	}, [isActive]);

	function handleHeaderKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
		if ((e.key === "Enter" || e.key === " ") && !isLocked && !isActive) {
			e.preventDefault();
			onEdit?.();
		}
	}

	const canToggle = !isLocked && isCompleted && !isActive;

	return (
		<div
			className={`rounded-xl border transition-shadow ${
				isActive
					? "border-neutral-300 shadow-md"
					: isCompleted
						? "border-neutral-200 shadow-sm"
						: "border-neutral-200 opacity-60"
			}`}
			style={{ contain: "layout" }}
		>
			{/* Step header */}
			<div className="flex items-center justify-between px-4 py-4 sm:px-6">
				<div className="flex items-center gap-3">
					{/* Step number / completion indicator */}
					<span
						className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
							isCompleted
								? "bg-[var(--store-primary,theme(colors.neutral.900))] text-white"
								: isActive
									? "bg-neutral-900 text-white"
									: "bg-neutral-100 text-neutral-400"
						}`}
						aria-hidden="true"
					>
						{isCompleted ? (
							<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
								<path
									fillRule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clipRule="evenodd"
								/>
							</svg>
						) : (
							step + 1
						)}
					</span>

					{/* Title and collapsed summary */}
					<div>
						<button
							id={headerId}
							type="button"
							aria-expanded={isActive}
							aria-controls={panelId}
							aria-disabled={isLocked}
							disabled={isLocked}
							onClick={canToggle ? onEdit : undefined}
							onKeyDown={handleHeaderKeyDown}
							className={`text-start font-medium leading-tight ${
								isLocked
									? "cursor-not-allowed text-neutral-400"
									: canToggle
										? "cursor-pointer text-neutral-900 hover:text-[var(--store-primary,theme(colors.neutral.900))]"
										: "text-neutral-900"
							}`}
						>
							{title}
						</button>

						{/* Collapsed summary (completed + not active) */}
						{isCompleted && !isActive && summary && (
							<div className="mt-0.5 text-sm text-neutral-500">{summary}</div>
						)}
					</div>
				</div>

				{/* Edit button for completed steps */}
				{isCompleted && !isActive && !isLocked && (
					<button
						type="button"
						onClick={onEdit}
						className="shrink-0 text-sm font-medium text-[var(--store-primary,theme(colors.neutral.900))] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--store-primary,theme(colors.neutral.900))] focus-visible:ring-offset-2"
						aria-label={`${editLabel} ${title}`}
					>
						{editLabel}
					</button>
				)}
			</div>

			{/* Step panel */}
			<div
				id={panelId}
				ref={panelRef}
				role="region"
				aria-labelledby={headerId}
				hidden={!isActive}
				className={isActive ? "border-t border-neutral-100 px-4 pb-6 pt-4 sm:px-6" : ""}
			>
				{isActive && children}
			</div>
		</div>
	);
}
