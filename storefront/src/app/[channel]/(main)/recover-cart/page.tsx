export default async function RecoverCartErrorPage(props: {
	params: Promise<{ channel: string }>;
}) {
	const { channel } = await props.params;

	return (
		<div className="flex min-h-[60vh] items-center justify-center px-4">
			<div className="text-center max-w-md">
				<h1 className="text-2xl font-semibold text-neutral-900 mb-4">
					Link Expired
				</h1>
				<p className="text-neutral-600 mb-6">
					This recovery link has expired or is no longer valid. Recovery links
					are valid for 7 days.
				</p>
				<a
					href={`/${channel}`}
					className="inline-block rounded-lg bg-neutral-900 px-6 py-3 text-sm font-medium text-white hover:bg-neutral-800 transition-colors"
				>
					Continue Shopping
				</a>
			</div>
		</div>
	);
}
