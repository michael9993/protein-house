"use client";

import Link from "next/link";
import Image from "next/image";
import { useBranding, useStoreInfo } from "@/providers/StoreConfigProvider";
import { useCheckoutText } from "../hooks/useCheckoutText";

interface CheckoutHeaderProps {
	channel: string;
}

export function CheckoutHeader({ channel }: CheckoutHeaderProps) {
	const branding = useBranding();
	const store = useStoreInfo();
	const t = useCheckoutText();

	return (
		<header className="flex items-center justify-between border-b border-neutral-200 pb-4 print:border-none">
			<Link
				aria-label={`${store.name} – homepage`}
				href={`/${channel}`}
				className="flex items-center gap-2 text-xl font-bold transition-opacity hover:opacity-80"
				style={{ color: branding.colors.primary }}
			>
				{branding.logo && branding.logo !== "/logo.svg" ? (
					<Image
						src={branding.logo}
						alt={branding.logoAlt || store.name}
						width={120}
						height={32}
						className="h-8 w-auto"
					/>
				) : (
					<>
						<svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
						</svg>
						<span>{store.name}</span>
					</>
				)}
			</Link>

			{/* Secure badge */}
			<div className="flex items-center gap-2 text-sm text-neutral-500 print:hidden" aria-label={t.secureCheckout}>
				<svg
					className="h-4 w-4 text-neutral-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					aria-hidden="true"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
					/>
				</svg>
				<span className="hidden sm:inline">{t.secureCheckout}</span>
			</div>
		</header>
	);
}
