import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Text, Button, Checkbox, Input } from "@saleor/macaw-ui";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";

import { AppLayout } from "@/modules/ui/app-layout";
import { SectionCard } from "@/modules/ui/section-card";
import { SelectField, FormField } from "@/modules/ui/form-field";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { HomepageSchema, DEFAULT_SECTION_ORDER } from "@/modules/config/schema";
import type { StorefrontConfig, HomepageSectionId } from "@/modules/config/schema";

type HomepageFormData = StorefrontConfig["homepage"];

// Section display names for the ordering UI
const SECTION_LABELS: Record<HomepageSectionId, { label: string; icon: string }> = {
  hero: { label: "Hero Banner", icon: "🎬" },
  featuredCategories: { label: "Featured Categories", icon: "📂" },
  newArrivals: { label: "New Arrivals", icon: "✨" },
  bestSellers: { label: "Best Sellers", icon: "🏆" },
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
    return <Box display="flex" justifyContent="center" alignItems="center" height="100vh"><Text>Loading...</Text></Box>;
  }

  return (
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="homepage">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Hero Section - Enhanced */}
        <SectionCard 
          title="🎬 Hero Section" 
          description="The main banner area at the top of your homepage - supports images, videos, or sliders"
        >
          <Box display="flex" alignItems="center" gap={3} marginBottom={4} paddingBottom={4} borderBottomWidth={1} borderBottomStyle="solid" borderColor="default2">
            <Controller
              name="sections.hero.enabled"
              control={control}
              render={({ field }) => (
                <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
              )}
            />
            <Box>
              <Text variant="bodyStrong">Enable Hero Section</Text>
              <Text variant="caption" color="default2">Show hero banner on homepage</Text>
            </Box>
          </Box>

          {heroEnabled && (
            <>
              {/* Hero Type Selection */}
              <Box marginBottom={4}>
                <Text variant="bodyStrong" marginBottom={2}>Hero Type</Text>
                <Box display="flex" gap={3}>
                  {(["image", "video", "slider"] as const).map((type) => (
                    <Controller
                      key={type}
                      name="sections.hero.type"
                      control={control}
                      render={({ field }) => (
                        <Box
                          padding={4}
                          borderRadius={4}
                          borderWidth={1}
                          borderStyle="solid"
                          borderColor={field.value === type ? "accent1" : "default2"}
                          backgroundColor={field.value === type ? "accent1Pressed" : "default1"}
                          cursor="pointer"
                          onClick={() => field.onChange(type)}
                          __flex="1"
                          __textAlign="center"
                        >
                          <Text variant="bodyStrong">
                            {type === "image" && "🖼️ Static Image"}
                            {type === "video" && "🎥 Video"}
                            {type === "slider" && "🎠 Image Slider"}
                          </Text>
                          <Text variant="caption" color="default2" display="block" marginTop={1}>
                            {type === "image" && "Single hero image"}
                            {type === "video" && "Background video loop"}
                            {type === "slider" && "Multiple rotating slides"}
                          </Text>
                        </Box>
                      )}
                    />
                  ))}
                </Box>
              </Box>

              {/* Content Fields */}
              <Box marginBottom={4} padding={4} backgroundColor="default1" borderRadius={4}>
                <Text variant="bodyStrong" marginBottom={3}>Hero Content</Text>
                <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
                  <FormField label="Title" name="sections.hero.title" register={register} placeholder="Welcome to Our Store" />
                  <FormField label="Subtitle" name="sections.hero.subtitle" register={register} placeholder="Discover amazing products" />
                  <FormField label="CTA Button Text" name="sections.hero.ctaText" register={register} placeholder="Shop Now" />
                  <FormField label="CTA Button Link" name="sections.hero.ctaLink" register={register} placeholder="/products" />
                </Box>
                <Box display="grid" __gridTemplateColumns="1fr 1fr 1fr" gap={4} marginTop={4}>
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
                </Box>
              </Box>

              {/* Media Configuration based on type */}
              {heroType === "image" && (
                <Box padding={4} backgroundColor="default1" borderRadius={4}>
                  <Text variant="bodyStrong" marginBottom={3}>🖼️ Image Settings</Text>
                  <FormField 
                    label="Image URL" 
                    name="sections.hero.imageUrl" 
                    register={register} 
                    type="url"
                    placeholder="https://example.com/hero.jpg"
                    description="Enter the URL of your hero image (recommended: 1920x800px)"
                  />
                </Box>
              )}

              {heroType === "video" && (
                <Box padding={4} backgroundColor="default1" borderRadius={4}>
                  <Text variant="bodyStrong" marginBottom={3}>🎥 Video Settings</Text>
                  <FormField 
                    label="Video URL" 
                    name="sections.hero.videoUrl" 
                    register={register} 
                    type="url"
                    placeholder="https://example.com/hero-video.mp4"
                    description="MP4 format recommended. Video will autoplay and loop silently."
                  />
                  <Box marginTop={3}>
                    <FormField 
                      label="Fallback Image URL" 
                      name="sections.hero.imageUrl" 
                      register={register} 
                      type="url"
                      placeholder="https://example.com/hero-fallback.jpg"
                      description="Shown while video loads or on mobile"
                    />
                  </Box>
                </Box>
              )}

              {heroType === "slider" && (
                <Box padding={4} backgroundColor="default1" borderRadius={4}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={3}>
                    <Text variant="bodyStrong">🎠 Slider Slides</Text>
                    <Button 
                      type="button" 
                      variant="secondary" 
                      size="small"
                      onClick={() => addSlide({
                        imageUrl: "",
                        title: "Slide Title",
                        subtitle: "Slide description",
                        ctaText: "Learn More",
                        ctaLink: "/products",
                      })}
                    >
                      + Add Slide
                    </Button>
                  </Box>
                  
                  {slides.length === 0 && (
                    <Box padding={4} backgroundColor="default2" borderRadius={4} __textAlign="center">
                      <Text color="default2">No slides added yet. Click "Add Slide" to create your first slide.</Text>
                    </Box>
                  )}

                  {slides.map((slide, index) => (
                    <Box 
                      key={slide.id} 
                      padding={4} 
                      marginBottom={3} 
                      borderWidth={1} 
                      borderStyle="solid" 
                      borderColor="default2" 
                      borderRadius={4}
                    >
                      <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={3}>
                        <Text variant="bodyStrong">Slide {index + 1}</Text>
                        <Button type="button" variant="tertiary" size="small" onClick={() => removeSlide(index)}>
                          Remove
                        </Button>
                      </Box>
                      <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={3}>
                        <FormField label="Image URL" name={`sections.hero.slides.${index}.imageUrl`} register={register} type="url" placeholder="https://..." />
                        <FormField label="Title" name={`sections.hero.slides.${index}.title`} register={register} />
                        <FormField label="Subtitle" name={`sections.hero.slides.${index}.subtitle`} register={register} />
                        <FormField label="CTA Text" name={`sections.hero.slides.${index}.ctaText`} register={register} />
                        <FormField label="CTA Link" name={`sections.hero.slides.${index}.ctaLink`} register={register} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </>
          )}
        </SectionCard>

        {/* Product Sections */}
        <SectionCard title="📦 Product Sections" description="Configure which product sections appear and their display limits">
          <Box display="grid" __gridTemplateColumns="1fr 1fr" gap={4}>
            {[
              { key: "featuredCategories", label: "Featured Categories", icon: "📂" },
              { key: "newArrivals", label: "New Arrivals", icon: "✨" },
              { key: "bestSellers", label: "Best Sellers", icon: "🏆" },
              { key: "onSale", label: "On Sale", icon: "🏷️" },
            ].map(({ key, label, icon }) => (
              <Box key={key} borderWidth={1} borderStyle="solid" borderColor="default2" borderRadius={4} padding={4}>
                <Box display="flex" alignItems="center" gap={3} marginBottom={3}>
                  <Controller
                    name={`sections.${key as "featuredCategories" | "newArrivals" | "bestSellers" | "onSale"}.enabled`}
                    control={control}
                    render={({ field }) => (
                      <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
                    )}
                  />
                  <Text variant="bodyStrong">{icon} {label}</Text>
                </Box>
                <FormField 
                  label="Display Limit" 
                  name={`sections.${key}.limit`} 
                  register={register} 
                  type="number" 
                  placeholder="8" 
                />
              </Box>
            ))}
          </Box>
        </SectionCard>

        {/* Additional Sections */}
        <SectionCard title="➕ Additional Sections" description="Other homepage content areas">
          <Box display="flex" flexDirection="column" gap={3}>
            {[
              { key: "featuredBrands", label: "Featured Brands", description: "Display brand logos carousel", icon: "🏢" },
              { key: "testimonials", label: "Testimonials", description: "Customer reviews and testimonials", icon: "💬" },
              { key: "newsletter", label: "Newsletter Signup", description: "Email subscription form", icon: "📧" },
            ].map(({ key, label, description, icon }) => (
              <Box key={key} display="flex" alignItems="center" gap={3} paddingY={3} borderBottomWidth={1} borderBottomStyle="solid" borderColor="default2">
                <Controller
                  name={`sections.${key as "featuredBrands" | "testimonials" | "newsletter"}.enabled`}
                  control={control}
                  render={({ field }) => (
                    <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
                  )}
                />
                <Box>
                  <Text variant="bodyStrong">{icon} {label}</Text>
                  <Text variant="caption" color="default2">{description}</Text>
                </Box>
              </Box>
            ))}

            {/* Instagram Feed - Special case with username */}
            <Box paddingY={3}>
              <Box display="flex" alignItems="center" gap={3} marginBottom={3}>
                <Controller
                  name="sections.instagramFeed.enabled"
                  control={control}
                  render={({ field }) => (
                    <Checkbox checked={field.value === true} onCheckedChange={(checked) => field.onChange(checked)} />
                  )}
                />
                <Box>
                  <Text variant="bodyStrong">📸 Instagram Feed</Text>
                  <Text variant="caption" color="default2">Display Instagram photos from your account</Text>
                </Box>
              </Box>
              <FormField label="Instagram Username" name="sections.instagramFeed.username" register={register} placeholder="@yourstore" />
            </Box>
          </Box>
        </SectionCard>

        {/* Section Ordering */}
        <SectionCard title="🔢 Section Order" description="Drag sections to reorder, or use the up/down buttons">
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
                <Box display="flex" flexDirection="column" gap={2}>
                  {order.map((sectionId: HomepageSectionId, index: number) => {
                    const sectionInfo = SECTION_LABELS[sectionId];
                    return (
                      <Box 
                        key={sectionId}
                        display="flex" 
                        alignItems="center" 
                        gap={3}
                        padding={3}
                        backgroundColor="default1"
                        borderRadius={4}
                        borderWidth={1}
                        borderStyle="solid"
                        borderColor="default2"
                      >
                        <Text variant="bodyStrong" color="default2" __width="30px">
                          {index + 1}.
                        </Text>
                        <Text __flex="1">
                          {sectionInfo?.icon} {sectionInfo?.label || sectionId}
                        </Text>
                        <Box display="flex" gap={1}>
                          <Button
                            type="button"
                            variant="tertiary"
                            size="small"
                            onClick={() => moveSection(index, 'up')}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            type="button"
                            variant="tertiary"
                            size="small"
                            onClick={() => moveSection(index, 'down')}
                            disabled={index === order.length - 1}
                          >
                            ↓
                          </Button>
                        </Box>
                      </Box>
                    );
                  })}
                  <Box marginTop={2}>
                    <Button
                      type="button"
                      variant="tertiary"
                      size="small"
                      onClick={() => field.onChange(DEFAULT_SECTION_ORDER)}
                    >
                      Reset to Default Order
                    </Button>
                  </Box>
                </Box>
              );
            }}
          />
        </SectionCard>

        {/* Save Button */}
        <Box display="flex" justifyContent="flex-end" gap={2} marginTop={4}>
          <Button type="button" variant="secondary" onClick={() => reset(config?.homepage)} disabled={!isDirty}>
            Reset
          </Button>
          <Button type="submit" variant="primary" disabled={!isDirty || saveStatus === "saving"}>
            {saveStatus === "saving" ? "Saving..." : "Save Changes"}
          </Button>
        </Box>

        {saveStatus === "success" && <Text color="success1" marginTop={2}>✓ Changes saved successfully</Text>}
        {saveStatus === "error" && <Text color="critical1" marginTop={2}>Error saving changes. Please try again.</Text>}
      </form>
    </AppLayout>
  );
};

export default HomepagePage;
