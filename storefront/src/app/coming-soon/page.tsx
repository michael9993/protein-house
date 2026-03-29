import type { Metadata } from "next";
import Image from "next/image";
import { ComingSoonForm } from "./ComingSoonForm";

export const metadata: Metadata = {
	title: "Coming Soon | Pawzen",
	description: "Premium pet essentials, crafted with love. Sign up to be the first to know when we launch.",
};

export default function ComingSoonPage() {
	return (
		<div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#F8F7F5] text-[#0F1419] selection:bg-[#C9A962]/30">
			{/* Subtle warm texture */}
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#C9A962]/8 blur-[120px]" />
				<div className="absolute bottom-1/4 end-1/4 h-[400px] w-[400px] rounded-full bg-[#1E4D3A]/5 blur-[100px]" />
			</div>

			{/* Content */}
			<main className="relative z-10 flex w-full max-w-xl flex-col items-center px-6 text-center">
				{/* Logo */}
				<div className="mb-10">
					<Image
						src="/logo/pawzen-logo.png"
						alt="Pawzen"
						width={200}
						height={80}
						className="h-16 w-auto object-contain sm:h-20"
						priority
					/>
				</div>

				{/* Badge */}
				<div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#C9A962]/30 bg-[#C9A962]/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-[#1B2838]">
					<span className="relative flex h-2 w-2">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1E4D3A] opacity-60" />
						<span className="relative inline-flex h-2 w-2 rounded-full bg-[#1E4D3A]" />
					</span>
					Launching Soon
				</div>

				{/* Heading */}
				<h1 className="mb-3 text-3xl font-bold tracking-tight text-[#1B2838] sm:text-4xl">
					Something special is brewing
				</h1>

				{/* Subheading */}
				<p className="mb-2 text-base text-[#7A756E] sm:text-lg">
					Premium pet essentials, crafted with love.
				</p>
				<p className="mb-10 max-w-sm text-sm text-[#7A756E]/70">
					We&apos;re putting the finishing touches on our store.
					Be the first to know when we open our doors.
				</p>

				{/* Email form */}
				<ComingSoonForm />

				{/* Social proof */}
				<p className="mt-5 text-xs text-[#7A756E]/50">
					Join pet lovers already on the waitlist
				</p>

				{/* Divider */}
				<div className="my-8 h-px w-20 bg-gradient-to-r from-transparent via-[#C9A962]/30 to-transparent" />

				{/* Instagram CTA */}
				<a
					href="https://www.instagram.com/pawzenpets.shop/"
					target="_blank"
					rel="noopener noreferrer"
					className="group flex items-center gap-2.5 rounded-full border border-[#1B2838]/10 bg-white px-5 py-2.5 text-sm font-medium text-[#1B2838] shadow-sm transition-all hover:border-[#C9A962]/40 hover:shadow-md active:scale-[0.98]"
				>
					<svg className="h-4.5 w-4.5 transition-transform group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
						<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
					</svg>
					Follow us on Instagram
					<svg className="h-3.5 w-3.5 text-[#7A756E]/40 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
						<path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
					</svg>
				</a>
			</main>

			{/* Footer */}
			<footer className="absolute bottom-6 text-xs text-[#7A756E]/30">
				pawzenpets.shop
			</footer>
		</div>
	);
}
