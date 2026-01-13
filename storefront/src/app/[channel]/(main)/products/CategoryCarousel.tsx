"use client";

import { useState, useEffect, useRef, type CSSProperties } from "react";
import Image from "next/image";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { storeConfig } from "@/config";

interface ProductImage {
	url: string;
	alt: string | null;
}

interface CategoryProduct {
	id: string;
	name: string;
	slug: string;
	thumbnail: ProductImage | null;
	media: ProductImage[];
}

interface Category {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	backgroundImage: ProductImage | null;
	products: {
		totalCount: number;
		edges: Array<{ node: CategoryProduct }>;
	};
}

interface Collection {
	id: string;
	name: string;
	slug: string;
	description: string | null;
	backgroundImage: ProductImage | null;
	products: {
		totalCount: number;
		edges: Array<{ node: CategoryProduct }>;
	};
}

interface Brand {
	id: string;
	name: string;
	slug: string;
	products: {
		totalCount: number;
		edges: Array<{ node: CategoryProduct }>;
	};
}

interface CategoryCarouselProps {
	categories: Category[];
	collections?: Collection[];
	brands?: Brand[];
}

export function CategoryCarousel({ categories, collections = [], brands = [] }: CategoryCarouselProps) {
	const [isScrolled, setIsScrolled] = useState(false);
	const carouselRef = useRef<HTMLDivElement>(null);
	const { branding } = storeConfig;

	// Filter items that have products
	const categoriesWithProducts = categories.filter(
		(cat) => cat.products?.totalCount > 0 && cat.products.edges.length > 0
	);
	const collectionsWithProducts = collections.filter(
		(col) => col.products?.totalCount > 0 && col.products.edges.length > 0
	);
	const brandsWithProducts = brands.filter(
		(brand) => brand.products?.totalCount > 0 && brand.products.edges.length > 0
	);

	const hasContent = categoriesWithProducts.length > 0 || collectionsWithProducts.length > 0 || brandsWithProducts.length > 0;

	if (!hasContent) {
		return null;
	}

	// Scroll detection for sticky navigation
	useEffect(() => {
		const handleScroll = () => {
			if (!carouselRef.current) return;
			const rect = carouselRef.current.getBoundingClientRect();
			setIsScrolled(rect.bottom < 96);
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		handleScroll();
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	return (
		<>
			{/* Modern Carousel Section */}
			<div ref={carouselRef} className="w-full">
				<div className="relative overflow-hidden rounded-2xl border border-neutral-200/60 bg-gradient-to-br from-white via-neutral-50/30 to-white shadow-lg backdrop-blur-sm sm:rounded-3xl">
					{/* Subtle gradient overlay */}
					<div 
						className="absolute inset-0 opacity-50 pointer-events-none"
						style={{
							background: `radial-gradient(circle at 30% 20%, ${branding.colors.primary}08 0%, transparent 50%)`,
						}}
					/>
					
					<div className="relative p-4 sm:p-6">
						{/* Categories Section */}
						{categoriesWithProducts.length > 0 && (
							<CarouselSection
								title="Shop by Category"
								items={categoriesWithProducts}
								type="category"
								color={branding.colors.primary}
							/>
						)}

						{/* Collections Section */}
						{collectionsWithProducts.length > 0 && (
							<>
								{categoriesWithProducts.length > 0 && (
									<div className="my-4 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent sm:my-6" />
								)}
								<CarouselSection
									title="Featured Collections"
									items={collectionsWithProducts}
									type="collection"
									color={branding.colors.accent || branding.colors.primary}
								/>
							</>
						)}

						{/* Brands Section */}
						{brandsWithProducts.length > 0 && (
							<>
								{(categoriesWithProducts.length > 0 || collectionsWithProducts.length > 0) && (
									<div className="my-4 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent sm:my-6" />
								)}
								<CarouselSection
									title="Popular Brands"
									items={brandsWithProducts}
									type="brand"
									color={branding.colors.secondary || branding.colors.primary}
								/>
							</>
						)}
					</div>
				</div>
			</div>

			{/* Sticky Navigation Bar */}
			<div
				className={`fixed left-0 right-0 z-40 transition-all duration-300 ease-out ${
					isScrolled ? "top-24 translate-y-0 opacity-100" : "top-24 -translate-y-full opacity-0 pointer-events-none"
				}`}
			>
				<div className="mx-auto w-full max-w-[1920px] border-b border-neutral-200 bg-white/95 backdrop-blur-md shadow-sm">
					<div className="px-4 py-2.5 sm:px-6 sm:py-3">
						<div className="flex flex-wrap items-center justify-center gap-2 overflow-x-auto sm:gap-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
							{categoriesWithProducts.map((category) => (
								<StickyNavLink
									key={`cat-${category.id}`}
									href={`/products?categories=${category.slug}`}
									label={category.name}
									color={branding.colors.primary}
								/>
							))}
							{collectionsWithProducts.map((collection) => (
								<StickyNavLink
									key={`col-${collection.id}`}
									href={`/products?collections=${collection.slug}`}
									label={collection.name}
									color={branding.colors.accent || branding.colors.primary}
								/>
							))}
							{brandsWithProducts.map((brand) => (
								<StickyNavLink
									key={`brand-${brand.id}`}
									href={`/products?brands=${brand.slug}`}
									label={brand.name}
									color={branding.colors.secondary || branding.colors.primary}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

// Carousel Section Component
function CarouselSection({ 
	title, 
	items, 
	type, 
	color 
}: { 
	title: string; 
	items: (Category | Collection | Brand)[]; 
	type: "category" | "collection" | "brand";
	color: string;
}) {
	return (
		<div className="space-y-3 sm:space-y-4">
			{/* Section Header */}
			<div className="flex items-center gap-3">
				<div 
					className="h-1 w-8 rounded-full"
					style={{ backgroundColor: color }}
				/>
				<h3 className="text-sm font-bold uppercase tracking-wider text-neutral-800 sm:text-base">
					{title}
				</h3>
				<div className="h-px flex-1 bg-gradient-to-r from-neutral-300 to-transparent" />
				<span className="text-xs font-semibold text-neutral-500 sm:text-sm">
					{items.length}
				</span>
			</div>

			{/* Horizontal Scrollable Items */}
			<div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide sm:gap-4 sm:pb-3">
				{items.map((item) => (
					<CarouselItem key={item.id} item={item} type={type} color={color} />
				))}
			</div>
		</div>
	);
}

// Carousel Item Component
function CarouselItem({ 
	item, 
	type, 
	color 
}: { 
	item: Category | Collection | Brand; 
	type: "category" | "collection" | "brand";
	color: string;
}) {
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const { branding } = storeConfig;

	// Get product images
	const productImages: ProductImage[] = item.products.edges
		.flatMap(({ node }: { node: CategoryProduct }) => {
			const images: ProductImage[] = [];
			if (node.thumbnail) images.push(node.thumbnail);
			if (node.media?.length > 0) images.push(...node.media.slice(0, 1));
			return images;
		})
		.filter((img) => img.url)
		.slice(0, 4);

	// Rotate images
	useEffect(() => {
		if (productImages.length <= 1) return;
		const interval = setInterval(() => {
			setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
		}, 3500);
		return () => clearInterval(interval);
	}, [productImages.length]);

	if (productImages.length === 0) return null;

	const href = 
		type === "collection" ? `/products?collections=${item.slug}` :
		type === "brand" ? `/products?brands=${item.slug}` :
		`/products?categories=${item.slug}`;

	return (
		<LinkWithChannel
			href={href}
			className="group relative flex min-w-[100px] flex-col items-center gap-2.5 rounded-xl bg-white p-3 shadow-sm ring-1 ring-neutral-200/50 transition-all duration-300 hover:shadow-md hover:ring-2 hover:-translate-y-0.5 active:translate-y-0 sm:min-w-[120px] sm:gap-3 sm:p-4"
			style={{
				"--hover-ring-color": color + "40",
			} as CSSProperties}
		>
			{/* Image Container */}
			<div 
				className="relative h-16 w-16 overflow-hidden rounded-xl ring-1 ring-neutral-200/40 shadow-sm transition-all duration-300 group-hover:ring-2 group-hover:shadow-md sm:h-20 sm:w-20"
				style={{
					boxShadow: `0 2px 8px ${color}15`,
				} as CSSProperties & { boxShadow?: string }}
			>
				{productImages.map((image, index) => (
					<div
						key={`${image.url}-${index}`}
						className={`absolute inset-0 transition-all duration-700 ${
							index === currentImageIndex ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-95"
						}`}
					>
						<Image
							src={image.url}
							alt={image.alt || `${item.name} product`}
							fill
							className="object-cover transition-transform duration-500 group-hover:scale-110"
							sizes="(max-width: 640px) 64px, 80px"
						/>
					</div>
				))}
				{/* Hover gradient */}
				<div 
					className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
					style={{
						background: `linear-gradient(135deg, ${color}20 0%, transparent 50%, ${color}10 100%)`,
					}}
				/>
			</div>
			
			{/* Name */}
			<span 
				className="text-center text-[11px] font-semibold leading-tight transition-all duration-300 group-hover:scale-105 sm:text-xs"
				style={{ color: branding.colors.text }}
			>
				{item.name}
			</span>
			
			{/* Product count badge */}
			{item.products.totalCount > 0 && (
				<span className="text-[9px] font-medium text-neutral-400 sm:text-[10px]">
					{item.products.totalCount} {item.products.totalCount === 1 ? "item" : "items"}
				</span>
			)}
		</LinkWithChannel>
	);
}

// Sticky Navigation Link Component
function StickyNavLink({ 
	href, 
	label, 
	color 
}: { 
	href: string; 
	label: string; 
	color: string;
}) {
	return (
		<LinkWithChannel
			href={href}
			className="group relative shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-all duration-200 hover:scale-105 active:scale-95 sm:px-4 sm:py-2 sm:text-sm"
		>
			<span className="relative z-10 transition-colors duration-200 group-hover:opacity-90">
				{label}
			</span>
			<span 
				className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full transition-all duration-200 group-hover:w-3/4"
				style={{ backgroundColor: color }}
			/>
		</LinkWithChannel>
	);
}
