"use client";

import { useState } from "react";
import { Drawer } from "vaul";
import { X, Ruler } from "lucide-react";
import {
	dogClothingSizes,
	catClothingSizes,
	dogCollarSizes,
	catCollarSizes,
	petBedSizes,
	type PetClothingSizeRow,
	type CollarSizeRow,
	type BedSizeRow,
} from "@/lib/size-conversions";
import { useBranding, useProductDetailText } from "@/providers/StoreConfigProvider";
import { useDirection } from "@/providers/DirectionProvider";

interface SizeGuideModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Which category to show first. Defaults to "clothing". */
	defaultCategory?: "clothing" | "collars" | "beds";
}

type PetTab = "dogs" | "cats";
type SizeCategory = "clothing" | "collars" | "beds";

function ClothingTable({ rows, accent }: { rows: PetClothingSizeRow[]; accent: string }) {
	return (
		<div className="overflow-x-auto">
			<table className="w-full min-w-[420px] text-sm">
				<thead>
					<tr>
						<th className="sticky start-0 bg-white px-3 py-3 text-start text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accent }}>
							Size
						</th>
						<th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accent }}>
							Weight
						</th>
						<th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accent }}>
							Back (cm)
						</th>
						<th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accent }}>
							Chest (cm)
						</th>
						<th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accent }}>
							Neck (cm)
						</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row, i) => (
						<tr key={row.size} className={i % 2 === 0 ? "bg-neutral-50" : "bg-white"}>
							<td className="sticky start-0 px-3 py-2.5 font-semibold text-neutral-900" style={{ backgroundColor: i % 2 === 0 ? "rgb(250 250 250)" : "white" }}>
								{row.size}
							</td>
							<td className="px-3 py-2.5 text-center text-neutral-700">{row.weight}</td>
							<td className="px-3 py-2.5 text-center text-neutral-700">{row.backLength}</td>
							<td className="px-3 py-2.5 text-center text-neutral-700">{row.chest}</td>
							<td className="px-3 py-2.5 text-center text-neutral-700">{row.neck}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function CollarTable({ rows, accent }: { rows: CollarSizeRow[]; accent: string }) {
	return (
		<div className="overflow-x-auto">
			<table className="w-full min-w-[360px] text-sm">
				<thead>
					<tr>
						<th className="sticky start-0 bg-white px-3 py-3 text-start text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accent }}>
							Size
						</th>
						<th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accent }}>
							Weight
						</th>
						<th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accent }}>
							Neck (cm)
						</th>
						<th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accent }}>
							Chest (cm)
						</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row, i) => (
						<tr key={row.size} className={i % 2 === 0 ? "bg-neutral-50" : "bg-white"}>
							<td className="sticky start-0 px-3 py-2.5 font-semibold text-neutral-900" style={{ backgroundColor: i % 2 === 0 ? "rgb(250 250 250)" : "white" }}>
								{row.size}
							</td>
							<td className="px-3 py-2.5 text-center text-neutral-700">{row.weight}</td>
							<td className="px-3 py-2.5 text-center text-neutral-700">{row.neck}</td>
							<td className="px-3 py-2.5 text-center text-neutral-700">{row.chest}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function BedTable({ rows, accent }: { rows: BedSizeRow[]; accent: string }) {
	return (
		<div className="overflow-x-auto">
			<table className="w-full min-w-[420px] text-sm">
				<thead>
					<tr>
						<th className="sticky start-0 bg-white px-3 py-3 text-start text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accent }}>
							Size
						</th>
						<th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accent }}>
							Pet Weight
						</th>
						<th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accent }}>
							Dimensions (cm)
						</th>
						<th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-white" style={{ backgroundColor: accent }}>
							Best For
						</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row, i) => (
						<tr key={row.size} className={i % 2 === 0 ? "bg-neutral-50" : "bg-white"}>
							<td className="sticky start-0 px-3 py-2.5 font-semibold text-neutral-900" style={{ backgroundColor: i % 2 === 0 ? "rgb(250 250 250)" : "white" }}>
								{row.size}
							</td>
							<td className="px-3 py-2.5 text-center text-neutral-700">{row.weight}</td>
							<td className="px-3 py-2.5 text-center text-neutral-700">{row.dimensions}</td>
							<td className="px-3 py-2.5 text-center text-neutral-700 text-xs">{row.bestFor}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

export function SizeGuideModal({ open, onOpenChange, defaultCategory = "clothing" }: SizeGuideModalProps) {
	const [petTab, setPetTab] = useState<PetTab>("dogs");
	const [sizeCategory, setSizeCategory] = useState<SizeCategory>(defaultCategory);
	const { colors } = useBranding();
	const { isRTL } = useDirection();
	const text = useProductDetailText();

	const title = text.sizeGuideTitle || "Pet Size Guide";
	const subtitle = text.sizeGuideSubtitle || "Find the perfect fit for your pet";
	const howToMeasureTitle = text.sizeGuideHowToMeasure || "How to Measure";

	const clothingMeasureTip = text.sizeGuideMeasureTip || "Use a soft tape measure while your pet is standing. Back length: measure from the base of the neck to the base of the tail. Chest: measure around the widest part of the ribcage. Neck: measure around the base of the neck where a collar sits.";
	const clothingProTip = text.sizeGuideProTip || "If your pet is between sizes, choose the larger size for comfort. For thick-coated breeds, add 2-3 cm to chest and neck measurements.";

	const collarMeasureTip = "Measure your pet's neck where the collar naturally sits. For harnesses, also measure around the widest part of the chest, just behind the front legs. You should be able to fit two fingers between the collar/harness and your pet.";
	const collarProTip = "For puppies and kittens, check the fit regularly as they grow quickly. Adjustable collars and harnesses are a great choice for growing pets.";

	const bedMeasureTip = "Measure your pet from nose to tail base while they are lying in their natural sleeping position. Add 15-20 cm to get the ideal bed size. Observe whether your pet curls up or stretches out when sleeping.";
	const bedProTip = "Pets that curl up can use a smaller bed, while stretchers need extra room. Orthopedic beds are recommended for senior pets or large breeds.";

	const categoryLabels: Record<SizeCategory, string> = {
		clothing: text.sizeGuideClothingCategory || "Clothing",
		collars: text.sizeGuideCollarsCategory || "Collars & Harnesses",
		beds: text.sizeGuideBedCategory || "Beds",
	};

	const petLabels: Record<PetTab, string> = {
		dogs: text.sizeGuideDogsTab || "Dogs",
		cats: text.sizeGuideCatsTab || "Cats",
	};

	const dir = isRTL ? "rtl" : "ltr";

	const getMeasureTip = () => {
		if (sizeCategory === "clothing") return clothingMeasureTip;
		if (sizeCategory === "collars") return collarMeasureTip;
		return bedMeasureTip;
	};

	const getProTip = () => {
		if (sizeCategory === "clothing") return clothingProTip;
		if (sizeCategory === "collars") return collarProTip;
		return bedProTip;
	};

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

					{/* Category Toggle (Clothing / Collars & Harnesses / Beds) */}
					<div className="flex items-center justify-center gap-1 border-b border-neutral-100 px-6 py-2">
						{(["clothing", "collars", "beds"] as SizeCategory[]).map((cat) => (
							<button
								key={cat}
								type="button"
								onClick={() => {
									setSizeCategory(cat);
									setPetTab("dogs");
								}}
								className="rounded-full px-4 py-1.5 text-xs font-semibold transition-all"
								style={{
									backgroundColor: sizeCategory === cat ? colors.primary : "transparent",
									color: sizeCategory === cat ? "#fff" : "#737373",
								}}
							>
								{categoryLabels[cat]}
							</button>
						))}
					</div>

					{/* Pet Type Tabs (Dogs / Cats) — not shown for beds */}
					{sizeCategory !== "beds" && (
						<div className="flex border-b border-neutral-100 px-6">
							{(["dogs", "cats"] as PetTab[]).map((tab) => (
								<button
									key={tab}
									type="button"
									onClick={() => setPetTab(tab)}
									className="relative px-4 py-3 text-sm font-semibold transition-colors"
									style={{
										color: petTab === tab ? colors.primary : "#737373",
									}}
								>
									{petLabels[tab]}
									{petTab === tab && (
										<span
											className="absolute inset-x-0 bottom-0 h-0.5 rounded-full"
											style={{ backgroundColor: colors.primary }}
										/>
									)}
								</button>
							))}
						</div>
					)}

					{/* Content */}
					<div
						className="flex-1 overflow-y-auto px-6 py-4"
						style={{ transform: "translateZ(0)", WebkitOverflowScrolling: "touch" } as React.CSSProperties}
					>
						{/* Size Table */}
						<div className="rounded-xl border border-neutral-200 overflow-hidden">
							{sizeCategory === "clothing" && (
								<ClothingTable
									rows={petTab === "dogs" ? dogClothingSizes : catClothingSizes}
									accent={colors.primary}
								/>
							)}
							{sizeCategory === "collars" && (
								<CollarTable
									rows={petTab === "dogs" ? dogCollarSizes : catCollarSizes}
									accent={colors.primary}
								/>
							)}
							{sizeCategory === "beds" && (
								<BedTable rows={petBedSizes} accent={colors.primary} />
							)}
						</div>

						{/* How to Measure */}
						<div className="mt-6 rounded-xl border border-neutral-200 p-5">
							<h3 className="flex items-center gap-2 text-sm font-bold text-neutral-900">
								<Ruler className="h-4 w-4" style={{ color: colors.primary }} />
								{howToMeasureTitle}
							</h3>
							<p className="mt-2 text-sm leading-relaxed text-neutral-600">
								{getMeasureTip()}
							</p>
						</div>

						{/* Pro Tip */}
						<div
							className="mt-4 rounded-xl p-4"
							style={{ backgroundColor: `${colors.primary}08` }}
						>
							<p className="text-sm leading-relaxed text-neutral-700">
								<span className="font-bold" style={{ color: colors.primary }}>Tip: </span>
								{getProTip()}
							</p>
						</div>
					</div>
				</Drawer.Content>
			</Drawer.Portal>
		</Drawer.Root>
	);
}

/**
 * Inline trigger button -- place next to size selector.
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
