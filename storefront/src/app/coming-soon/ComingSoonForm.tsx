"use client";

import { useState } from "react";

export function ComingSoonForm() {
	const [email, setEmail] = useState("");
	const [submitted, setSubmitted] = useState(false);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (email) setSubmitted(true);
	};

	if (submitted) {
		return (
			<div className="flex w-full max-w-md flex-col items-center gap-2 rounded-xl border border-[#1E4D3A]/20 bg-[#1E4D3A]/5 px-6 py-4">
				<svg className="h-6 w-6 text-[#1E4D3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
					<path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<p className="text-sm font-medium text-[#1E4D3A]">You&apos;re on the list!</p>
				<p className="text-xs text-[#7A756E]">We&apos;ll let you know when we launch.</p>
			</div>
		);
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
		>
			<input
				type="email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				placeholder="Enter your email"
				required
				className="flex-1 rounded-xl border border-[#1B2838]/10 bg-white px-5 py-3.5 text-sm text-[#0F1419] placeholder:text-[#7A756E]/50 shadow-sm outline-none transition-all focus:border-[#C9A962]/50 focus:ring-2 focus:ring-[#C9A962]/20"
			/>
			<button
				type="submit"
				className="rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98]"
				style={{ backgroundColor: "#1B2838" }}
			>
				Notify Me
			</button>
		</form>
	);
}
