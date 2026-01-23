import { Metadata } from "next";
import { storeConfig } from "@/config";

export const metadata: Metadata = {
	title: `Return Policy | ${storeConfig.store.name}`,
	description: `Return and refund policy for ${storeConfig.store.name}`,
};

export default function ReturnPolicyPage() {
	return (
		<div className="mx-auto max-w-4xl p-8 pb-16">
			<h1 className="mb-8 text-3xl font-bold">Return Policy</h1>
			<div className="prose prose-lg max-w-none">
				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">30-Day Return Policy</h2>
					<p className="text-gray-700 mb-4">
						We offer a 30-day return policy on all unused items in original packaging. Returns are free within the continental US.
					</p>
				</section>

				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">Return Conditions</h2>
					<ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
						<li>Items must be unused and in original packaging</li>
						<li>Items must be returned within 30 days of purchase</li>
						<li>Original receipt or proof of purchase required</li>
						<li>Some items may be excluded (see below)</li>
					</ul>
				</section>

				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">How to Return</h2>
					<ol className="list-decimal pl-6 text-gray-700 space-y-2 mb-4">
						<li>Contact our customer service to initiate a return</li>
						<li>Receive a return authorization number</li>
						<li>Package the item securely in original packaging</li>
						<li>Ship the item back using the provided return label</li>
						<li>Once received, we will process your refund within 5-7 business days</li>
					</ol>
				</section>

				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">Refund Processing</h2>
					<p className="text-gray-700 mb-4">
						Refunds will be processed to the original payment method within 5-7 business days after we receive and inspect the returned item.
					</p>
				</section>

				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">Excluded Items</h2>
					<p className="text-gray-700 mb-4">
						The following items are not eligible for return: personalized items, intimate apparel, and items marked as final sale.
					</p>
				</section>

				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">Contact</h2>
					<p className="text-gray-700">
						For return requests or questions, please contact us at {storeConfig.store.email || "support@example.com"}.
					</p>
				</section>
			</div>
		</div>
	);
}
