import { type FC, type ReactNode, type ButtonHTMLAttributes } from "react";
import clsx from "clsx";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
	label: ReactNode;
	variant?: "primary" | "secondary" | "tertiary";
	ariaLabel?: string;
	ariaDisabled?: boolean;
}

export const Button: FC<ButtonProps> = ({
	label,
	className,
	variant = "primary",
	disabled = false,
	children: _children,
	type = "button",
	ariaLabel,
	ariaDisabled,
	style,
	...rest
}) => {
	const classes = clsx(
		"inline-flex h-10 items-center justify-center whitespace-nowrap rounded border active:outline-none transition-colors",
		{
			// Primary: uses CSS variables from StoreConfigProvider
			"text-white px-4 aria-disabled:cursor-not-allowed aria-disabled:opacity-70":
				variant === "primary",
			// Secondary: border style with theme-aware colors
			"bg-transparent disabled:bg-transparent aria-disabled:bg-transparent px-4 aria-disabled:cursor-not-allowed aria-disabled:opacity-70":
				variant === "secondary",
			// Tertiary: text-only button
			"h-auto border-none bg-transparent p-0 hover:opacity-80": variant === "tertiary",
		},
		className,
	);

	// Build dynamic styles for variants using CSS variables
	const dynamicStyle: React.CSSProperties = {
		...style,
		...(variant === "primary" && {
			backgroundColor: "var(--store-primary, #1F2937)",
		}),
		...(variant === "secondary" && {
			borderColor: "var(--store-neutral-300)",
			color: "var(--store-text)",
		}),
	};

	return (
		<button
			aria-label={ariaLabel}
			aria-disabled={ariaDisabled}
			disabled={disabled}
			className={classes}
			style={dynamicStyle}
			type={type === "submit" ? "submit" : "button"}
			{...rest}
		>
			{typeof label === "string" ? <span className="font-semibold">{label}</span> : label}
		</button>
	);
};
