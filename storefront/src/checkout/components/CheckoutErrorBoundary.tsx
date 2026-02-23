import React from "react";

interface CheckoutErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

interface CheckoutErrorBoundaryState {
	hasError: boolean;
}

export class CheckoutErrorBoundary extends React.Component<
	CheckoutErrorBoundaryProps,
	CheckoutErrorBoundaryState
> {
	state: CheckoutErrorBoundaryState = { hasError: false };

	static getDerivedStateFromError(): CheckoutErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(error: Error, info: React.ErrorInfo) {
		console.error("[CheckoutErrorBoundary]", error, info);
	}

	private handleRetry = () => {
		this.setState({ hasError: false });
	};

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
					<p className="text-sm text-red-800">
						Something went wrong loading this section.
					</p>
					<button
						type="button"
						onClick={this.handleRetry}
						className="mt-2 text-sm font-medium text-red-700 underline hover:text-red-900"
					>
						Try again
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}
