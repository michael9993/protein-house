import { Metadata } from "next";
import { storeConfig } from "@/config";

export const metadata: Metadata = {
	title: `Terms of Service | ${storeConfig.store.name}`,
	description: `Terms of Service for ${storeConfig.store.name}`,
};

export default function TermsOfServicePage() {
	return (
		<div className="mx-auto max-w-4xl p-8 pb-16">
			<h1 className="mb-8 text-3xl font-bold">Terms of Service</h1>
			<div className="prose prose-lg max-w-none">
				<p className="text-gray-600">
					Please read these terms of service carefully before using our website.
				</p>
				
				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">1. Acceptance of Terms</h2>
					<p className="text-gray-700">
						By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.
					</p>
				</section>

				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">2. Use License</h2>
					<p className="text-gray-700">
						Permission is granted to temporarily download one copy of the materials on our website for personal, non-commercial transitory viewing only.
					</p>
				</section>

				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">3. Disclaimer</h2>
					<p className="text-gray-700">
						The materials on our website are provided on an &apos;as is&apos; basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties.
					</p>
				</section>

				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">4. Limitations</h2>
					<p className="text-gray-700">
						In no event shall our company or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website.
					</p>
				</section>

				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">5. Revisions</h2>
					<p className="text-gray-700">
						We may revise these terms of service at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
					</p>
				</section>

				<section className="mt-8">
					<h2 className="mb-4 text-2xl font-semibold">6. Contact Information</h2>
					<p className="text-gray-700">
						If you have any questions about these Terms of Service, please contact us at {storeConfig.store.email || "support@example.com"}.
					</p>
				</section>
			</div>
		</div>
	);
}
