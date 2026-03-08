"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { LinkWithChannel } from "../atoms/LinkWithChannel";
import {
	useBranding,
	useStoreInfo,
	useSocialLinks,
	useFooterConfig,
	useFooterText,
	useOrderTrackingText,
	useContentConfig,
	useComponentStyle,
	useComponentClasses,
} from "@/providers/StoreConfigProvider";
import { buildComponentStyle } from "@/config";
import { useNewsletterState } from "@/hooks/useNewsletterState";
import { isAlreadySubscribed, NEWSLETTER_STORAGE_KEY } from "@/lib/newsletter";
import { useToast } from "@/ui/components/Toast/ToastContext";

// Types for menu items from GraphQL
interface MenuItem {
	id: string;
	name: string;
	category?: { slug: string; name: string } | null;
	collection?: { slug: string; name: string } | null;
	page?: { slug: string; title: string } | null;
	url?: string | null;
	children?: MenuItem[] | null;
}

interface FooterClientProps {
	menuItems: MenuItem[];
}

// Social icons map
const socialIcons: Record<string, React.ReactElement> = {
	facebook: (
		<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
			<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
		</svg>
	),
	instagram: (
		<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
			<path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
		</svg>
	),
	twitter: (
		<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
			<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
		</svg>
	),
	youtube: (
		<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
			<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
		</svg>
	),
	tiktok: (
		<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
			<path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
		</svg>
	),
	pinterest: (
		<svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
			<path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/>
		</svg>
	),
};

// Newsletter Footer Section Component
interface NewsletterFooterSectionProps {
	title: string;
	description: string;
	placeholder: string;
	buttonText: string;
	successMessage: string;
	alreadyActiveMessage: string;
	primaryColor: string;
	channel?: string;
}

const NewsletterFooterSection = ({
	title,
	description,
	placeholder,
	buttonText,
	successMessage,
	alreadyActiveMessage,
	primaryColor,
	channel,
}: NewsletterFooterSectionProps) => {
	// Use shared newsletter state hook (synced with homepage)
	const {
		email,
		setEmail,
		status,
		errorMessage,
		mounted,
		handleSubmit,
		clearError,
	} = useNewsletterState();
	const { addToast } = useToast();
	const [shownAlreadyActiveToast, setShownAlreadyActiveToast] = useState(false);

	const onSubmit = (e: React.FormEvent) => handleSubmit(e, "footer", channel);

	// Show toast when status becomes "already_active"
	useEffect(() => {
		if (status === "already_active" && !shownAlreadyActiveToast) {
			addToast(alreadyActiveMessage, "info", 4000);
			setShownAlreadyActiveToast(true);
		}
		// Reset the flag when status changes to something else
		if (status !== "already_active") {
			setShownAlreadyActiveToast(false);
		}
	}, [status, alreadyActiveMessage, addToast, shownAlreadyActiveToast]);

	// Don't render if already subscribed or already active (toast handles the message)
	if (mounted && (status === "already_subscribed" || status === "already_active")) {
		return null;
	}

	return (
		<div>
			<h3 className="text-sm font-semibold text-white">{title}</h3>
			<p className="mt-4 text-sm text-white/60">{description}</p>
			<div className="mt-4">
				{status === "success" ? (
					<div className="rounded-md px-4 py-2 text-sm text-white" style={{ backgroundColor: "rgba(34, 197, 94, 0.2)" }}>
						✓ {successMessage}
					</div>
				) : (
					<form onSubmit={onSubmit} className="flex flex-col gap-2">
						<input
							type="email"
							name="email"
							autoComplete="email"
							value={email}
							onChange={(e) => {
								setEmail(e.target.value);
								clearError();
							}}
							placeholder={placeholder}
							required
							disabled={status === "loading"}
							className="rounded-md border-0 bg-white/10 px-4 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50"
							style={{ 
								backgroundColor: "rgba(255, 255, 255, 0.1)",
							}}
						/>
						{status === "error" && errorMessage && (
							<p className="text-xs text-error-300">{errorMessage}</p>
						)}
						<button
							type="submit"
							disabled={status === "loading"}
							className="rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
							style={{ 
								backgroundColor: primaryColor,
							}}
						>
							{status === "loading" ? "Subscribing..." : buttonText}
						</button>
					</form>
				)}
			</div>
		</div>
	);
};

interface FooterClientPropsWithChannel extends FooterClientProps {
	channel?: string;
}

export function FooterClient({ menuItems, channel }: FooterClientPropsWithChannel) {
	// Use config from context (per-channel)
	const branding = useBranding();
	const store = useStoreInfo();
	const socialLinks = useSocialLinks();
	const footerConfig = useFooterConfig();
	const cdStyle = useComponentStyle("layout.footer");
	const cdClasses = useComponentClasses("layout.footer");
	const footerText = useFooterText();
	const contentConfig = useContentConfig();
	const [imageError, setImageError] = useState(false);
	const [hideNewsletter, setHideNewsletter] = useState(false);
	const currentYear = new Date().getFullYear();

	// Check subscription status on mount and listen for changes
	useEffect(() => {
		// Check initial state
		setHideNewsletter(isAlreadySubscribed());

		// Listen for storage changes (including from useNewsletterState events)
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === NEWSLETTER_STORAGE_KEY) {
				setHideNewsletter(e.newValue === "true");
			}
		};

		// Listen for custom newsletter state changes
		const handleNewsletterChange = () => {
			setHideNewsletter(isAlreadySubscribed());
		};

		window.addEventListener("storage", handleStorageChange);
		window.addEventListener("newsletter:state-change", handleNewsletterChange);

		return () => {
			window.removeEventListener("storage", handleStorageChange);
			window.removeEventListener("newsletter:state-change", handleNewsletterChange);
		};
	}, []);

	// Debug: Log footer config to verify boolean values are correct
	if (process.env.NODE_ENV === "development") {
		console.log("[FooterClient] Footer config:", {
			showBrand: footerConfig.showBrand,
			showMenu: footerConfig.showMenu,
			showContactInfo: footerConfig.showContactInfo,
			showNewsletter: footerConfig.showNewsletter,
			showSocialLinks: footerConfig.showSocialLinks,
		});
	}

	// Filter social links that have URLs
	const activeSocialLinks = Object.entries(socialLinks).filter(([_, url]) => url);

	// Get copyright text - format: "© 2026 Pawzen. All rights reserved."
	const copyrightText = footerConfig.copyrightText || `© ${currentYear} ${store.name}. All rights reserved.`;

	// Get legal links from config - merge enabled/URL from footerConfig with text from footerText
	// Text comes from storefront-control content.footer, URLs and enabled state from footer.legalLinks
	const defaultLegalLinks = {
		trackOrder: { enabled: true, url: "/track-order" },
		privacyPolicy: { enabled: true, url: "/pages/privacy-policy" },
		termsOfService: { enabled: true, url: "/pages/terms-of-service" },
		shippingPolicy: { enabled: true, url: "/pages/shipping-policy" },
		returnPolicy: { enabled: true, url: "/pages/return-policy" },
	};

	const legalLinks = {
		trackOrder: {
			enabled: footerConfig.legalLinks?.trackOrder?.enabled ?? defaultLegalLinks.trackOrder.enabled,
			url: footerConfig.legalLinks?.trackOrder?.url ?? defaultLegalLinks.trackOrder.url,
			text: footerText.trackOrderLink || "Track Order", // Text from storefront-control content
		},
		privacyPolicy: {
			enabled: footerConfig.legalLinks?.privacyPolicy?.enabled ?? defaultLegalLinks.privacyPolicy.enabled,
			url: footerConfig.legalLinks?.privacyPolicy?.url ?? defaultLegalLinks.privacyPolicy.url,
			text: footerText.privacyPolicyLink || "Privacy Policy", // Text from storefront-control content
		},
		termsOfService: {
			enabled: footerConfig.legalLinks?.termsOfService?.enabled ?? defaultLegalLinks.termsOfService.enabled,
			url: footerConfig.legalLinks?.termsOfService?.url ?? defaultLegalLinks.termsOfService.url,
			text: footerText.termsOfServiceLink || "Terms of Service", // Text from storefront-control content
		},
		shippingPolicy: {
			enabled: footerConfig.legalLinks?.shippingPolicy?.enabled ?? defaultLegalLinks.shippingPolicy.enabled,
			url: footerConfig.legalLinks?.shippingPolicy?.url ?? defaultLegalLinks.shippingPolicy.url,
			text: footerText.shippingLink || "Shipping", // Text from storefront-control content
		},
		returnPolicy: {
			enabled: footerConfig.legalLinks?.returnPolicy?.enabled ?? defaultLegalLinks.returnPolicy.enabled,
			url: footerConfig.legalLinks?.returnPolicy?.url ?? defaultLegalLinks.returnPolicy.url,
			text: footerText.returnPolicyLink || "Return Policy", // Text from storefront-control content
		},
	};

	// Check if we have a valid logo URL from config
	const hasLogoUrl = branding.logo && 
		branding.logo !== "/logo.svg" && 
		branding.logo.trim() !== "" &&
		!imageError;

	return (
		<footer
			data-cd="layout-footer"
			className={`border-t ${cdClasses}`}
			style={{
				background: branding.colors.secondary,
				borderColor: `${branding.colors.textMuted}20`,
				...buildComponentStyle("layout.footer", cdStyle),
			}}
		>
			<div className="mx-auto max-w-7xl px-4 lg:px-8">
				{/* Main Footer Content */}
				<div className="grid gap-8 py-16 md:grid-cols-2 lg:grid-cols-4">
					{/* Brand Column (config-driven visibility) */}
					{footerConfig.showBrand && (
						<div className="lg:col-span-1">
							<div 
								className="flex items-center gap-2 text-xl font-bold"
								style={{ color: branding.colors.primary }}
							>
								{hasLogoUrl ? (
									branding.logo.startsWith("http") ? (
										<Image
											src={branding.logo}
											alt={branding.logoAlt || store.name}
											width={32}
											height={32}
											className="h-8 w-auto object-contain"
											onError={() => setImageError(true)}
										/>
									) : (
										<img
											src={branding.logo}
											alt={branding.logoAlt || store.name}
											className="h-8 w-auto object-contain"
											onError={() => setImageError(true)}
										/>
									)
								) : (
									<svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
										<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
									</svg>
								)}
								{store.name}
							</div>
							<p className="mt-4 text-sm text-white/70">
								{store.tagline}
							</p>
							
							{/* Social Links (config-driven) */}
							{footerConfig.showSocialLinks && activeSocialLinks.length > 0 && (
								<div className="mt-6 flex gap-4">
									{activeSocialLinks.map(([platform, url]) => (
										<Link
											key={platform}
											href={url as string}
											target="_blank"
											rel="noopener noreferrer"
											className="text-white/60 transition-colors hover:text-white"
											aria-label={`Follow us on ${platform}`}
										>
											{socialIcons[platform]}
										</Link>
									))}
								</div>
							)}
						</div>
					)}

					{/* Dynamic Menu Links - Managed by Dashboard (config-driven visibility) */}
					{footerConfig.showMenu && menuItems.length > 0 && menuItems.map((item) => (
						<div key={item.id}>
							<h3 className="text-sm font-semibold text-white">{item.name}</h3>
							<ul className="mt-4 space-y-3">
								{item.children?.map((child) => {
									let href = "";
									let label = "";
									
									if (child.category) {
										href = `/categories/${child.category.slug}`;
										label = child.category.name;
									} else if (child.collection) {
										href = `/collections/${child.collection.slug}`;
										label = child.collection.name;
									} else if (child.page) {
										href = `/pages/${child.page.slug}`;
										label = child.page.title;
									} else if (child.url) {
										href = child.url;
										label = child.name;
									}
									
									if (!href) return null;
									
									return (
										<li key={child.id}>
											<LinkWithChannel 
												href={href}
												className="text-sm text-white/60 transition-colors hover:text-white"
											>
												{label}
											</LinkWithChannel>
										</li>
									);
								})}
							</ul>
						</div>
					))}

					{/* Contact Column (config-driven) */}
					{footerConfig.showContactInfo && (
						<div>
							<h3 className="text-sm font-semibold text-white">{footerText.contactUs}</h3>
							<ul className="mt-4 space-y-3 text-sm text-white/60">
								{store.email && (
									<li className="flex items-center gap-2">
										<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
										</svg>
										<a href={`mailto:${store.email}`} className="hover:text-white">
											{store.email}
										</a>
									</li>
								)}
								{store.phone && (
									<li className="flex items-center gap-2">
										<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
										</svg>
										<a href={`tel:${store.phone}`} className="hover:text-white">
											{store.phone}
										</a>
									</li>
								)}
								{store.address && (
									<li className="flex items-start gap-2">
										<svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
										</svg>
										<span>
											{store.address.street}<br />
											{store.address.city}, {store.address.state} {store.address.zip}
										</span>
									</li>
								)}
							</ul>
							{/* Go to Contact Button */}
							<div className="mt-4">
								<LinkWithChannel 
									href="/contact"
									className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
									style={{ 
										backgroundColor: branding.colors.primary,
									}}
								>
									<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
									</svg>
									{footerText.contactUsButton || "Contact Us"}
								</LinkWithChannel>
							</div>
						</div>
					)}

					{/* Newsletter Section (config-driven visibility from storefront-control) - Hidden if already subscribed */}
					{footerConfig.showNewsletter && !hideNewsletter && (
						<NewsletterFooterSection 
							title={footerText.followUsTitle || "Newsletter"}
							description={contentConfig.general.newsletterDescription}
							placeholder={contentConfig.general.newsletterPlaceholder}
							buttonText={contentConfig.general.newsletterButton}
							successMessage={contentConfig.general.newsletterSuccess}
							alreadyActiveMessage={contentConfig.general.newsletterAlreadySubscribed || "You're already subscribed to our newsletter!"}
							primaryColor={branding.colors.primary}
							channel={channel}
						/>
					)}
				</div>

				{/* Bottom Bar — legal links above, copyright (all rights reserved) below */}
				<div className="flex flex-col items-center gap-4 border-t border-white/10 py-8">
					<div className="flex flex-wrap justify-center gap-6 text-sm text-white/60">
						{legalLinks.trackOrder.enabled && (
							<LinkWithChannel href={legalLinks.trackOrder.url} className="hover:text-white">
								{legalLinks.trackOrder.text}
							</LinkWithChannel>
						)}
						{legalLinks.privacyPolicy.enabled && (
							<LinkWithChannel href={legalLinks.privacyPolicy.url} className="hover:text-white">
								{legalLinks.privacyPolicy.text}
							</LinkWithChannel>
						)}
						{legalLinks.termsOfService.enabled && (
							<LinkWithChannel href={legalLinks.termsOfService.url} className="hover:text-white">
								{legalLinks.termsOfService.text}
							</LinkWithChannel>
						)}
						{legalLinks.shippingPolicy.enabled && (
							<LinkWithChannel href={legalLinks.shippingPolicy.url} className="hover:text-white">
								{legalLinks.shippingPolicy.text}
							</LinkWithChannel>
						)}
						{legalLinks.returnPolicy.enabled && (
							<LinkWithChannel href={legalLinks.returnPolicy.url} className="hover:text-white">
								{legalLinks.returnPolicy.text}
							</LinkWithChannel>
						)}
					</div>
					<p className="text-sm text-white/60">
						{copyrightText}
					</p>
				</div>
			</div>
		</footer>
	);
}
