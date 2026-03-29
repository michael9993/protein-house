"use client";

import { usePathname, useParams, useSearchParams, useRouter } from "next/navigation";

export function MobileSaleButton() {
	const pathname = usePathname();
	const params = useParams();
	const searchParams = useSearchParams();
	const router = useRouter();
	const channel = (params?.channel as string) || pathname?.split("/")[1] || "";

	const isOnProducts = pathname?.includes("/products");
	const hasSaleFilter = searchParams?.get("onSale") === "true";
	const isSaleActive = isOnProducts && hasSaleFilter;

	const handleClick = () => {
		if (isOnProducts) {
			// On PLP — toggle the onSale filter while preserving other filters
			const newParams = new URLSearchParams(searchParams?.toString() || "");
			if (hasSaleFilter) {
				newParams.delete("onSale");
			} else {
				newParams.set("onSale", "true");
			}
			const qs = newParams.toString();
			router.push(`/${channel}/products${qs ? `?${qs}` : ""}`);
		} else {
			// Not on PLP — navigate to products with onSale filter
			router.push(`/${channel}/products?onSale=true`);
		}
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			className={`flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide shadow-sm transition-all active:scale-95 ${
				isSaleActive
					? "bg-red-600 text-white"
					: "group relative border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
			}`}
		>
			{isSaleActive ? (
				<svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
					<path fillRule="evenodd" d="M5.25 2.25a3 3 0 00-3 3v4.318a3 3 0 00.879 2.121l9.58 9.581c.92.92 2.39.95 3.35.075l4.38-3.983a2.4 2.4 0 00-.075-3.545L10.71 3.879A3 3 0 008.59 3H5.25zM8 7a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
				</svg>
			) : (
				<svg className="h-3.5 w-3.5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
					<path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
					<path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
				</svg>
			)}
			Sale
			{/* Pulsing dot only when inactive */}
			{!isSaleActive && (
				<span className="absolute -end-0.5 -top-0.5 flex h-2 w-2">
					<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
					<span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
				</span>
			)}
		</button>
	);
}
