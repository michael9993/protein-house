import { type FallbackProps } from "react-error-boundary";
import { Button } from "@/checkout/components/Button";
import { ErrorContentWrapper } from "@/checkout/components/ErrorContentWrapper";

interface PageNotFoundProps extends Partial<FallbackProps> {
	reason?: "missing" | "invalid" | "error";
}

export const PageNotFound = ({ error, reason = "error" }: PageNotFoundProps) => {
	if (error) {
		console.error(error);
	}

	const goToCart = () => {
		// Navigate to default channel cart - we'll try to detect the channel from the URL
		const pathParts = window.location.pathname.split("/");
		const channel = pathParts[1] || "default-channel";
		window.location.href = `/${channel}/cart`;
	};

	const goToStore = () => {
		const pathParts = window.location.pathname.split("/");
		const channel = pathParts[1] || "default-channel";
		window.location.href = `/${channel}`;
	};

	const getMessage = () => {
		switch (reason) {
			case "missing":
				return {
					title: "No checkout found",
					description: "It looks like you haven't started a checkout yet. Add some items to your cart first.",
				};
			case "invalid":
				return {
					title: "Checkout expired or invalid",
					description: "This checkout session has expired or is no longer valid. Please return to your cart and try again.",
				};
			default:
				return {
					title: "Something went wrong",
					description: "We couldn't load your checkout. Please return to your cart and try again.",
				};
		}
	};

	const { title, description } = getMessage();

	return (
		<ErrorContentWrapper>
			<div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100">
				<svg
					className="h-10 w-10 text-neutral-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={1.5}
						d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
					/>
				</svg>
			</div>
			<h2 className="mb-2 text-xl font-semibold text-neutral-900">{title}</h2>
			<p className="mb-6 text-center text-neutral-600">{description}</p>
			<div className="flex flex-col gap-3 sm:flex-row">
				<Button 
					ariaLabel="Return to cart" 
					onClick={goToCart} 
					variant="primary" 
					label="Return to Cart" 
				/>
				<Button 
					ariaLabel="Continue shopping" 
					onClick={goToStore} 
					variant="secondary" 
					label="Continue Shopping" 
				/>
			</div>
		</ErrorContentWrapper>
	);
};
