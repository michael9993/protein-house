"use client";

import { useState } from "react";
import { useStoreConfig } from "@/providers/StoreConfigProvider";

export function ContactPage() {
  const { store, branding, pages, integrations } = useStoreConfig();
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

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
    
    // Simulate form submission - replace with actual API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStatus("success");
      setFormState({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  const contactMethods = [
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      label: "Email",
      value: store.email,
      href: `mailto:${store.email}`,
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      label: "Phone",
      value: store.phone,
      href: `tel:${store.phone}`,
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: "Address",
      value: store.address 
        ? `${store.address.street}, ${store.address.city}, ${store.address.state} ${store.address.zip}`
        : "Address not available",
      href: store.address 
        ? `https://maps.google.com/?q=${encodeURIComponent(`${store.address.street}, ${store.address.city}, ${store.address.state} ${store.address.zip}`)}`
        : "#",
    },
  ];

  const faqs = [
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
            <h1 className="heading text-4xl font-bold text-white sm:text-5xl">
              Get in Touch
            </h1>
            <p className="mt-6 text-xl text-white/80">
              Have a question or need help? We're here for you. Reach out through
              any of the channels below or fill out the contact form.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-3">
            {contactMethods.map((method) => (
              <a
                key={method.label}
                href={method.href}
                target={method.label === "Address" ? "_blank" : undefined}
                rel={method.label === "Address" ? "noopener noreferrer" : undefined}
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
                Send Us a Message
              </h2>
              <p 
                className="mt-2"
                style={{ color: branding.colors.textMuted }}
              >
                We'll get back to you within 24 hours.
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
                    Message Sent!
                  </h3>
                  <p 
                    className="mt-2"
                    style={{ color: branding.colors.textMuted }}
                  >
                    Thank you for reaching out. We'll be in touch soon.
                  </p>
                  <button
                    onClick={() => setStatus("idle")}
                    className="mt-4 text-sm font-medium underline"
                    style={{ color: branding.colors.primary }}
                  >
                    Send another message
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
                        Your Name
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
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label 
                        htmlFor="email" 
                        className="block text-sm font-medium"
                        style={{ color: branding.colors.text }}
                      >
                        Email Address
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
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label 
                      htmlFor="subject" 
                      className="block text-sm font-medium"
                      style={{ color: branding.colors.text }}
                    >
                      Subject
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
                      placeholder="How can we help?"
                    />
                  </div>
                  <div>
                    <label 
                      htmlFor="message" 
                      className="block text-sm font-medium"
                      style={{ color: branding.colors.text }}
                    >
                      Message
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
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>
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
                        Sending...
                      </span>
                    ) : (
                      "Send Message"
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
                Frequently Asked Questions
              </h2>
              <p 
                className="mt-2"
                style={{ color: branding.colors.textMuted }}
              >
                Find quick answers to common questions.
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
                  View All FAQs
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
              Follow Us
            </h2>
            <p 
              className="mt-2"
              style={{ color: branding.colors.textMuted }}
            >
              Stay connected for updates, tips, and exclusive offers.
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
                  >
                    <span className="capitalize">{platform[0]}</span>
                  </a>
                ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

