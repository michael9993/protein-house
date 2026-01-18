import { type ReactNode, type AnchorHTMLAttributes } from "react";
import clsx from "clsx";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
	children: ReactNode;
	href: string;
	variant?: "primary" | "secondary" | "tertiary";
};

export const LinkAsButton = ({ children, href, variant = "primary" }: Props) => {
	const classes = clsx(
		"inline-flex h-10 items-center justify-center whitespace-nowrap rounded border active:outline-none font-bold transition-colors",
		{
			"text-white px-4 aria-disabled:cursor-not-allowed aria-disabled:opacity-70 hover:opacity-90":
				variant === "primary",
			"bg-transparent px-4 aria-disabled:cursor-not-allowed aria-disabled:opacity-70":
				variant === "secondary",
			"h-auto border-none bg-transparent p-0": variant === "tertiary",
		},
	);

	const dynamicStyle: React.CSSProperties = {
		...(variant === "primary" && {
			backgroundColor: "var(--store-primary)",
		}),
		...(variant === "secondary" && {
			borderColor: "var(--store-neutral-600)",
			color: "var(--store-text)",
		}),
	};

	return (
		<a href={href} className={classes} style={dynamicStyle}>
			{children}
		</a>
	);
};
