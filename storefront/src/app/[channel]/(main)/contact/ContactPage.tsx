"use client";

import { useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useStoreConfig, useBranding, useStoreInfo, useContactText, useFooterConfig } from "@/providers/StoreConfigProvider";

// Social icons map (same as FooterClient)
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

export function ContactPage() {
  const params = useParams();
  const channel = (params?.channel as string) || "usd"; // Fallback to default channel
  const { store, branding, pages, integrations } = useStoreConfig();
  const brandingConfig = useBranding();
  const storeInfo = useStoreInfo();
  const contactText = useContactText();
  const footerConfig = useFooterConfig();
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Check if we have a valid logo URL from config
  const hasLogoUrl = brandingConfig.logo && 
    brandingConfig.logo !== "/logo.svg" && 
    brandingConfig.logo.trim() !== "" &&
    !imageError;

  // Redirect or show message if page is disabled
  if (!pages.contact) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-lg text-neutral-500">This page is not available.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);
    
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel,
          name: formState.name,
          email: formState.email,
          subject: formState.subject,
          message: formState.message,
        }),
      });

      const data = (await response.json()) as { success?: boolean; error?: string };

      if (!response.ok || !data.success) {
        setErrorMessage(data.error ?? "Failed to send message. Please try again.");
        setStatus("error");
        return;
      }

      setStatus("success");
      setFormState({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      console.error("Contact form submission error:", error);
      setErrorMessage("An error occurred. Please try again later.");
      setStatus("error");
    }
  };

  // Get FAQs from config or use defaults
  const faqs = contactText.faqs && contactText.faqs.length > 0 
    ? contactText.faqs 
    : [
        {
          question: "What are your shipping times?",
          answer: "Most orders ship within 24 hours. Standard delivery takes 3-5 business days, and express delivery takes 1-2 business days.",
        },
        {
          question: "Do you offer international shipping?",
          answer: "Yes! We ship worldwide. International delivery typically takes 7-14 business days depending on the destination.",
        },
        {
          question: "What is your return policy?",
          answer: "We offer a 30-day return policy on all unused items in original packaging. Returns are free within the continental US.",
        },
      ];

  const contactMethods = [
    ...(footerConfig.showFooterEmail !== false ? [{
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      label: contactText.emailLabel,
      value: store.email,
      href: `mailto:${store.email}`,
    }] : []),
    ...(footerConfig.showFooterPhone !== false ? [{
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      label: contactText.phoneLabel,
      value: store.phone,
      href: `tel:${store.phone}`,
    }] : []),
    ...(footerConfig.showFooterAddress !== false ? [{
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: contactText.addressLabel,
      value: store.address
        ? `${store.address.street}, ${store.address.city}, ${store.address.state} ${store.address.zip}`
        : "Address not available",
      href: store.address
        ? `https://maps.google.com/?q=${encodeURIComponent(`${store.address.street}, ${store.address.city}, ${store.address.state} ${store.address.zip}`)}`
        : "#",
    }] : []),
  ];

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative overflow-hidden py-20"
        style={{ backgroundColor: branding.colors.secondary }}
      >
        <div 
          className="absolute -right-20 top-20 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: branding.colors.primary }}
        />
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="flex flex-col items-center text-center">
              {/* Store Logo - directly above title */}
              {hasLogoUrl && (
                <div className="mb-4 flex items-center justify-center">
                  {brandingConfig.logo.startsWith("http") ? (
                    <Image
                      src={brandingConfig.logo}
                      alt={brandingConfig.logoAlt || storeInfo.name}
                      width={120}
                      height={120}
                      className="h-20 w-auto object-contain"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <img
                      src={brandingConfig.logo}
                      alt={brandingConfig.logoAlt || storeInfo.name}
                      className="h-20 w-auto object-contain"
                      onError={() => setImageError(true)}
                    />
                  )}
                </div>
              )}
              <h1 className="heading text-4xl font-bold text-white sm:text-5xl">
                {contactText.heroTitle}
              </h1>
              <p className="mt-6 text-xl text-white/80">
                {contactText.heroDescription}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      {contactMethods.length > 0 && (
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={`grid gap-8 ${contactMethods.length === 1 ? "md:grid-cols-1 max-w-md mx-auto" : contactMethods.length === 2 ? "md:grid-cols-2 max-w-2xl mx-auto" : "md:grid-cols-3"}`}>
            {contactMethods.map((method) => (
              <a
                key={method.label}
                href={method.href}
                target={method.label === contactText.addressLabel ? "_blank" : undefined}
                rel={method.label === contactText.addressLabel ? "noopener noreferrer" : undefined}
                className="group flex items-start gap-4 rounded-xl p-6 transition-all hover:shadow-lg"
                style={{ 
                  backgroundColor: branding.colors.surface,
                  border: `1px solid ${branding.colors.textMuted}20`,
                }}
              >
                <div 
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full transition-colors"
                  style={{ 
                    backgroundColor: `${branding.colors.primary}15`,
                    color: branding.colors.primary,
                  }}
                >
                  {method.icon}
                </div>
                <div>
                  <h3 
                    className="font-semibold"
                    style={{ color: branding.colors.text }}
                  >
                    {method.label}
                  </h3>
                  <p 
                    className="mt-1 text-sm transition-colors group-hover:underline"
                    style={{ color: branding.colors.textMuted }}
                  >
                    {method.value}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* Contact Form & FAQs */}
      <section className="py-16" style={{ backgroundColor: branding.colors.surface }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2">
            {/* Contact Form */}
            <div>
              <h2 
                className="heading text-2xl font-bold sm:text-3xl"
                style={{ color: branding.colors.text }}
              >
                {contactText.formTitle}
              </h2>
              <p 
                className="mt-2"
                style={{ color: branding.colors.textMuted }}
              >
                {contactText.formDescription}
              </p>

              {status === "success" ? (
                <div 
                  className="mt-8 rounded-xl p-8 text-center"
                  style={{ backgroundColor: `${branding.colors.success}15` }}
                >
                  <div 
                    className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${branding.colors.success}20` }}
                  >
                    <svg 
                      className="h-8 w-8" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke={branding.colors.success}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: branding.colors.success }}
                  >
                    {contactText.successTitle}
                  </h3>
                  <p 
                    className="mt-2"
                    style={{ color: branding.colors.textMuted }}
                  >
                    {contactText.successDescription}
                  </p>
                  <button
                    onClick={() => setStatus("idle")}
                    className="mt-4 text-sm font-medium underline"
                    style={{ color: branding.colors.primary }}
                  >
                    {contactText.sendAnotherMessage}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label 
                        htmlFor="name" 
                        className="block text-sm font-medium"
                        style={{ color: branding.colors.text }}
                      >
                        {contactText.nameLabel}
                      </label>
                      <input
                        type="text"
                        id="name"
                        required
                        value={formState.name}
                        onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                        className="mt-2 w-full rounded-lg border px-4 py-3 transition-colors focus:outline-none focus:ring-2"
                        style={{ 
                          borderColor: `${branding.colors.textMuted}30`,
                          backgroundColor: branding.colors.background,
                        }}
                        placeholder={contactText.namePlaceholder}
                      />
                    </div>
                    <div>
                      <label 
                        htmlFor="email" 
                        className="block text-sm font-medium"
                        style={{ color: branding.colors.text }}
                      >
                        {contactText.emailLabelForm}
                      </label>
                      <input
                        type="email"
                        id="email"
                        required
                        value={formState.email}
                        onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                        className="mt-2 w-full rounded-lg border px-4 py-3 transition-colors focus:outline-none focus:ring-2"
                        style={{ 
                          borderColor: `${branding.colors.textMuted}30`,
                          backgroundColor: branding.colors.background,
                        }}
                        placeholder={contactText.emailPlaceholder}
                      />
                    </div>
                  </div>
                  <div>
                    <label 
                      htmlFor="subject" 
                      className="block text-sm font-medium"
                      style={{ color: branding.colors.text }}
                    >
                      {contactText.subjectLabel}
                    </label>
                    <input
                      type="text"
                      id="subject"
                      required
                      value={formState.subject}
                      onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                      className="mt-2 w-full rounded-lg border px-4 py-3 transition-colors focus:outline-none focus:ring-2"
                      style={{ 
                        borderColor: `${branding.colors.textMuted}30`,
                        backgroundColor: branding.colors.background,
                      }}
                      placeholder={contactText.subjectPlaceholder}
                    />
                  </div>
                  <div>
                    <label 
                      htmlFor="message" 
                      className="block text-sm font-medium"
                      style={{ color: branding.colors.text }}
                    >
                      {contactText.messageLabel}
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      required
                      value={formState.message}
                      onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                      className="mt-2 w-full resize-none rounded-lg border px-4 py-3 transition-colors focus:outline-none focus:ring-2"
                      style={{ 
                        borderColor: `${branding.colors.textMuted}30`,
                        backgroundColor: branding.colors.background,
                      }}
                      placeholder={contactText.messagePlaceholder}
                    />
                  </div>
                  {status === "error" && errorMessage && (
                    <div 
                      className="rounded-lg p-4"
                      style={{ backgroundColor: `${branding.colors.error}15` }}
                    >
                      <p 
                        className="text-sm"
                        style={{ color: branding.colors.error }}
                      >
                        {errorMessage}
                      </p>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full rounded-lg py-4 font-semibold text-white transition-all hover:opacity-90 disabled:opacity-70"
                    style={{ backgroundColor: branding.colors.primary }}
                  >
                    {status === "loading" ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {contactText.sendingButton}
                      </span>
                    ) : (
                      contactText.sendButton
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Quick FAQs */}
            <div>
              <h2 
                className="heading text-2xl font-bold sm:text-3xl"
                style={{ color: branding.colors.text }}
              >
                {contactText.faqsTitle}
              </h2>
              <p 
                className="mt-2"
                style={{ color: branding.colors.textMuted }}
              >
                {contactText.faqsDescription}
              </p>

              <div className="mt-8 space-y-6">
                {faqs.map((faq) => (
                  <div 
                    key={faq.question}
                    className="rounded-xl p-6"
                    style={{ 
                      backgroundColor: branding.colors.background,
                      border: `1px solid ${branding.colors.textMuted}20`,
                    }}
                  >
                    <h3 
                      className="font-semibold"
                      style={{ color: branding.colors.text }}
                    >
                      {faq.question}
                    </h3>
                    <p 
                      className="mt-2 text-sm"
                      style={{ color: branding.colors.textMuted }}
                    >
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <a
                  href="/faq"
                  className="inline-flex items-center gap-2 font-medium"
                  style={{ color: branding.colors.primary }}
                >
                  {contactText.viewAllFaqs}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Links */}
      {Object.values(integrations.social).some(Boolean) && (
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 
              className="heading text-2xl font-bold"
              style={{ color: branding.colors.text }}
            >
              {contactText.followUsTitle}
            </h2>
            <p 
              className="mt-2"
              style={{ color: branding.colors.textMuted }}
            >
              {contactText.followUsDescription}
            </p>
            <div className="mt-8 flex justify-center gap-6">
              {Object.entries(integrations.social)
                .filter(([_, url]) => url)
                .map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 w-12 items-center justify-center rounded-full transition-all hover:scale-110"
                    style={{ 
                      backgroundColor: `${branding.colors.primary}15`,
                      color: branding.colors.primary,
                    }}
                    aria-label={`Follow us on ${platform}`}
                  >
                    {socialIcons[platform.toLowerCase()] || (
                      <span className="capitalize">{platform[0]}</span>
                    )}
                  </a>
                ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

