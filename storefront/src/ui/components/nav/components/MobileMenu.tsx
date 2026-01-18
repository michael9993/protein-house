"use client";

import { Fragment, type ReactNode } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Logo } from "../../Logo";
import { useMobileMenu } from "./useMobileMenu";
import { OpenButton } from "./OpenButton";
import { CloseButton } from "./CloseButton";

type Props = {
	children: ReactNode;
};

export const MobileMenu = ({ children }: Props) => {
	const { closeMenu, openMenu, isOpen } = useMobileMenu();

	return (
		<>
			<OpenButton onClick={openMenu} aria-controls="mobile-menu" />
			<Transition show={isOpen}>
				<Dialog onClose={closeMenu}>
					<Dialog.Panel 
						className="fixed inset-0 z-20 flex h-dvh w-screen flex-col overflow-y-scroll"
						style={{ backgroundColor: "var(--store-bg)" }}
					>
						<Transition.Child
							className="sticky top-0 z-10 flex h-16 shrink-0 px-3 backdrop-blur-md sm:px-8"
							style={{ backgroundColor: "var(--store-mobile-menu-bg)" }}
							enter="motion-safe:transition-all motion-safe:duration-150"
							enterFrom="opacity-0"
							enterTo="opacity-100"
							leave="motion-safe:transition-all motion-safe:duration-150"
							leaveFrom="opacity-100"
							leaveTo="opacity-0"
						>
							<Logo />
							<CloseButton onClick={closeMenu} aria-controls="mobile-menu" />
						</Transition.Child>
						<Transition.Child
							as={Fragment}
							enter="motion-safe:transition-all motion-safe:duration-150"
							enterFrom="opacity-0 -translate-y-3"
							enterTo="opacity-100 translate-y-0"
							leave="motion-safe:transition-all motion-safe:duration-150"
							leaveFrom="opacity-100 translate-y-0"
							leaveTo="opacity-0 -translate-y-3"
						>
							<ul
								className="flex h-full flex-col whitespace-nowrap p-3 pt-0 sm:p-8 sm:pt-0 [&>li]:py-3"
								style={{ 
									backgroundColor: "var(--store-bg)",
									borderColor: "var(--store-neutral-200)",
								}}
								id="mobile-menu"
							>
								<style>{`
									#mobile-menu > li {
										border-bottom: 1px solid var(--store-neutral-200);
									}
									#mobile-menu > li:last-child {
										border-bottom: none;
									}
								`}</style>
								{children}
							</ul>
						</Transition.Child>
					</Dialog.Panel>
				</Dialog>
			</Transition>
		</>
	);
};
