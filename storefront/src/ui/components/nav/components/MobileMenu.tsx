"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Logo } from "../../Logo";
import { useMobileMenu } from "./useMobileMenu";
import { OpenButton } from "./OpenButton";
import { CloseButton } from "./CloseButton";
import { SearchBar } from "./SearchBar";
import { MobileMenuProvider } from "./MobileMenuContext";
import { MobileNavContent } from "./MobileNavContent";
import { useContentConfig } from "@/providers/StoreConfigProvider";
import type { MobileNavData } from "./NavLinksClient";

type Props = {
	children?: ReactNode;
	channel: string;
	/** When provided, mobile menu shows Shopify-style sections (Categories, Collections, Brands) instead of desktop nav. */
	navData?: MobileNavData;
	/** When false, Account quick link goes to login; when true, to account. */
	isLoggedIn?: boolean;
};

/** Shopify-style drawer: position and slide direction from Storefront Control (navbar.mobileNavPosition). */
export const MobileMenu = ({ children, channel, navData, isLoggedIn }: Props) => {
	const { closeMenu, openMenu, isOpen } = useMobileMenu();
	const [mounted, setMounted] = useState(false);
	const content = useContentConfig();
	const mobileNavPosition = content.navbar?.mobileNavPosition ?? "right";

	useEffect(() => setMounted(true), []);

	// Body scroll lock when drawer is open (Shopify cart/menu pattern)
	useEffect(() => {
		if (!isOpen) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, [isOpen]);

	const drawerBody = navData ? (
		<MobileMenuProvider inMobileMenu={true}>
			<nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3" aria-label="Mobile navigation" id="mobile-menu">
				<MobileNavContent navData={navData} channel={channel} onClose={closeMenu} isLoggedIn={isLoggedIn} />
			</nav>
		</MobileMenuProvider>
	) : (
		<MobileMenuProvider inMobileMenu={true}>
			<nav
				className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3"
				aria-label="Mobile navigation"
				id="mobile-menu"
			>
				<ul className="flex flex-col gap-0" style={{ backgroundColor: "var(--store-bg)" }}>
					<style>{`
						#mobile-menu > ul > li { border-bottom: 1px solid var(--store-neutral-200); }
						#mobile-menu > ul > li:last-child { border-bottom: none; }
					`}</style>
					{children}
				</ul>
			</nav>
		</MobileMenuProvider>
	);

	const drawer = (
		<Transition show={isOpen}>
			<Dialog onClose={closeMenu} className="relative z-[100]">
				<div className="fixed inset-0 z-[100]" aria-hidden={!isOpen}>
					{/* Backdrop – dimmed overlay, tap/click to close (Shopify-style) */}
					<Transition.Child
						as="div"
						className="fixed inset-0 bg-black/50"
						aria-hidden="true"
						onClick={closeMenu}
						enter="ease-out duration-200"
						enterFrom="opacity-0"
						enterTo="opacity-100"
						leave="ease-in duration-150"
						leaveFrom="opacity-100"
						leaveTo="opacity-0"
					/>

					{/* Drawer panel – position from Storefront Control (navbar.mobileNavPosition: left | right) */}
					<Transition.Child
						as={Dialog.Panel}
						className={`fixed inset-y-0 z-10 flex h-full flex-col overflow-hidden shadow-2xl focus:outline-none w-[min(360px,90vw)] max-w-[min(360px,90vw)] ${mobileNavPosition === "left" ? "start-0" : "end-0"}`}
						style={{ backgroundColor: "var(--store-bg)" }}
						enter="ease-out duration-200"
						enterFrom={mobileNavPosition === "left" ? "translate-x-[-100%] rtl:translate-x-full" : "translate-x-full rtl:translate-x-[-100%]"}
						enterTo="translate-x-0"
						leave="ease-in duration-150"
						leaveFrom="translate-x-0"
						leaveTo={mobileNavPosition === "left" ? "translate-x-[-100%] rtl:translate-x-full" : "translate-x-full rtl:translate-x-[-100%]"}
					>
						{/* Drawer header – Allin-style: Logo, optional "Menu" / "תפריט" label, Close */}
						<div
							className="flex min-h-[3.5rem] shrink-0 items-center justify-between gap-3 border-b px-4 py-3"
							style={{
								backgroundColor: "var(--store-mobile-menu-bg)",
								borderColor: "var(--store-neutral-200)",
							}}
						>
							<Logo />
							{content.navbar?.menuLabel ? (
								<span className="flex-1 text-center text-base font-semibold" style={{ color: "var(--store-text)" }}>
									{content.navbar.menuLabel}
								</span>
							) : (
								<span className="flex-1" aria-hidden />
							)}
							<div className="flex -me-1 -my-1 min-h-[2.75rem] min-w-[2.75rem] items-center justify-center">
								<CloseButton onClick={closeMenu} aria-controls="mobile-menu" />
							</div>
						</div>

						{/* Search – compact block */}
						<div className="shrink-0 border-b px-4 py-3" style={{ borderColor: "var(--store-neutral-200)" }}>
							<SearchBar channel={channel} />
						</div>

						{drawerBody}
					</Transition.Child>
				</div>
			</Dialog>
		</Transition>
	);

	return (
		<>
			<OpenButton onClick={openMenu} aria-controls="mobile-menu" aria-expanded={isOpen} />
			{mounted && createPortal(drawer, document.body)}
		</>
	);
};
