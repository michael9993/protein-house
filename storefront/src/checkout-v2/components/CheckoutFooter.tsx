"use client";

import Link from "next/link";
import { useStoreInfo } from "@/providers/StoreConfigProvider";
import { useCheckoutText } from "../hooks/useCheckoutText";

interface CheckoutFooterProps {
	channel: string;
}

export function CheckoutFooter({ channel }: CheckoutFooterProps) {
	const store = useStoreInfo();
	const t = useCheckoutText();

	return (
		<footer className="mt-auto border-t border-neutral-200 pt-6 text-center text-xs text-neutral-500 print:hidden">
			<div className="flex flex-wrap items-center justify-center gap-4">
				<span>© {new Date().getFullYear()} {store.name}</span>
				<span aria-hidden="true">·</span>
				<Link
					href={`/${channel}/pages/privacy-policy`}
					className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
				>
					{t.privacyPolicy ?? "Privacy Policy"}
				</Link>
				<span aria-hidden="true">·</span>
				<Link
					href={`/${channel}/pages/terms-of-service`}
					className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
				>
					{t.termsOfService ?? "Terms of Service"}
				</Link>
			</div>
			<p className="mt-2 flex items-center justify-center gap-1">
				<svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
				</svg>
				{t.sslEncryptionText ?? "Protected by SSL encryption"}
			</p>
		</footer>
	);
}
