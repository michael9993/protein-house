import NextImage, { type ImageProps } from "next/image";

export const ProductImageWrapper = (props: ImageProps) => {
	// With unoptimized images, Next.js Image uses the src URL directly in the browser
	// So we don't need to normalize - the browser can access localhost:8000
	// Normalization is only needed when Next.js Image optimization is enabled
	return (
		<div className="aspect-square overflow-hidden bg-neutral-50">
			<NextImage {...props} className="h-full w-full object-contain object-center p-2" />
		</div>
	);
};
