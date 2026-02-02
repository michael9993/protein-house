import React, { type PropsWithChildren } from "react";
import { Money, type MoneyProps } from "@/checkout/components/Money";

export interface SummaryMoneyRowProps extends MoneyProps {
	label: string;
	subLabel?: string;
}

export const SummaryMoneyRow: React.FC<PropsWithChildren<SummaryMoneyRowProps>> = ({
	label,
	subLabel,
	children,
	...moneyProps
}) => {
	return (
		<div className="flex items-center justify-between text-sm">
			<div className="flex flex-col gap-0.5">
				<div className="flex items-center gap-1.5" style={{ color: "var(--store-text-muted)" }}>
					<span>{label}</span>
					{children}
				</div>
				{subLabel && (
					<span className="text-xs" style={{ color: "var(--store-text-muted)" }}>{subLabel}</span>
				)}
			</div>
			{moneyProps.money != null && <Money {...moneyProps} className="font-medium" />}
		</div>
	);
};
