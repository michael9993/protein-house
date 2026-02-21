import { Inter, Poppins, Space_Grotesk, Bebas_Neue, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Suspense, type ReactNode } from "react";
import { type Metadata } from "next";
import { DraftModeNotification } from "@/ui/components/DraftModeNotification";
import { ToastProvider, ToastContainer } from "@/ui/components/Toast";
import { storeConfig } from "@/config";

// Load multiple fonts for different store themes
// Using fallback fonts and display: 'swap' for better resilience
const inter = Inter({ 
	subsets: ["latin"], 
	variable: "--font-inter",
	display: "swap",
	fallback: ["system-ui", "arial"]
});
const poppins = Poppins({ 
	subsets: ["latin"], 
	weight: ["400", "500", "600", "700"],
	variable: "--font-poppins",
	display: "swap",
	fallback: ["system-ui", "arial"]
});
const spaceGrotesk = Space_Grotesk({ 
	subsets: ["latin"],
	variable: "--font-space-grotesk",
	display: "swap",
	fallback: ["system-ui", "arial"]
});
const bebasNeue = Bebas_Neue({ 
	subsets: ["latin"],
	weight: "400",
	variable: "--font-bebas-neue",
	display: "swap",
	fallback: ["Impact", "Arial Black", "sans-serif"]
});
const plusJakarta = Plus_Jakarta_Sans({ 
	subsets: ["latin"],
	variable: "--font-plus-jakarta",
	display: "swap",
	fallback: ["system-ui", "arial"]
});

// Dynamic metadata from store config
export const metadata: Metadata = {
	title: storeConfig.seo.defaultTitle,
	description: storeConfig.seo.defaultDescription,
	metadataBase: process.env.NEXT_PUBLIC_STOREFRONT_URL
		? new URL(process.env.NEXT_PUBLIC_STOREFRONT_URL)
		: undefined,
	openGraph: {
		title: storeConfig.seo.defaultTitle,
		description: storeConfig.seo.defaultDescription,
		images: [storeConfig.seo.defaultImage],
	},
	twitter: {
		card: "summary_large_image",
		title: storeConfig.seo.defaultTitle,
		description: storeConfig.seo.defaultDescription,
		creator: storeConfig.seo.twitterHandle || undefined,
	},
};

export default function RootLayout(props: { children: ReactNode }) {
	const { children } = props;

	// Combine all font variables
	const fontVariables = [
		inter.variable,
		poppins.variable,
		spaceGrotesk.variable,
		bebasNeue.variable,
		plusJakarta.variable,
	].join(" ");

	// Note: RTL direction is handled dynamically by StoreConfigProvider's useEffect
	// The channel layout's StoreConfigProvider receives fetched CMS config and sets document.dir
	// We don't set dir here to avoid conflicts with dynamic CMS config

	return (
		<html lang="en" dir="ltr" className="min-h-dvh" suppressHydrationWarning>
			<head>
				{/* Preconnect to critical third-party origins for faster first-paint */}
				<link rel="preconnect" href={process.env.NEXT_PUBLIC_SALEOR_API_URL?.replace("/graphql/", "") || "http://localhost:8000"} />
				<link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SALEOR_API_URL?.replace("/graphql/", "") || "http://localhost:8000"} />
				{/* Preconnect to Saleor media/thumbnail CDN */}
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
			</head>
			<body className={`${fontVariables} ${inter.className} min-h-dvh`}>
				<a
					href="#main-content"
					className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-neutral-900 focus:shadow-lg focus:ring-2 focus:ring-neutral-900"
				>
					Skip to main content
				</a>
				<ToastProvider>
					{children}
					<ToastContainer />
					<Suspense>
						<DraftModeNotification />
					</Suspense>
				</ToastProvider>
			</body>
		</html>
	);
}
