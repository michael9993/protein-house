import { Inter, Poppins, Space_Grotesk, Bebas_Neue, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Suspense, type ReactNode } from "react";
import { type Metadata } from "next";
import { DraftModeNotification } from "@/ui/components/DraftModeNotification";
import { StoreConfigProvider } from "@/providers/StoreConfigProvider";
import { ToastProvider, ToastContainer } from "@/ui/components/Toast";
import { WishlistProvider } from "@/lib/wishlist";
import { storeConfig } from "@/config";

// Load multiple fonts for different store themes
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const poppins = Poppins({ 
	subsets: ["latin"], 
	weight: ["400", "500", "600", "700"],
	variable: "--font-poppins" 
});
const spaceGrotesk = Space_Grotesk({ 
	subsets: ["latin"],
	variable: "--font-space-grotesk"
});
const bebasNeue = Bebas_Neue({ 
	subsets: ["latin"],
	weight: "400",
	variable: "--font-bebas-neue"
});
const plusJakarta = Plus_Jakarta_Sans({ 
	subsets: ["latin"],
	variable: "--font-plus-jakarta"
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

	return (
		<html lang={storeConfig.localization.defaultLocale.split("-")[0]} className="min-h-dvh">
			<body className={`${fontVariables} ${inter.className} min-h-dvh`}>
				<StoreConfigProvider>
					<WishlistProvider>
						<ToastProvider>
							{children}
							<ToastContainer />
							<Suspense>
								<DraftModeNotification />
							</Suspense>
						</ToastProvider>
					</WishlistProvider>
				</StoreConfigProvider>
			</body>
		</html>
	);
}
