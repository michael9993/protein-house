import { type ReactNode } from "react";
import { CheckoutAuthProvider } from "./CheckoutAuthProvider";

export const metadata = {
	title: "Saleor Storefront example",
	description: "Starter pack for building performant e-commerce experiences with Saleor.",
};

export default function RootLayout(props: { children: ReactNode }) {
	return (
		<main>
			<CheckoutAuthProvider>{props.children}</CheckoutAuthProvider>
		</main>
	);
}
