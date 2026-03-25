"use client";

import xss from "xss";
import { useStoreConfig } from "@/providers/StoreConfigProvider";
import { LinkWithChannel } from "@/ui/atoms/LinkWithChannel";
import { type CMSPage } from "@/lib/cms";

interface AboutPageProps {
  /** CMS content from Dashboard > Content > Pages (slug: "about") */
  cmsContent?: CMSPage | null;
}

// Team members (customize per store)
const teamMembers = [
  {
    name: "Alex Thompson",
    role: "Founder & CEO",
    bio: "Former professional athlete with a passion for quality sports gear.",
    image: "/team/alex.jpg",
  },
  {
    name: "Sarah Chen",
    role: "Head of Product",
    bio: "10+ years experience in sports retail and product development.",
    image: "/team/sarah.jpg",
  },
  {
    name: "Marcus Johnson",
    role: "Customer Experience",
    bio: "Dedicated to ensuring every athlete gets the perfect gear.",
    image: "/team/marcus.jpg",
  },
  {
    name: "Emily Rodriguez",
    role: "Operations Director",
    bio: "Logistics expert ensuring fast delivery worldwide.",
    image: "/team/emily.jpg",
  },
];

// Values/Features
const values = [
  {
    icon: "🏆",
    title: "Quality First",
    description: "We partner only with trusted brands that meet our high standards for performance and durability.",
  },
  {
    icon: "🚀",
    title: "Fast Delivery",
    description: "Most orders ship within 24 hours, with express options available for urgent needs.",
  },
  {
    icon: "💯",
    title: "100% Authentic",
    description: "Every product is sourced directly from authorized distributors. No fakes, ever.",
  },
  {
    icon: "🤝",
    title: "Expert Support",
    description: "Our team of athletes and sports enthusiasts is here to help you find the perfect gear.",
  },
];

// Stats
const stats = [
  { value: "50K+", label: "Happy Customers" },
  { value: "500+", label: "Products" },
  { value: "50+", label: "Brands" },
  { value: "98%", label: "Satisfaction Rate" },
];

export function AboutPage({ cmsContent }: AboutPageProps) {
  const { store, branding, pages } = useStoreConfig();

  // Redirect or show message if page is disabled
  if (!pages.aboutUs) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-lg text-neutral-500">This page is not available.</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="relative overflow-hidden py-20 sm:py-32"
        style={{ backgroundColor: branding.colors.secondary }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="aboutGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#aboutGrid)" />
          </svg>
        </div>

        {/* Gradient Orbs */}
        <div 
          className="absolute -right-20 top-20 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: branding.colors.primary }}
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="heading text-4xl font-bold text-white sm:text-5xl md:text-6xl">
              {cmsContent?.title || "Our Story"}
            </h1>
            <p className="mt-6 text-xl text-white/80">
              {cmsContent?.seoDescription || `${store.name} was founded with a simple mission: to provide athletes of all levels
              with the best gear to achieve their goals. We believe everyone deserves
              access to high-quality sports equipment.`}
            </p>
          </div>
          
          {/* CMS Content Section - if content exists from Dashboard */}
          {cmsContent?.content && (
            <div 
              className="prose prose-invert mt-8 max-w-3xl"
              dangerouslySetInnerHTML={{ __html: xss(cmsContent.content) }}
            />
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-b py-12" style={{ borderColor: `${branding.colors.textMuted}20` }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p 
                  className="text-4xl font-bold"
                  style={{ color: branding.colors.primary }}
                >
                  {stat.value}
                </p>
                <p 
                  className="mt-2 text-sm"
                  style={{ color: branding.colors.textMuted }}
                >
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 
                className="heading text-3xl font-bold sm:text-4xl"
                style={{ color: branding.colors.text }}
              >
                Why We Do What We Do
              </h2>
              <p 
                className="mt-6 text-lg leading-relaxed"
                style={{ color: branding.colors.textMuted }}
              >
                We started {store.name} because we were tired of overpriced, low-quality sports gear.
                As athletes ourselves, we know the importance of having equipment you can trust.
              </p>
              <p 
                className="mt-4 text-lg leading-relaxed"
                style={{ color: branding.colors.textMuted }}
              >
                Today, we serve thousands of athletes worldwide, from weekend warriors to
                professional competitors. Our commitment to quality, authenticity, and customer
                service has never wavered.
              </p>
              <div className="mt-8">
                <LinkWithChannel
                  href="/products"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-white transition-all hover:scale-105"
                  style={{ backgroundColor: branding.colors.primary }}
                >
                  Shop Our Collection
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </LinkWithChannel>
              </div>
            </div>
            
            {/* Image Placeholder */}
            <div 
              className="relative aspect-square overflow-hidden"
              style={{ 
                borderRadius: `var(--store-radius)`,
                backgroundColor: branding.colors.surface,
              }}
            >
              <div 
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(135deg, ${branding.colors.primary}30 0%, ${branding.colors.accent}30 100%)`,
                }}
              />
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div 
                    className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${branding.colors.primary}20` }}
                  >
                    <svg 
                      className="h-10 w-10" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke={branding.colors.primary}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p style={{ color: branding.colors.textMuted }}>About Image</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section 
        className="py-20"
        style={{ backgroundColor: branding.colors.surface }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 
              className="heading text-3xl font-bold sm:text-4xl"
              style={{ color: branding.colors.text }}
            >
              What Sets Us Apart
            </h2>
            <p 
              className="mt-4 text-lg"
              style={{ color: branding.colors.textMuted }}
            >
              Our commitment to excellence in everything we do
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div 
                key={value.title}
                className="text-center"
              >
                <div className="text-4xl">{value.icon}</div>
                <h3 
                  className="mt-4 text-lg font-semibold"
                  style={{ color: branding.colors.text }}
                >
                  {value.title}
                </h3>
                <p 
                  className="mt-2 text-sm"
                  style={{ color: branding.colors.textMuted }}
                >
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 
              className="heading text-3xl font-bold sm:text-4xl"
              style={{ color: branding.colors.text }}
            >
              Meet Our Team
            </h2>
            <p 
              className="mt-4 text-lg"
              style={{ color: branding.colors.textMuted }}
            >
              Passionate athletes dedicated to your success
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {teamMembers.map((member) => (
              <div 
                key={member.name}
                className="text-center"
              >
                {/* Avatar */}
                <div 
                  className="mx-auto flex h-24 w-24 items-center justify-center rounded-full text-2xl font-bold text-white"
                  style={{ backgroundColor: branding.colors.primary }}
                >
                  {member.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h3 
                  className="mt-4 font-semibold"
                  style={{ color: branding.colors.text }}
                >
                  {member.name}
                </h3>
                <p 
                  className="text-sm font-medium"
                  style={{ color: branding.colors.primary }}
                >
                  {member.role}
                </p>
                <p 
                  className="mt-2 text-sm"
                  style={{ color: branding.colors.textMuted }}
                >
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        className="py-20"
        style={{ backgroundColor: branding.colors.secondary }}
      >
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="heading text-3xl font-bold text-white sm:text-4xl">
            Ready to Get Started?
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Browse our collection of premium sports gear and find your perfect equipment.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <LinkWithChannel
              href="/products"
              className="inline-flex items-center gap-2 rounded-full px-8 py-4 font-semibold text-white transition-all hover:scale-105"
              style={{ backgroundColor: branding.colors.primary }}
            >
              Shop Now
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </LinkWithChannel>
            <LinkWithChannel
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 px-8 py-4 font-semibold text-white transition-all hover:bg-white/10"
            >
              Contact Us
            </LinkWithChannel>
          </div>
        </div>
      </section>
    </main>
  );
}

