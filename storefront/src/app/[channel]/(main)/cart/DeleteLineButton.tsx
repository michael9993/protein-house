"use client";

import { useTransition } from "react";
import { useContentConfig } from "@/providers/StoreConfigProvider";
import { deleteLineFromCheckout } from "./actions";

type Props = {
	lineId: string;
	checkoutId: string;
};

export const DeleteLineButton = ({ lineId, checkoutId }: Props) => {
	const [isPending, startTransition] = useTransition();
	const content = useContentConfig();
	const removeLabel = content.cart?.removeButton ?? content.cart?.deleteButton ?? "Remove";
	const removingLabel = content.cart?.removingText ?? "Removing";

	return (
		<button
			type="button"
			className="text-sm text-neutral-500 hover:text-neutral-900"
			onClick={() => {
				if (isPending) return;
				startTransition(() => deleteLineFromCheckout({ lineId, checkoutId }));
			}}
			aria-disabled={isPending}
		>
			{isPending ? removingLabel : removeLabel}
			<span className="sr-only">line from cart</span>
		</button>
	);
};
