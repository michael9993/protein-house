"use client";

import { useState } from "react";
import { Drawer } from "vaul";
import { X, Ruler } from "lucide-react";
import {
	mensSizes,
	womensSizes,
	kidsSizes,
	mensClothingSizes,
	womensClothingSizes,
	kidsClothingSizes,
	type SizeRow,
	type ClothingSizeRow,
} from "@/lib/size-conversions";
import { useBranding, useProductDetailText } from "@/providers/StoreConfigProvider";
import { useDirection } from "@/providers/DirectionProvider";

interface SizeGuideModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Which category to show first. Defaults to "shoes". */
	defaultCategory?: "shoes" | "clothing";
}

type SizeTab = "mens" | "womens" | "kids";
type SizeCategory = "shoes" | "clothing";

function ShoeSizeTable({ rows, accent }: { rows: SizeRow[]; accent: string }) {
	return (
		<div className="overflow-x-auto">
			<table className="w-full min-w-[320px] text-sm">
				<thead>
					<tr>
						<th
							className="sticky start-0 bg-white px-4 py-3 text-start text-xs font-bold uppercase tracking-wider text-white"
							style={{ backgroundColor: accent }}
						>
							US
						</th>
						<th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accent }}>
							EU
						</th>
						<th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accent }}>
							UK
						</th>
						<th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accent }}>
							CM
						</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row, i) => (
						<tr
							key={row.us}
							className={i % 2 === 0 ? "bg-neutral-50" : "bg-white"}
						>
							<td className="sticky start-0 px-4 py-2.5 font-semibold text-neutral-900" style={{ backgroundColor: i % 2 === 0 ? "rgb(250 250 250)" : "white" }}>
								{row.us}
							</td>
							<td className="px-4 py-2.5 text-center text-neutral-700">{row.eu}</td>
							<td className="px-4 py-2.5 text-center text-neutral-700">{row.uk}</td>
							<td className="px-4 py-2.5 text-center text-neutral-700">{row.cm}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function ClothingSizeTable({ rows, accent }: { rows: ClothingSizeRow[]; accent: string }) {
	return (
		<div className="overflow-x-auto">
			<table className="w-full min-w-[420px] text-sm">
				<thead>
					<tr>
						<th
							className="sticky start-0 bg-white px-3 py-3 text-start text-xs font-bold uppercase tracking-wider text-white"
							style={{ backgroundColor: accent }}
						>
							Size
						</th>
						<th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accent }}>
							US
						</th>
						<th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accent }}>
							EU
						</th>
						<th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accent }}>
							UK
						</th>
						<th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accent }}>
							Chest (cm)
						</th>
						<th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accent }}>
							Waist (cm)
						</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row, i) => (
						<tr
							key={row.size}
							className={i % 2 === 0 ? "bg-neutral-50" : "bg-white"}
						>
							<td className="sticky start-0 px-3 py-2.5 font-semibold text-neutral-900" style={{ backgroundColor: i % 2 === 0 ? "rgb(250 250 250)" : "white" }}>
								{row.size}
							</td>
							<td className="px-3 py-2.5 text-center text-neutral-700">{row.us}</td>
							<td className="px-3 py-2.5 text-center text-neutral-700">{row.eu}</td>
							<td className="px-3 py-2.5 text-center text-neutral-700">{row.uk}</td>
							<td className="px-3 py-2.5 text-center text-neutral-700">{row.chest}</td>
							<td className="px-3 py-2.5 text-center text-neutral-700">{row.waist}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export function SizeGuideModal({ open, onOpenChange, defaultCategory = "shoes" }: SizeGuideModalProps) {
	const [activeTab, setActiveTab] = useState<SizeTab>("mens");
	const [sizeCategory, setSizeCategory] = useState<SizeCategory>(defaultCategory);
	const { colors } = useBranding();
	const { isRTL } = useDirection();
	const text = useProductDetailText();

	const title = text.sizeGuideTitle || "Size Guide";
	const subtitle = text.sizeGuideSubtitle || "Find your perfect fit";
	const mensLabel = text.sizeGuideMensTab || "Men's";
	const womensLabel = text.sizeGuideWomensTab || "Women's";
	const kidsLabel = text.sizeGuideKidsTab || "Kids'";
	const howToMeasureTitle = text.sizeGuideHowToMeasure || "How to Measure";
	const measureTip = text.sizeGuideMeasureTip || "Stand on a piece of paper with your heel against a wall. Mark the longest toe and measure the distance in centimeters. Compare with the CM column above.";
	const proTip = text.sizeGuideProTip || "Pro Tip: Measure your feet in the evening when they're at their largest. If you're between sizes, go up half a size for the most comfortable fit.";

	const clothingMeasureTip = text.sizeGuideClothingMeasureTip || "Use a soft tape measure. For chest: measure around the fullest part. For waist: measure around the narrowest point of your waist.";
	const clothingProTip = text.sizeGuideClothingProTip || "Pro Tip: If you're between sizes, size up for a relaxed fit or size down for a slim fit. Check the brand's specific sizing if available.";

	const shoeTabs: { id: SizeTab; label: string; data: SizeRow[] }[] = [
		{ id: "mens", label: mensLabel, data: mensSizes },
		{ id: "womens", label: womensLabel, data: womensSizes },
		{ id: "kids", label: kidsLabel, data: kidsSizes },
	];

	const clothingTabs: { id: SizeTab; label: string; data: ClothingSizeRow[] }[] = [
		{ id: "mens", label: mensLabel, data: mensClothingSizes },
		{ id: "womens", label: womensLabel, data: womensClothingSizes },
		{ id: "kids", label: kidsLabel, data: kidsClothingSizes },
	];

	const dir = isRTL ? "rtl" : "ltr";
	const shoesLabel = text.sizeGuideShoesCategory || "Shoes";
	const clothingLabel = text.sizeGuideClothingCategory || "Clothing";

	return (
		<Drawer.Root open={open} onOpenChange={onOpenChange} direction="bottom">
			<Drawer.Portal>
				<Drawer.Overlay className="fixed inset-0 z-[9998] bg-black/50" />
				<Drawer.Content
					className="fixed inset-x-0 bottom-0 z-[9999] mx-auto flex max-h-[90dvh] flex-col rounded-t-2xl bg-white outline-none sm:inset-x-4 sm:bottom-4 sm:max-h-[80vh] sm:max-w-lg sm:rounded-2xl"
					style={{
						boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
						paddingBottom: "env(safe-area-inset-bottom, 0px)",
					}}
					dir={dir}
					aria-describedby={undefined}
				>
					<Drawer.Handle className="mx-auto mt-3 mb-1 h-1.5 w-12 shrink-0 rounded-full bg-neutral-300" />

					{/* Header */}
					<div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
						<div className="flex items-center gap-3">
							<div
								className="flex h-10 w-10 items-center justify-center rounded-full"
								style={{ backgroundColor: `${colors.primary}15` }}
							>
								<Ruler className="h-5 w-5" style={{ color: colors.primary }} />
							</div>
							<div>
								<Drawer.Title className="text-lg font-bold text-neutral-900">{title}</Drawer.Title>
								<p className="text-xs text-neutral-500">{subtitle}</p>
							</div>
						</div>
						<button
							type="button"
							onClick={() => onOpenChange(false)}
							className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600"
							aria-label="Close"
						>
							<X className="h-5 w-5" />
						</button>
					</div>

					{/* Category Toggle (Shoes / Clothing) */}
					<div className="flex items-center justify-center gap-1 border-b border-neutral-100 px-6 py-2">
						{(["shoes", "clothing"] as SizeCategory[]).map((cat) => (
							<button
								key={cat}
								type="button"
								onClick={() => {
									setSizeCategory(cat);
									setActiveTab("mens");
								}}
								className="rounded-full px-4 py-1.5 text-xs font-semibold transition-all"
								style={{
									backgroundColor: sizeCategory === cat ? colors.primary : "transparent",
									color: sizeCategory === cat ? "#fff" : "#737373",
								}}
							>
								{cat === "shoes" ? shoesLabel : clothingLabel}
							</button>
						))}
					</div>

					{/* Gender Tabs */}
					<div className="flex border-b border-neutral-100 px-6">
						{(sizeCategory === "shoes" ? shoeTabs : clothingTabs).map((tab) => (
							<button
								key={tab.id}
								type="button"
								onClick={() => setActiveTab(tab.id)}
								className="relative px-4 py-3 text-sm font-semibold transition-colors"
								style={{
									color: activeTab === tab.id ? colors.primary : "#737373",
								}}
							>
								{tab.label}
								{activeTab === tab.id && (
									<span
										className="absolute inset-x-0 bottom-0 h-0.5 rounded-full"
										style={{ backgroundColor: colors.primary }}
									/>
								)}
							</button>
						))}
					</div>

					{/* Content */}
					<div
						className="flex-1 overflow-y-auto px-6 py-4"
						style={{ transform: "translateZ(0)", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
					>
						{/* Size Table */}
						<div className="rounded-xl border border-neutral-200 overflow-hidden">
							{sizeCategory === "shoes" ? (
								<ShoeSizeTable
									rows={shoeTabs.find((t) => t.id === activeTab)?.data || mensSizes}
									accent={colors.primary}
								/>
							) : (
								<ClothingSizeTable
									rows={clothingTabs.find((t) => t.id === activeTab)?.data || mensClothingSizes}
									accent={colors.primary}
								/>
							)}
						</div>

						{/* How to Measure */}
						<div className="mt-6 rounded-xl border border-neutral-200 p-5">
							<h3 className="flex items-center gap-2 text-sm font-bold text-neutral-900">
								<Ruler className="h-4 w-4" style={{ color: colors.primary }} />
								{howToMeasureTitle}
							</h3>
							<p className="mt-2 text-sm leading-relaxed text-neutral-600">
								{sizeCategory === "shoes" ? measureTip : clothingMeasureTip}
							</p>
						</div>

						{/* Pro Tip */}
						<div
							className="mt-4 rounded-xl p-4"
							style={{ backgroundColor: `${colors.primary}08` }}
						>
							<p className="text-sm leading-relaxed text-neutral-700">
								<span className="font-bold" style={{ color: colors.primary }}>💡 </span>
								{sizeCategory === "shoes" ? proTip : clothingProTip}
							</p>
						</div>
					</div>
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.Root>
	);
}

/**
 * Inline trigger button — place next to size selector.
 */
export function SizeGuideButton({ onClick }: { onClick: () => void }) {
	const text = useProductDetailText();
	const { colors } = useBranding();
	const label = text.sizeGuideButton || "Size Guide";

	return (
		<button
			type="button"
			onClick={onClick}
			className="inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-2 transition-colors hover:opacity-80"
			style={{ color: colors.primary }}
		>
			<Ruler className="h-3.5 w-3.5" />
			{label}
		</button>
	);
}
