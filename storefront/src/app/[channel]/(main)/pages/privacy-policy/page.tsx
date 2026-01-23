import { Metadata } from "next";
import { storeConfig } from "@/config";

export const metadata: Metadata = {
	title: `Privacy Policy | ${storeConfig.store.name}`,
	description: `Privacy policy and data protection information for ${storeConfig.store.name}`,
};

export default function PrivacyPolicyPage() {
	return (
		<div className="mx-auto max-w-4xl p-8 pb-16">
			<h1 className="mb-8 text-3xl font-bold">Privacy Policy</h1>
			<div className="prose prose-lg max-w-none">
				<p className="text-gray-600 mb-8">
					Last updated: {new Date().toLocaleDateString()}
				</p>

				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">Information We Collect</h2>
					<p className="text-gray-700 mb-4">
						We collect information that you provide directly to us, including when you create an account, make a purchase, or contact us for support.
					</p>
					<ul className="list-disc pl-6 text-gray-700 space-y-2">
						<li>Name and contact information</li>
						<li>Payment information (processed securely through third-party providers)</li>
						<li>Shipping and billing addresses</li>
						<li>Purchase history and preferences</li>
					</ul>
				</section>

				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">How We Use Your Information</h2>
					<p className="text-gray-700 mb-4">
						We use the information we collect to:
					</p>
					<ul className="list-disc pl-6 text-gray-700 space-y-2">
						<li>Process and fulfill your orders</li>
						<li>Communicate with you about your orders and account</li>
						<li>Send you marketing communications (with your consent)</li>
						<li>Improve our website and services</li>
						<li>Prevent fraud and ensure security</li>
					</ul>
				</section>

				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">Information Sharing</h2>
					<p className="text-gray-700 mb-4">
						We do not sell your personal information. We may share your information with:
					</p>
					<ul className="list-disc pl-6 text-gray-700 space-y-2">
						<li>Service providers who assist us in operating our website</li>
						<li>Payment processors to process your transactions</li>
						<li>Shipping companies to deliver your orders</li>
						<li>Legal authorities when required by law</li>
					</ul>
				</section>

				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">Data Security</h2>
					<p className="text-gray-700 mb-4">
						We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
					</p>
				</section>

				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">Your Rights</h2>
					<p className="text-gray-700 mb-4">
						You have the right to:
					</p>
					<ul className="list-disc pl-6 text-gray-700 space-y-2">
						<li>Access your personal information</li>
						<li>Correct inaccurate information</li>
						<li>Request deletion of your information</li>
						<li>Opt-out of marketing communications</li>
					</ul>
				</section>

				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">Cookies</h2>
					<p className="text-gray-700 mb-4">
						We use cookies and similar technologies to enhance your experience, analyze usage, and assist with marketing efforts. You can control cookies through your browser settings.
					</p>
				</section>

				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">Contact Us</h2>
					<p className="text-gray-700">
						If you have questions about this Privacy Policy, please contact us at {storeConfig.store.email || "support@example.com"}.
					</p>
				</section>
			</div>
		</div>
	);
}
