"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { logout } from "@/app/actions";
import { confirmAccountDeletion } from "./actions";

type Status = "idle" | "loading" | "success" | "error" | "invalid";

export default function DeleteConfirmPage() {
	const params = useParams();
	const searchParams = useSearchParams();
	const router = useRouter();

	const channel = params.channel as string;
	const token = searchParams.get("token");

	const [status, setStatus] = useState<Status>(token ? "idle" : "invalid");
	const [errorMessage, setErrorMessage] = useState("");

	// Redirect to homepage after successful deletion
	useEffect(() => {
		if (status !== "success") return;

		const timer = setTimeout(() => {
			router.push(`/${channel}`);
		}, 3000);

		return () => clearTimeout(timer);
	}, [status, channel, router]);

	const handleDelete = useCallback(async () => {
		if (!token) return;

		setStatus("loading");
		setErrorMessage("");

		const result = await confirmAccountDeletion(token);

		if (result.success) {
			setStatus("success");
			// Sign out after successful deletion
			await logout().catch(() => {
				// Logout may fail since account is already deleted,
				// but we still want to clear local auth state
			});
		} else {
			setStatus("error");
			setErrorMessage(
				result.error ||
					"Invalid or expired token. Please request a new deletion link."
			);
		}
	}, [token]);

	return (
		<div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
			<div className="w-full max-w-md">
				{status === "invalid" && <InvalidLinkCard channel={channel} />}
				{status === "idle" && (
					<ConfirmCard channel={channel} onConfirm={handleDelete} />
				)}
				{status === "loading" && <LoadingCard />}
				{status === "success" && <SuccessCard />}
				{status === "error" && (
					<ErrorCard
						channel={channel}
						message={errorMessage}
					/>
				)}
			</div>
		</div>
	);
}

// --- Sub-components ---

function WarningIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth={1.5}
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
			/>
		</svg>
	);
}

function CheckIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth={2}
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
			/>
		</svg>
	);
}

function LinkIcon({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			strokeWidth={1.5}
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.54a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.757 8.25"
			/>
		</svg>
	);
}

function CardShell({ children }: { children: React.ReactNode }) {
	return (
		<div className="rounded-lg border border-neutral-200 bg-white p-8 text-center shadow-sm">
			{children}
		</div>
	);
}

function ConfirmCard({
	channel,
	onConfirm,
}: {
	channel: string;
	onConfirm: () => void;
}) {
	return (
		<CardShell>
			<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
				<WarningIcon className="h-7 w-7 text-red-600" />
			</div>
			<h1 className="mb-2 text-xl font-semibold text-neutral-900">
				Confirm Account Deletion
			</h1>
			<p className="mb-6 text-sm text-neutral-600">
				Click the button below to permanently delete your account. This
				action cannot be undone.
			</p>
			<div className="flex flex-col gap-3">
				<button
					type="button"
					onClick={onConfirm}
					className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
				>
					Delete My Account
				</button>
				<Link
					href={`/${channel}/account/settings`}
					className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
				>
					Cancel
				</Link>
			</div>
		</CardShell>
	);
}

function LoadingCard() {
	return (
		<CardShell>
			<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center">
				<svg
					className="h-8 w-8 animate-spin text-red-600"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle
						className="opacity-25"
						cx="12"
						cy="12"
						r="10"
						stroke="currentColor"
						strokeWidth="4"
					/>
					<path
						className="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
					/>
				</svg>
			</div>
			<h1 className="mb-2 text-xl font-semibold text-neutral-900">
				Deleting Account...
			</h1>
			<p className="text-sm text-neutral-600">
				Please wait while we process your request.
			</p>
		</CardShell>
	);
}

function SuccessCard() {
	return (
		<CardShell>
			<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-100">
				<CheckIcon className="h-7 w-7 text-success-600" />
			</div>
			<h1 className="mb-2 text-xl font-semibold text-neutral-900">
				Account Deleted
			</h1>
			<p className="text-sm text-neutral-600">
				Your account has been permanently deleted. You will be redirected
				to the homepage shortly.
			</p>
		</CardShell>
	);
}

function ErrorCard({
	channel,
	message,
}: {
	channel: string;
	message: string;
}) {
	return (
		<CardShell>
			<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
				<WarningIcon className="h-7 w-7 text-red-600" />
			</div>
			<h1 className="mb-2 text-xl font-semibold text-neutral-900">
				Deletion Failed
			</h1>
			<p className="mb-6 text-sm text-neutral-600">{message}</p>
			<Link
				href={`/${channel}/account/settings`}
				className="inline-block w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
			>
				Back to Settings
			</Link>
		</CardShell>
	);
}

function InvalidLinkCard({ channel }: { channel: string }) {
	return (
		<CardShell>
			<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
				<LinkIcon className="h-7 w-7 text-neutral-500" />
			</div>
			<h1 className="mb-2 text-xl font-semibold text-neutral-900">
				Invalid Link
			</h1>
			<p className="mb-6 text-sm text-neutral-600">
				This deletion link is missing a valid token. Please request a new
				deletion link from your account settings.
			</p>
			<Link
				href={`/${channel}/account/settings`}
				className="inline-block w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-center text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
			>
				Back to Settings
			</Link>
		</CardShell>
	);
}
