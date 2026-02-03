import React from "react";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";

import { AppLayout } from "@/modules/ui/app-layout";
import { SectionCard } from "@/modules/ui/section-card";
import { SelectField, FormField } from "@/modules/ui/form-field";
import { StickySaveBar } from "@/modules/ui/sticky-save-bar";
import { BackgroundFields } from "@/modules/ui/background-fields";
import { CardStyleFields } from "@/modules/ui/card-style-fields";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { HomepageSchema, DEFAULT_SECTION_ORDER } from "@/modules/config/schema";
import type { StorefrontConfig, HomepageSectionId } from "@/modules/config/schema";

type HomepageFormData = StorefrontConfig["homepage"];

// Section display names for the ordering UI
const SECTION_LABELS: Record<HomepageSectionId, { label: string; icon: string }> = {
  hero: { label: "Hero Banner", icon: "🎬" },
  marquee: { label: "Marquee Banner", icon: "📢" },
  featuredCategories: { label: "Featured Categories", icon: "📂" },
  newArrivals: { label: "New Arrivals", icon: "✨" },
  bestSellers: { label: "Best Sellers", icon: "🏆" },
  feature: { label: "Feature Collection", icon: "⭐" },
  onSale: { label: "On Sale", icon: "🏷️" },
  featuredBrands: { label: "Featured Brands", icon: "🏢" },
  testimonials: { label: "Testimonials", icon: "💬" },
  newsletter: { label: "Newsletter", icon: "📧" },
  instagramFeed: { label: "Instagram Feed", icon: "📸" },
};

const HomepagePage: NextPage = () => {
  const router = useRouter();
  const { channelSlug } = router.query as { channelSlug: string };
  const { appBridgeState } = useAppBridge();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const { data: config, isLoading } = trpcClient.config.getConfig.useQuery(
    { channelSlug },
    { enabled: !!channelSlug && !!appBridgeState?.ready }
  );

  const utils = trpcClient.useUtils();
  const updateMutation = trpcClient.config.updateSection.useMutation();

  const { control, register, handleSubmit, reset, watch, formState: { isDirty } } = useForm<HomepageFormData>({
    resolver: zodResolver(HomepageSchema),
  });

  const { fields: slides, append: addSlide, remove: removeSlide } = useFieldArray({
    control,
    name: "sections.hero.slides",
  });

  const heroType = watch("sections.hero.type");
  const heroEnabled = watch("sections.hero.enabled");

  useEffect(() => {
    if (config?.homepage) {
      reset(config.homepage);
    }
  }, [config, reset]);

  const onSubmit = async (data: HomepageFormData) => {
    setSaveStatus("saving");
    try {
      await updateMutation.mutateAsync({ channelSlug, section: "homepage", data });
      await utils.config.getConfig.invalidate({ channelSlug });
      reset(data);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
    }
  };

  if (!appBridgeState?.ready || isLoading) {
    return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}><span>Loading...</span></div>;
  }

  return (
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="homepage">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Hero Section - Enhanced */}
        <SectionCard 
          id="homepage-hero"
          title="Hero Section" 
          description="The main banner area at the top of your homepage - supports images, videos, or sliders"
          keywords={["hero", "banner", "cta", "slides"]}
          icon="🎬"
        >

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid #ddd" }}>
            <Controller
              name="sections.hero.enabled"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={field.value === true}
                  onChange={(e) => field.onChange(e.target.checked)}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
              )}
            />
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "4px" }}>Enable Hero Section</label>
              <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>Show hero banner on homepage</p>
            </div>
          </div>

          {heroEnabled && (
            <>
              {/* Hero Type Selection */}
              <div style={{ marginBottom: "24px" }}>
                <p style={{ fontSize: "14px", fontWeight: "500", marginBottom: "16px" }}>Hero Type</p>
                <div style={{ display: "flex", gap: "12px" }}>
                  {(["image", "video", "slider"] as const).map((type) => (
                    <Controller
                      key={type}
                      name="sections.hero.type"
                      control={control}
                      render={({ field }) => (
                        <div
                          style={{
                            padding: "16px",
                            border: `1px solid ${field.value === type ? "#2563EB" : "#ddd"}`,
                            backgroundColor: field.value === type ? "#E3F2FD" : "#fff",
                            cursor: "pointer",
                            flex: 1,
                            textAlign: "center"
                          }}
                          onClick={() => field.onChange(type)}
                        >
                          <p style={{ fontSize: "14px", fontWeight: "500", margin: "0 0 4px 0" }}>
                            {type === "image" && "🖼️ Static Image"}
                            {type === "video" && "🎥 Video"}
                            {type === "slider" && "🎠 Image Slider"}
                          </p>
                          <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>
                            {type === "image" && "Single hero image"}
                            {type === "video" && "Background video loop"}
                            {type === "slider" && "Multiple rotating slides"}
                          </p>
                        </div>
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Content Fields */}
              <div style={{ marginBottom: "24px", padding: "16px", backgroundColor: "#fff", border: "1px solid #ddd" }}>
                <p style={{ fontSize: "14px", fontWeight: "500", marginBottom: "16px" }}>Hero Content</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <FormField label="Title" name="sections.hero.title" register={register} placeholder="Welcome to Our Store" />
                  <FormField label="Subtitle" name="sections.hero.subtitle" register={register} placeholder="Discover amazing products" />
                  <FormField 
                    label="Badge Text" 
                    name="sections.hero.badgeText" 
                    register={register} 
                    placeholder="New Season Collection"
                    description="Badge text shown above title (leave empty to hide badge)"
                  />
                  <FormField label="CTA Button Text" name="sections.hero.ctaText" register={register} placeholder="Shop Now" />
                  <FormField label="CTA Button Link" name="sections.hero.ctaLink" register={register} placeholder="/products" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginTop: "24px" }}>
                  <SelectField
                    label="Text Alignment"
                    name="sections.hero.textAlignment"
                    register={register}
                    options={[
                      { value: "left", label: "Left" },
                      { value: "center", label: "Center" },
                      { value: "right", label: "Right" },
                    ]}
                  />
                  <FormField 
                    label="Overlay Opacity (%)" 
                    name="sections.hero.overlayOpacity" 
                    register={register} 
                    type="number" 
                    placeholder="40"
                    description="0 = transparent, 100 = solid"
                  />
                </div>
              </div>

              {/* Media Configuration based on type */}
              {heroType === "image" && (
                <div style={{ padding: "16px", backgroundColor: "#fff", border: "1px solid #ddd" }}>
                  <p style={{ fontSize: "14px", fontWeight: "500", marginBottom: "16px" }}>🖼️ Image Settings</p>
                  <FormField 
                    label="Image URL" 
                    name="sections.hero.imageUrl" 
                    register={register} 
                    type="url"
                    placeholder="https://example.com/hero.jpg"
                    description="Enter the URL of your hero image (recommended: 1920x800px)"
                  />
                </div>
              )}

              {heroType === "video" && (
                <div style={{ padding: "16px", backgroundColor: "#fff", border: "1px solid #ddd" }}>
                  <p style={{ fontSize: "14px", fontWeight: "500", marginBottom: "16px" }}>🎥 Video Settings</p>
                  <FormField 
                    label="Video URL" 
                    name="sections.hero.videoUrl" 
                    register={register} 
                    type="url"
                    placeholder="https://example.com/hero-video.mp4"
                    description="MP4 format recommended. Video will autoplay and loop silently."
                  />
                  <div style={{ marginTop: "16px" }}>
                    <FormField 
                      label="Fallback Image URL" 
                      name="sections.hero.imageUrl" 
                      register={register} 
                      type="url"
                      placeholder="https://example.com/hero-fallback.jpg"
                      description="Shown while video loads or on mobile"
                    />
                  </div>
                </div>
              )}

              {heroType === "slider" && (
                <div style={{ padding: "16px", backgroundColor: "#fff", border: "1px solid #ddd" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <p style={{ fontSize: "14px", fontWeight: "500", margin: 0 }}>🎠 Slider Slides</p>
                    <button 
                      type="button" 
                      onClick={() => addSlide({
                        imageUrl: "",
                        title: "Slide Title",
                        subtitle: "Slide description",
                        ctaText: "Learn More",
                        ctaLink: "/products",
                      })}
                      style={{
                        padding: "8px 16px",
                        border: "1px solid #ddd",
                        backgroundColor: "#fff",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      + Add Slide
                    </button>
                  </div>
                  
                  {slides.length === 0 && (
                    <div style={{ padding: "16px", backgroundColor: "#f5f5f5", textAlign: "center" }}>
                      <p style={{ color: "#666", margin: 0 }}>No slides added yet. Click "Add Slide" to create your first slide.</p>
                    </div>
                  )}

                  {slides.map((slide, index) => (
                    <div 
                      key={slide.id} 
                      style={{ 
                        padding: "16px", 
                        marginBottom: "16px", 
                        border: "1px solid #ddd", 
                        backgroundColor: "#fff"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <p style={{ fontSize: "14px", fontWeight: "500", margin: 0 }}>Slide {index + 1}</p>
                        <button 
                          type="button" 
                          onClick={() => removeSlide(index)}
                          style={{
                            padding: "6px 12px",
                            border: "1px solid #ddd",
                            backgroundColor: "#fff",
                            cursor: "pointer",
                            fontSize: "13px"
                          }}
                        >
                          Remove
                        </button>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <FormField label="Image URL" name={`sections.hero.slides.${index}.imageUrl`} register={register} type="url" placeholder="https://..." />
                        <FormField label="Title" name={`sections.hero.slides.${index}.title`} register={register} />
                        <FormField label="Subtitle" name={`sections.hero.slides.${index}.subtitle`} register={register} />
                        <FormField label="CTA Text" name={`sections.hero.slides.${index}.ctaText`} register={register} />
                        <FormField label="CTA Link" name={`sections.hero.slides.${index}.ctaLink`} register={register} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </SectionCard>

        {/* Marquee Section */}
        <SectionCard
          id="homepage-marquee"
          title="Marquee Banner"
          description="Scrolling text banner for announcements"
          keywords={["marquee", "banner", "announcement", "scroll"]}
          icon="📢"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid #ddd" }}>
            <Controller
              name="sections.marquee.enabled"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={field.value === true}
                  onChange={(e) => field.onChange(e.target.checked)}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
              )}
            />
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "4px" }}>Enable Marquee</label>
              <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>Show scrolling text banner</p>
            </div>
          </div>

          <div style={{ padding: "16px", backgroundColor: "#fff", border: "1px solid #ddd" }}>
            <FormField 
              label="Text" 
              name="sections.marquee.text" 
              register={register} 
              placeholder="Free shipping • Sale now on"
              description="Use • to separate items"
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
              <FormField 
                label="Speed (seconds)" 
                name="sections.marquee.speedSeconds" 
                register={register} 
                type="number" 
                placeholder="20"
              />
              <FormField 
                label="Text Color" 
                name="sections.marquee.textColor" 
                register={register} 
                placeholder="#000000" 
              />
            </div>
            
            <BackgroundFields 
              basePath="sections.marquee.background" 
              register={register} 
              control={control} 
              watch={watch}
            />
          </div>
        </SectionCard>

        {/* Product Sections */ }
        <SectionCard
          id="homepage-products"
          title="Product Sections"
          description="Configure which product sections appear and their display limits"
          keywords={["new arrivals", "best sellers", "on sale", "featured"]}
          icon="📦"
        >

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            {[
              { key: "featuredCategories", label: "Featured Categories", icon: "📂" },
              { key: "newArrivals", label: "New Arrivals", icon: "✨" },
              { key: "bestSellers", label: "Best Sellers", icon: "🏆" },
              { key: "onSale", label: "On Sale", icon: "🏷️" },
            ].map(({ key, label, icon }) => (
              <div key={key} style={{ border: "1px solid #ddd", padding: "16px", backgroundColor: "#fff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <Controller
                    name={`sections.${key as "featuredCategories" | "newArrivals" | "bestSellers" | "onSale"}.enabled`}
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value === true}
                        onChange={(e) => field.onChange(e.target.checked)}
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                      />
                    )}
                  />
                  <p style={{ fontSize: "14px", fontWeight: "500", margin: 0 }}>{icon} {label}</p>
                </div>
                <FormField 
                  label="Display Limit" 
                  name={(`sections.${key}.limit`) as never} 
                  register={register} 
                  type="number" 
                  placeholder="8"
                />
                
                <BackgroundFields 
                  basePath={`sections.${key}.background`} 
                  register={register} 
                  control={control} 
                  watch={watch}
                />
                
                <CardStyleFields 
                  basePath={`sections.${key}.card`} 
                  register={register} 
                  control={control} 
                  watch={watch}
                />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Feature Section */}
        <SectionCard
          id="homepage-feature"
          title="Feature Section"
          description="Highlight a specific collection or product with image and text"
          keywords={["feature", "highlight", "collection", "image"]}
          icon="⭐"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px", paddingBottom: "24px", borderBottom: "1px solid #ddd" }}>
            <Controller
              name="sections.feature.enabled"
              control={control}
              render={({ field }) => (
                <input
                  type="checkbox"
                  checked={field.value === true}
                  onChange={(e) => field.onChange(e.target.checked)}
                  style={{ width: "18px", height: "18px", cursor: "pointer" }}
                />
              )}
            />
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "500", marginBottom: "4px" }}>Enable Feature Section</label>
              <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>Show featured content block</p>
            </div>
          </div>

          <div style={{ padding: "16px", backgroundColor: "#fff", border: "1px solid #ddd" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <FormField label="Title" name="sections.feature.title" register={register} placeholder="Featured Collection" />
              <FormField label="Description" name="sections.feature.description" register={register} placeholder="Discover our best items" />
              <FormField label="CTA Text" name="sections.feature.ctaText" register={register} placeholder="Shop Now" />
              <FormField label="CTA Link" name="sections.feature.ctaLink" register={register} placeholder="/collections/featured" />
            </div>
            <div style={{ marginTop: "16px" }}>
              <FormField label="Image URL" name="sections.feature.imageUrl" register={register} type="url" placeholder="https://..." />
            </div>
            <div style={{ marginTop: "16px" }}>
              <SelectField
                label="Image Position"
                name="sections.feature.imagePosition"
                register={register}
                options={[
                  { value: "left", label: "Left" },
                  { value: "right", label: "Right" },
                ]}
              />
            </div>
            
            <BackgroundFields 
              basePath="sections.feature.background" 
              register={register} 
              control={control} 
              watch={watch}
            />
            
            <CardStyleFields 
              basePath="sections.feature.card" 
              register={register} 
              control={control} 
              watch={watch}
            />
          </div>
        </SectionCard>

        {/* Additional Sections */}
        <SectionCard
          id="homepage-additional"
          title="Additional Sections"
          description="Other homepage content areas"
          keywords={["testimonials", "newsletter", "instagram", "brands"]}
        >

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { key: "featuredBrands", label: "Featured Brands", description: "Display brand logos carousel", icon: "🏢" },
              { key: "testimonials", label: "Testimonials", description: "Customer reviews and testimonials", icon: "💬" },
              { key: "newsletter", label: "Newsletter Signup", description: "Email subscription form", icon: "📧" },
            ].map(({ key, label, description, icon }) => (
              <div key={key} style={{ borderBottom: "1px solid #eee" }}> 
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 0" }}>
                  <Controller
                    name={`sections.${key as "featuredBrands" | "testimonials" | "newsletter"}.enabled`}
                    control={control}
                    render={({ field }) => (
                      <input
                        type="checkbox"
                        checked={field.value === true}
                        onChange={(e) => field.onChange(e.target.checked)}
                        style={{ width: "18px", height: "18px", cursor: "pointer" }}
                      />
                    )}
                  />
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: "500", margin: "0 0 4px 0" }}>{icon} {label}</p>
                    <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>{description}</p>
                  </div>
                </div>
                
                <div style={{ marginLeft: "30px", marginBottom: "16px" }}>
                  <BackgroundFields 
                    basePath={`sections.${key}.background`} 
                    register={register} 
                    control={control} 
                    watch={watch}
                  />
                  {(key === "featuredBrands") && (
                    <CardStyleFields 
                      basePath={`sections.${key}.card`} 
                      register={register} 
                      control={control} 
                      watch={watch}
                    />
                  )}
                </div>
              </div>
            ))}

            {/* Instagram Feed - Special case with username */}
            <div style={{ padding: "12px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <Controller
                  name="sections.instagramFeed.enabled"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="checkbox"
                      checked={field.value === true}
                      onChange={(e) => field.onChange(e.target.checked)}
                      style={{ width: "18px", height: "18px", cursor: "pointer" }}
                    />
                  )}
                />
                <div>
                  <p style={{ fontSize: "14px", fontWeight: "500", margin: "0 0 4px 0" }}>📸 Instagram Feed</p>
                  <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>Display Instagram photos from your account</p>
                </div>
              </div>
              <FormField label="Instagram Username" name="sections.instagramFeed.username" register={register} placeholder="@yourstore" />
              <div style={{ marginTop: "16px" }}>
                <BackgroundFields 
                  basePath="sections.instagramFeed.background" 
                  register={register} 
                  control={control} 
                  watch={watch}
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Section Ordering */}
        <SectionCard
          id="homepage-order"
          title="Section Order"
          description="Drag sections to reorder, or use the up/down buttons"
          keywords={["order", "reorder", "layout"]}
          icon="🔢"
        >

          <Controller
            name="sectionOrder"
            control={control}
            defaultValue={DEFAULT_SECTION_ORDER}
            render={({ field }) => {
              const order = field.value || DEFAULT_SECTION_ORDER;
              
              const moveSection = (index: number, direction: 'up' | 'down') => {
                const newOrder = [...order];
                const targetIndex = direction === 'up' ? index - 1 : index + 1;
                if (targetIndex < 0 || targetIndex >= newOrder.length) return;
                [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
                field.onChange(newOrder);
              };

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {order.map((sectionId: HomepageSectionId, index: number) => {
                    const sectionInfo = SECTION_LABELS[sectionId];
                    return (
                      <div 
                        key={sectionId}
                        style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "12px",
                          padding: "12px",
                          backgroundColor: "#fff",
                          border: "1px solid #ddd"
                        }}
                      >
                        <span style={{ fontSize: "14px", fontWeight: "500", color: "#666", width: "30px" }}>
                          {index + 1}.
                        </span>
                        <span style={{ flex: 1, fontSize: "14px" }}>
                          {sectionInfo?.icon} {sectionInfo?.label || sectionId}
                        </span>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            type="button"
                            onClick={() => moveSection(index, 'up')}
                            disabled={index === 0}
                            style={{
                              padding: "6px 12px",
                              border: "1px solid #ddd",
                              backgroundColor: "#fff",
                              cursor: index === 0 ? "not-allowed" : "pointer",
                              opacity: index === 0 ? 0.5 : 1,
                              fontSize: "14px"
                            }}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSection(index, 'down')}
                            disabled={index === order.length - 1}
                            style={{
                              padding: "6px 12px",
                              border: "1px solid #ddd",
                              backgroundColor: "#fff",
                              cursor: index === order.length - 1 ? "not-allowed" : "pointer",
                              opacity: index === order.length - 1 ? 0.5 : 1,
                              fontSize: "14px"
                            }}
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ marginTop: "16px" }}>
                    <button
                      type="button"
                      onClick={() => field.onChange(DEFAULT_SECTION_ORDER)}
                      style={{
                        padding: "8px 16px",
                        border: "1px solid #ddd",
                        backgroundColor: "#fff",
                        cursor: "pointer",
                        fontSize: "14px"
                      }}
                    >
                      Reset to Default Order
                    </button>
                  </div>
                </div>
              );
            }}
          />
        </SectionCard>

        <StickySaveBar
          isDirty={isDirty}
          isLoading={saveStatus === "saving"}
          isSuccess={saveStatus === "success"}
          isError={saveStatus === "error"}
          onReset={() => reset(config?.homepage)}
          onSubmit={handleSubmit(onSubmit)}
        />
      </form>
    </AppLayout>
  );
};

export async function getServerSideProps() {
  return { props: {} };
}

export default HomepagePage;
