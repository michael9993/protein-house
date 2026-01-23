import { Metadata } from "next";
import { storeConfig } from "@/config";

export const metadata: Metadata = {
	title: `Shipping Policy | ${storeConfig.store.name}`,
	description: `Shipping policy and delivery information for ${storeConfig.store.name}`,
};

export default function ShippingPolicyPage() {
	return (
		<div className="mx-auto max-w-4xl p-8 pb-16">
			<h1 className="mb-8 text-3xl font-bold">Shipping Policy</h1>
			<div className="prose prose-lg max-w-none">
				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">Shipping Times</h2>
					<p className="text-gray-700 mb-4">
						Most orders ship within 24 hours. Standard delivery takes 3-5 business days, and express delivery takes 1-2 business days.
					</p>
				</section>

				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">International Shipping</h2>
					<p className="text-gray-700 mb-4">
						Yes! We ship worldwide. International delivery typically takes 7-14 business days depending on the destination.
					</p>
				</section>

				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">Shipping Methods</h2>
					<ul className="list-disc pl-6 text-gray-700 space-y-2">
						<li>Standard Shipping: 3-5 business days</li>
						<li>Express Shipping: 1-2 business days</li>
						<li>International Shipping: 7-14 business days</li>
					</ul>
				</section>

				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">Shipping Costs</h2>
					<p className="text-gray-700 mb-4">
						Shipping costs are calculated at checkout based on your location and selected shipping method.
					</p>
				</section>

				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">Order Tracking</h2>
					<p className="text-gray-700 mb-4">
						Once your order ships, you will receive a tracking number via email to track your package.
					</p>
				</section>

				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">Contact</h2>
					<p className="text-gray-700">
						If you have questions about shipping, please contact us at {storeConfig.store.email || "support@example.com"}.
					</p>
				</section>
			</div>
		</div>
	);
}
