"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { useBranding, useFloatingButtons } from "@/providers/StoreConfigProvider";
import {
	computeFloatingButtonPosition,
	setFabVisible,
	useHiddenFabIds,
} from "@/lib/floating-buttons";

// Appears shortly after user starts scrolling; rendered in portal so it's viewport-fixed
// Controlled by storefront-control: Global > Features > Floating Buttons > Scroll to Top
const SCROLL_THRESHOLD = 200;

export function ScrollToTopButton() {
	const [visible, setVisible] = useState(false);
	const [mounted, setMounted] = useState(false);
	const branding = useBranding();
	const floatingButtons = useFloatingButtons();
	const hiddenIds = useHiddenFabIds();
	const pathname = usePathname();

	// Detect PDP for extra bottom offset (sticky add-to-cart bar)
	const isPDP = /^\/[^/]+\/products\/[^/]+/.test(pathname);
	const dir =
		typeof document !== "undefined"
			? (document.documentElement.getAttribute("dir") as "ltr" | "rtl") || "ltr"
			: "ltr";

	const pos = computeFloatingButtonPosition("scrollToTop", floatingButtons, isPDP, dir, hiddenIds);

	useEffect(() => {
		setMounted(true);
		// Start hidden — broadcast to other FABs
		setFabVisible("scrollToTop", false);
		return () => {
			// Clean up on unmount
			setFabVisible("scrollToTop", false);
		};
	}, []);

	useEffect(() => {
		if (!mounted) return;
		const handleScroll = () => {
			const isVisible = window.scrollY > SCROLL_THRESHOLD;
			setVisible(isVisible);
			// Broadcast visibility to other FABs on the same side
			setFabVisible("scrollToTop", isVisible);
		};
		handleScroll();
		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [mounted]);

	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	// Controlled by floating buttons config
	if (!pos.enabled) return null;
	// Portal to document.body so the button is viewport-fixed (layout uses transform on wrapper)
	if (!mounted || typeof document === "undefined") return null;

	const button = (
		<button
			type="button"
			onClick={scrollToTop}
			aria-label="Scroll back to top"
			className="fixed z-[100] flex h-12 w-12 items-center justify-center rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:scale-105 active:scale-95"
			style={{
				backgroundColor: branding.colors.primary,
				color: "#fff",
				bottom: pos.bottom,
				[pos.side]: "1.25rem",
				opacity: visible ? 1 : 0,
				transform: visible ? "scale(1)" : "scale(0.8)",
				pointerEvents: visible ? "auto" : "none",
				transition: "bottom 300ms ease, opacity 300ms ease, transform 300ms ease",
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

	return createPortal(button, document.body);
}
