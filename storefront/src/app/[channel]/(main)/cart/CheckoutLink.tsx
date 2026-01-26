"use client";

import { useParams } from "next/navigation";
import { useContentConfig } from "@/providers/StoreConfigProvider";

type Props = {
	disabled?: boolean;
	checkoutId?: string;
	className?: string;
};

export const CheckoutLink = ({ disabled, checkoutId, className = "" }: Props) => {
	const params = useParams<{ channel: string }>();
	const channel = params?.channel || "default-channel";
	const content = useContentConfig();
	
	return (
		<a
			data-testid="CheckoutLink"
			aria-disabled={disabled}
			onClick={(e) => disabled && e.preventDefault()}
			href={`/${channel}/checkout?checkout=${checkoutId}`}
			className={`inline-block max-w-full rounded border border-transparent bg-neutral-900 px-6 py-3 text-center font-medium text-neutral-50 hover:bg-neutral-800 aria-disabled:cursor-not-allowed aria-disabled:bg-neutral-500 sm:px-16 ${className}`}
		>
			{content.cart?.checkoutButton || "Checkout"}
		</a>
	);
};
