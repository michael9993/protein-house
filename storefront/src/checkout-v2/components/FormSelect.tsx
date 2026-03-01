"use client";

import { type SelectHTMLAttributes, useId } from "react";
import type { FieldError } from "react-hook-form";

interface FormSelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
	label: string;
	error?: FieldError | string;
	options: { value: string; label: string }[];
	placeholder?: string;
}

export function FormSelect({
	label,
	error,
	options,
	placeholder,
	className,
	...selectProps
}: FormSelectProps) {
	const id = useId();
	const errorId = `${id}-error`;
	const errorMessage = typeof error === "string" ? error : error?.message;

	return (
		<div className="space-y-1">
			<label htmlFor={id} className="block text-sm font-medium text-neutral-700">
				{label}
				{selectProps.required && (
					<span className="ms-0.5 text-red-500" aria-hidden="true">
						*
					</span>
				)}
			</label>

			<select
				{...selectProps}
				id={id}
				aria-describedby={errorMessage ? errorId : undefined}
				aria-invalid={!!errorMessage}
				className={[
					"block w-full rounded-lg border px-3 py-2.5 text-sm text-neutral-900 shadow-sm transition-colors",
					"focus:outline-none focus:ring-2 focus:ring-[var(--store-primary,theme(colors.neutral.900))] focus:ring-offset-1",
					"disabled:cursor-not-allowed disabled:opacity-50",
					errorMessage
						? "border-red-400 bg-red-50 focus:ring-red-500"
						: "border-neutral-300 bg-white hover:border-neutral-400",
					className ?? "",
				].join(" ")}
			>
				{placeholder && (
					<option value="" disabled>
						{placeholder}
					</option>
				)}
				{options.map(({ value, label: optLabel }) => (
					<option key={value} value={value}>
						{optLabel}
					</option>
				))}
			</select>

			{errorMessage && (
				<p id={errorId} className="flex items-center gap-1 text-xs text-red-600" role="alert">
					<svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
						<path d="M8 1a7 7 0 100 14A7 7 0 008 1zM7 5a1 1 0 112 0v3a1 1 0 11-2 0V5zm1 6a1 1 0 100-2 1 1 0 000 2z" />
					</svg>
					{errorMessage}
				</p>
			)}
		</div>
	);
}
