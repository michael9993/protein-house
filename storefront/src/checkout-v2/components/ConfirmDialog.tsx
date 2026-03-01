"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
	open: boolean;
	title: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export function ConfirmDialog({
	open,
	title,
	message,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	const dialogRef = useRef<HTMLDialogElement>(null);

	useEffect(() => {
		const el = dialogRef.current;
		if (!el) return;
		if (open) {
			if (!el.open) el.showModal();
		} else {
			if (el.open) el.close();
		}
	}, [open]);

	// Close on backdrop click
	function handleClick(e: React.MouseEvent<HTMLDialogElement>) {
		const rect = dialogRef.current?.getBoundingClientRect();
		if (!rect) return;
		if (
			e.clientX < rect.left ||
			e.clientX > rect.right ||
			e.clientY < rect.top ||
			e.clientY > rect.bottom
		) {
			onCancel();
		}
	}

	return (
		<dialog
			ref={dialogRef}
			onClose={onCancel}
			onClick={handleClick}
			className="m-auto max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-xl backdrop:bg-black/40"
		>
			<h2 className="mb-2 text-base font-semibold text-neutral-900">{title}</h2>
			<p className="mb-6 text-sm text-neutral-600">{message}</p>
			<div className="flex justify-end gap-3">
				<button
					type="button"
					onClick={onCancel}
					className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
				>
					{cancelLabel}
				</button>
				<button
					type="button"
					onClick={onConfirm}
					className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
				>
					{confirmLabel}
				</button>
			</div>
		</dialog>
	);
}
