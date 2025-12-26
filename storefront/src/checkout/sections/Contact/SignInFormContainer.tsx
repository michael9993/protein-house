import React, { type PropsWithChildren } from "react";
import { Button } from "@/checkout/components/Button";
import { Title } from "@/checkout/components/Title";

export interface SignInFormContainerProps {
	title: string;
	redirectSubtitle?: string;
	redirectButtonLabel?: string;
	subtitle?: string;
	onSectionChange: () => void;
	customHeaderAction?: React.ReactNode;
}

export const SignInFormContainer: React.FC<PropsWithChildren<SignInFormContainerProps>> = ({
	title,
	redirectButtonLabel,
	redirectSubtitle,
	subtitle,
	onSectionChange,
	customHeaderAction,
	children,
}) => {
	return (
		<div className="py-4">
			<div className="mb-2 flex flex-col">
				<div className="flex flex-row items-baseline justify-between @container">
					<Title>{title}</Title>
					<div className="flex flex-row items-center gap-2">
						{redirectSubtitle && (
							<p color="secondary" className="mr-2 hidden @sm:inline">
								{redirectSubtitle}
							</p>
						)}
						{customHeaderAction}
						{redirectButtonLabel && (
							<Button
								ariaLabel={redirectButtonLabel}
								onClick={onSectionChange}
								variant="tertiary"
								label={redirectButtonLabel}
							/>
						)}
					</div>
				</div>
				{subtitle && (
					<p color="secondary" className="mt-3">
						{subtitle}
					</p>
				)}
			</div>
			{children}
		</div>
	);
};
