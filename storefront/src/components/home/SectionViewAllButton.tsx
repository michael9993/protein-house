"use client";

import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";
import { useSectionViewAllButtonConfig } from "@/providers/StoreConfigProvider";

interface SectionViewAllButtonProps {
	href: string;
	text: string;
	className?: string;
}

export function SectionViewAllButton({ href, text, className = "" }: SectionViewAllButtonProps) {
	const config = useSectionViewAllButtonConfig();
	const showIcon = config.icon !== "none";
	const Icon = config.icon === "arrow" ? ArrowRight : ChevronRight;

	if (config.style === "pill") {
		return (
			<Link
				href={href}
				className={`group/link inline-flex items-center gap-2 rounded-full border border-neutral-200 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-900 transition-all duration-300 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white ${className}`}
			>
				{text}
				{showIcon && (
					<Icon
						size={14}
						className="transition-transform duration-300 group-hover/link:translate-x-0.5 rtl:rotate-180 rtl:group-hover/link:-translate-x-0.5"
						aria-hidden="true"
					/>
				)}
			</Link>
		);
	}

	if (config.style === "text") {
		return (
			<Link
				href={href}
				className={`group inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-neutral-900 transition hover:gap-3 ${className}`}
			>
				{text}
				{showIcon && (
					<Icon
						size={14}
						className="transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
						aria-hidden="true"
					/>
				)}
			</Link>
		);
	}

	// minimal
	return (
		<Link
			href={href}
			className={`text-xs font-bold uppercase tracking-[0.25em] text-neutral-900 transition hover:opacity-70 ${className}`}
		>
			{text}
		</Link>
	);
}
