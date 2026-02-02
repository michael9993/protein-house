"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useBranding, useFeature } from "@/providers/StoreConfigProvider";

// Appears shortly after user starts scrolling; rendered in portal so it's viewport-fixed
// Controlled by storefront-control: Features > Scroll to Top
const SCROLL_THRESHOLD = 200;

export function ScrollToTopButton() {
	const [visible, setVisible] = useState(false);
	const [mounted, setMounted] = useState(false);
	const branding = useBranding();
	const scrollToTopEnabled = useFeature("scrollToTop");

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted) return;
		const handleScroll = () => {
			setVisible(window.scrollY > SCROLL_THRESHOLD);
		};
		handleScroll();
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [mounted]);

	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	const button = (
		<button
			type="button"
			onClick={scrollToTop}
			aria-label="Scroll back to top"
			className="fixed right-5 z-[100] flex h-12 w-12 items-center justify-center rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-[transform,opacity] duration-300 hover:scale-105 active:scale-95 md:hidden"
			style={{
				backgroundColor: branding.colors.primary,
				color: "#fff",
				bottom: "7rem",
				opacity: visible ? 1 : 0,
				pointerEvents: visible ? "auto" : "none",
			}}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="h-6 w-6"
				aria-hidden
			>
				<path d="M18 15l-6-6-6 6" />
			</svg>
		</button>
	);

	// Controlled by storefront-control; only render when enabled
	if (!scrollToTopEnabled) return null;
	// Portal to document.body so the button is viewport-fixed (layout uses transform on wrapper)
	if (!mounted || typeof document === "undefined") return null;
	return createPortal(button, document.body);
}
