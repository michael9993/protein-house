import { zodResolver } from "@hookform/resolvers/zod";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Button, Text } from "@saleor/macaw-ui";
import { Input } from "@saleor/react-hook-form-macaw";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDebounce } from "usehooks-ts";
import { gql, useQuery } from "urql";

import { BasicLayout } from "../../components/basic-layout";
import { CodeEditor } from "../../components/code-editor";
import { TemplatePreview } from "../../components/template-preview";
import { defaultPadding } from "../../components/ui-defaults";
import { GraphQLProvider } from "../../modules/graphql/graphql-provider";
import { trpcClient } from "../../modules/trpc/trpc-client";
import { VariablePicker } from "../../modules/newsletter/templates/variable-picker";
import { ProductEditor, type Product } from "../../modules/newsletter/templates/product-editor";
import { createTemplateInputSchema, updateTemplateInputSchema } from "../../modules/newsletter/templates/template-schema";

// GraphQL query for channels
const ChannelsQuery = gql`
  query Channels {
    channels {
      id
      slug
      name
      isActive
    }
  }
`;

interface Channel {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
}

const PREVIEW_DEBOUNCE_DELAY = 500;

// Type for branding data
interface StoreBranding {
  store: {
    name: string;
    tagline: string;
    email: string;
    phone: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    };
  };
  branding: {
    logo: string;
    logoAlt: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      text: string;
      textMuted: string;
    };
    typography: {
      fontHeading: string;
      fontBody: string;
    };
  };
}

// Function to generate default template with dynamic branding
const generateDefaultTemplate = (branding: StoreBranding) => {
  const { primary, secondary, textMuted } = branding.branding.colors;
  const { fontBody } = branding.branding.typography;
  const storeName = branding.store.name;
  const tagline = branding.store.tagline;
  const city = branding.store.address?.city || "";
  const country = branding.store.address?.country || "";
  const location = [city, country].filter(Boolean).join(", ");
  const year = new Date().getFullYear();
  
  return `<mjml>
  <mj-head>
    <mj-title>{{subject}}</mj-title>
    <mj-preview>Up to 50% off + free shipping over ₪299</mj-preview>

    <mj-attributes>
      <mj-all font-family="${fontBody}, Arial, sans-serif" />
      <mj-text font-size="16px" line-height="24px" color="#111827" />
      <mj-button font-size="16px" font-weight="600" border-radius="12px" padding="14px 22px" />
      <mj-section padding="0px" />
    </mj-attributes>

    <mj-style inline="inline">
      .card { border-radius: 18px; }
      .pill { border-radius: 999px; }
      .muted { color: ${textMuted}; }
      .link { color: ${primary}; text-decoration: none; }
    </mj-style>
  </mj-head>

  <mj-body background-color="#f6f7fb">
    <!-- Top spacer -->
    <mj-section padding="24px 16px 0">
      <mj-column>
        <mj-spacer height="8px" />
      </mj-column>
    </mj-section>

    <!-- Header / Brand -->
    <mj-section padding="0 16px">
      <mj-column background-color="#ffffff" border-radius="18px" padding="22px 20px">
        <mj-image
          src="{{companyLogo}}"
          alt="{{companyName}}"
          align="left"
          width="160px"
          padding="0 0 10px"
        />
        <mj-text font-size="13px" color="${textMuted}" padding="0">
          ${tagline || "New drops • Best sellers • Limited-time deals"}
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Hero -->
    <mj-section padding="14px 16px 0">
      <mj-column background-color="${secondary}" border-radius="18px" padding="26px 22px">
        <mj-text color="#ffffff" font-size="28px" font-weight="800" line-height="34px" padding="0 0 10px">
          Weekend Sale is Live
        </mj-text>
        <mj-text color="#e5e7eb" font-size="16px" line-height="24px" padding="0 0 18px">
          Save up to <b>50%</b> on selected items. Plus <b>free shipping</b> over ₪299.
        </mj-text>

        <mj-button
          background-color="${primary}"
          color="#ffffff"
          href="{{companyWebsite}}"
          align="left"
          padding="0"
        >
          Shop the Sale
        </mj-button>

        <mj-spacer height="14px" />

        <mj-text color="#9ca3af" font-size="12px" line-height="18px" padding="0">
          Use code: <span style="background:#1f2937;color:#fff;padding:4px 10px;border-radius:999px;font-weight:700;">WEEKEND</span>
          &nbsp;•&nbsp; Ends Sunday 23:59
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Feature pills -->
    <mj-section padding="14px 16px 0">
      <mj-column background-color="#ffffff" border-radius="18px" padding="16px 16px">
        <mj-text align="center" font-size="13px" padding="10px 8px">
          🚚 Fast shipping &nbsp;&nbsp;|&nbsp;&nbsp; 🔁 Easy returns &nbsp;&nbsp;|&nbsp;&nbsp; 🔒 Secure checkout
        </mj-text>
      </mj-column>
    </mj-section>

    <!-- Product grid -->
    <mj-section padding="14px 16px 0">
      <mj-column background-color="#ffffff" border-radius="18px" padding="18px 18px">
        <mj-text font-size="18px" font-weight="800" padding="0 0 10px" align="center">
          {{productsTitle}}
        </mj-text>
        <mj-text font-size="13px" color="${textMuted}" padding="0 0 16px" align="center">
          {{productsSubtitle}}
        </mj-text>
        
        <!-- Products displayed as inline-block divs, 2 per row -->
        <mj-raw>
          <div style="text-align:center;font-size:0;">
            {{#each products}}
            <div style="display:inline-block;width:48%;max-width:250px;vertical-align:top;padding:8px;box-sizing:border-box;font-size:14px;text-align:center;">
              <a href="{{this.url}}" style="text-decoration:none;display:block;">
                <img src="{{this.image}}" alt="{{this.name}}" style="width:100%;border-radius:14px;display:block;margin-bottom:8px;" />
              </a>
              <div style="font-weight:700;color:#111827;padding:0 0 4px;font-family:Inter,Arial,sans-serif;">{{this.name}}</div>
              <div style="font-family:Inter,Arial,sans-serif;">
                <span style="color:#111827;font-weight:800;">{{this.price}}</span>
                {{#if this.originalPrice}}<span style="color:#9ca3af;text-decoration:line-through;margin-left:8px;">{{this.originalPrice}}</span>{{/if}}
              </div>
            </div>
            {{/each}}
          </div>
        </mj-raw>

        <mj-button
          background-color="${secondary}"
          color="#ffffff"
          href="{{companyWebsite}}"
          align="center"
          padding="16px 0 0"
        >
          View All Products
        </mj-button>
      </mj-column>
    </mj-section>

    <!-- CTA strip -->
    <mj-section padding="14px 16px 0">
      <mj-column background-color="#ffffff" border-radius="18px" padding="18px 18px">
        <mj-text font-size="18px" font-weight="800" padding="0 0 10px">
          Don't miss it
        </mj-text>
        <mj-text color="${textMuted}" padding="0 0 16px">
          Deals end soon. Grab your favorites before they're gone.
        </mj-text>
        <mj-button background-color="${primary}" color="#ffffff" href="{{companyWebsite}}" padding="0">
          Shop Now
        </mj-button>
      </mj-column>
    </mj-section>

    <!-- Footer -->
    <mj-section padding="14px 16px 24px">
      <mj-column background-color="#ffffff" border-radius="18px" padding="18px 18px">
        <mj-text font-size="13px" color="${textMuted}" padding="0 0 10px">
          You're receiving this email because you subscribed to updates from <b>{{companyName}}</b>.
        </mj-text>

        <mj-text font-size="13px" padding="0 0 6px">
          <a style="color: ${primary}; text-decoration: none;" href="{{companyWebsite}}">Manage preferences</a>
          &nbsp;•&nbsp;
          <a style="color: ${primary}; text-decoration: none;" href="{{unsubscribeUrl}}">Unsubscribe</a>
        </mj-text>

        <mj-text font-size="12px" color="${textMuted}" padding="0">
          {{companyName}}${location ? `, ${location}` : ""} • © ${year}
        </mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;
};

const generateDefaultSubject = (branding: StoreBranding) => 
  `🔥 Weekend Sale - Up to 50% Off at ${branding.store.name}`;

// Helper to generate payload from branding
const generatePayloadFromBranding = (branding: StoreBranding, channelSlug = "ils") => {
  const city = branding.store.address?.city || "";
  const country = branding.store.address?.country || "";
  const location = [city, country].filter(Boolean).join(", ");
  const { secondary } = branding.branding.colors;
  
  // Generate a preview unsubscribe URL (actual URL is generated at send time with real token)
  // This shows the format: {newsletterAppUrl}/api/newsletter/unsubscribe/{token}
  const newsletterAppUrl = typeof window !== "undefined" 
    ? window.location.origin 
    : "https://newsletter-app.example.com";
  const previewUnsubscribeUrl = `${newsletterAppUrl}/api/newsletter/unsubscribe/PREVIEW_TOKEN_REPLACED_AT_SEND_TIME`;
  
  return {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    subject: `Weekend Sale - Up to 50% Off at ${branding.store.name}!`,
    // Note: This is a preview URL. Actual unsubscribe URLs are generated per-subscriber when sending
    unsubscribeUrl: previewUnsubscribeUrl,
    companyName: branding.store.name,
    companyEmail: branding.store.email,
    companyWebsite: "https://example.com",
    companyLogo: branding.branding.logo,
    companyAddress: location || "Your City, Country",
    primaryColor: branding.branding.colors.primary,
    secondaryColor: branding.branding.colors.secondary,
    // Products section
    productsTitle: "Top Picks",
    productsSubtitle: "Hand-picked deals we think you'll love.",
    products: [
      {
        name: "Product Name One",
        price: "₪199",
        originalPrice: "₪299",
        image: `https://placehold.co/280x280/${secondary.replace('#', '')}/ffffff?text=Product+1`,
        url: "https://example.com/product-1",
      },
      {
        name: "Product Name Two",
        price: "₪149",
        originalPrice: "₪219",
        image: `https://placehold.co/280x280/${secondary.replace('#', '')}/ffffff?text=Product+2`,
        url: "https://example.com/product-2",
      },
    ] as Product[],
  };
};

const EditTemplatePage: NextPage = () => {
  const { appBridgeState } = useAppBridge();
  const router = useRouter();
  const templateId = router.query.id as string | undefined;
  const utils = trpcClient.useUtils();

  const isNewTemplate = !templateId || templateId === "new";

  // State for selected channel (for branding)
  const [selectedChannel, setSelectedChannel] = useState<string>("ils");
  const [brandingInitialized, setBrandingInitialized] = useState(false);

  // Fetch available channels using urql
  const [{ data: channelsData }] = useQuery<{ channels: Channel[] }>({
    query: ChannelsQuery,
    pause: !appBridgeState?.ready,
    requestPolicy: "cache-first",
  });

  // Fetch branding from Storefront Control
  const { data: brandingData, isLoading: isBrandingLoading } = trpcClient.template.getBranding.useQuery(
    { channelSlug: selectedChannel },
    {
      enabled: !!appBridgeState?.ready && isNewTemplate,
      staleTime: 60000,
    },
  );

  const { data: templateData, isLoading } = trpcClient.template.get.useQuery(
    { id: templateId! },
    {
      enabled: !!templateId && !isNewTemplate,
      staleTime: 30000, // Consider data fresh for 30 seconds
      refetchOnWindowFocus: true, // Refetch when window regains focus
      },
  );

  const { handleSubmit, control, reset, watch, setValue, getValues } = useForm({
    defaultValues: {
      id: templateId || "",
      name: "",
      subject: "",
      body: "",
      previewData: "{}",
    },
    resolver: zodResolver(isNewTemplate ? createTemplateInputSchema : updateTemplateInputSchema),
  });

  const template = watch("body");
  const subject = watch("subject");
  const previewData = watch("previewData");

  const [lastValidRenderedTemplate, setLastValidRenderedTemplate] = useState("");
  const [lastValidRenderedSubject, setLastValidRenderedSubject] = useState("");
  const [lastError, setLastError] = useState<Error | null>(null);
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);
  
  // Success/feedback messages
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [productSaveIndicator, setProductSaveIndicator] = useState<"saved" | "saving" | null>(null);

  // Set id when templateId is available (for editing)
  useEffect(() => {
    if (templateId && !isNewTemplate) {
      setValue("id", templateId);
    }
  }, [templateId, isNewTemplate, setValue]);

  // Update form when template loads (for editing existing templates)
  useEffect(() => {
    if (templateData?.template && !isNewTemplate) {
      const t = templateData.template;
      reset({
        id: t.id,
        name: t.name,
        subject: t.subject,
        body: t.body,
        previewData: t.previewData || "{}",
      });
    }
  }, [templateData, reset, isNewTemplate]);

  // Initialize form with default template using fetched branding for new templates
  useEffect(() => {
    if (isNewTemplate && router.isReady && brandingData?.branding && !brandingInitialized) {
      const branding = brandingData.branding;
      
      // Generate template with branding
      const defaultBody = generateDefaultTemplate(branding);
      const defaultSubject = generateDefaultSubject(branding);
      const defaultPayload = generatePayloadFromBranding(branding);
      const defaultPreviewData = JSON.stringify(defaultPayload, undefined, 2);
      
      reset({
        name: "New Promotional Template",
        subject: defaultSubject,
        body: defaultBody,
        previewData: defaultPreviewData,
      });
      
      setBrandingInitialized(true);
    }
  }, [isNewTemplate, router.isReady, brandingData, reset, brandingInitialized]);

  // Update template when channel changes (for new templates only)
  const handleChannelChange = (newChannel: string) => {
    setSelectedChannel(newChannel);
    setBrandingInitialized(false); // Reset to trigger re-initialization with new branding
  };

  const {
    mutate: fetchTemplatePreview,
    isLoading: isFetchingTemplatePreview,
    error: previewError,
  } = trpcClient.template.render.useMutation({
    onSuccess: (data) => {
      setLastError(null);

      if (data.renderedEmailBody) {
        setLastValidRenderedTemplate(data.renderedEmailBody);
      }
      if (data.renderedSubject) {
        setLastValidRenderedSubject(data.renderedSubject);
      }
    },
    onError: (err) => {
      setLastError(err instanceof Error ? err : new Error(err.message));
    },
  });

  const debouncedMutationVariables = useDebounce(
    { template, subject, previewData },
    PREVIEW_DEBOUNCE_DELAY,
  );

  const {
    template: debouncedTemplate,
    subject: debouncedSubject,
    previewData: debouncedPreviewData,
  } = debouncedMutationVariables;

  useEffect(() => {
    if (debouncedTemplate && debouncedSubject) {
      try {
        const payloadData = JSON.parse(debouncedPreviewData || "{}");
        fetchTemplatePreview({
          template: debouncedTemplate,
          subject: debouncedSubject,
          payload: payloadData,
        });
      } catch (error) {
        // Invalid JSON, skip preview
      }
    }
  }, [debouncedPreviewData, debouncedSubject, debouncedTemplate, fetchTemplatePreview]);

  const createMutation = trpcClient.template.create.useMutation({
    onSuccess: () => {
      // Show success message immediately
      setSaveMessage({ type: "success", text: "Template created successfully!" });
      
      // Invalidate cache in background (don't await)
      utils.template.list.invalidate();
      utils.template.get.invalidate();
      
      // Navigate after showing message
      setTimeout(() => {
        router.push("/templates");
      }, 1500);
    },
    onError: (error) => {
      setSaveMessage({ type: "error", text: error.message || "Failed to create template" });
      setTimeout(() => setSaveMessage(null), 5000);
    },
  });

  const updateMutation = trpcClient.template.update.useMutation({
    onSuccess: () => {
      // Show success message immediately
      setSaveMessage({ type: "success", text: "Template saved successfully!" });
      
      // Invalidate cache in background (don't await)
      utils.template.list.invalidate();
      utils.template.get.invalidate({ id: templateId! });
      
      // Navigate after showing message
      setTimeout(() => {
        router.push("/templates");
      }, 1500);
    },
    onError: (error) => {
      setSaveMessage({ type: "error", text: error.message || "Failed to save template" });
      setTimeout(() => setSaveMessage(null), 5000);
    },
  });

  const handleInsertVariable = (variable: string) => {
    // Use a fallback method that works in sandboxed iframes
    // Create a temporary textarea, copy from it, then remove it
    try {
      const textArea = document.createElement("textarea");
      textArea.value = variable;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // Use execCommand as fallback (works in iframes)
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopiedVariable(variable);
        setTimeout(() => setCopiedVariable(null), 2000);
      }
    } catch (err) {
      // If even fallback fails, just show the variable was selected
      setCopiedVariable(variable);
      setTimeout(() => setCopiedVariable(null), 2000);
    }
  };

  // Helper to parse preview data - uses getValues to always get current form value
  // (watch() can return stale data if multiple updates happen quickly)
  const getParsedPreviewData = (): Record<string, unknown> => {
    try {
      const currentValue = getValues("previewData");
      return JSON.parse(currentValue || "{}");
    } catch {
      return {};
    }
  };

  // Helper to update preview data - uses getValues to ensure we read latest value
  const updatePreviewDataField = (field: string, value: unknown) => {
    try {
      // Show saving indicator for product-related fields
      if (field === "products" || field === "productsTitle" || field === "productsSubtitle") {
        setProductSaveIndicator("saving");
      }
      
      // Always get the latest value from the form to avoid race conditions
      const currentValue = getValues("previewData");
      const current = JSON.parse(currentValue || "{}");
      const updated = { ...current, [field]: value };
      const newPreviewData = JSON.stringify(updated, undefined, 2);
      
      // Log for debugging
      console.log("[updatePreviewDataField]", {
        field,
        valueType: typeof value,
        isArray: Array.isArray(value),
        arrayLength: Array.isArray(value) ? value.length : undefined,
        newPreviewDataLength: newPreviewData.length,
      });
      
      // Use setValue to update the form field
      setValue("previewData", newPreviewData, { shouldDirty: true });
      
      // Show saved indicator briefly for product-related fields
      if (field === "products" || field === "productsTitle" || field === "productsSubtitle") {
        setTimeout(() => {
          setProductSaveIndicator("saved");
          setTimeout(() => setProductSaveIndicator(null), 1500);
        }, 300);
      }
    } catch (err) {
      console.error("Failed to update preview data:", err);
      setProductSaveIndicator(null);
    }
  };

  // Get products from preview data - use watched previewData for rendering
  // (so UI updates when previewData changes)
  const getProducts = (): Product[] => {
    try {
      const data = JSON.parse(previewData || "{}");
      return (data.products as Product[]) || [];
    } catch {
      return [];
    }
  };

  // Get products title/subtitle from preview data
  const getProductsTitle = (): string => {
    try {
      const data = JSON.parse(previewData || "{}");
      return (data.productsTitle as string) || "Top Picks";
    } catch {
      return "Top Picks";
    }
  };

  const getProductsSubtitle = (): string => {
    try {
      const data = JSON.parse(previewData || "{}");
      return (data.productsSubtitle as string) || "Hand-picked deals we think you'll love.";
    } catch {
      return "Hand-picked deals we think you'll love.";
    }
  };

  // Return null while App Bridge is initializing - this prevents race conditions
  if (!appBridgeState) {
    return null;
  }

  // Show loading while App Bridge is connecting
  if (!appBridgeState.ready) {
    return (
      <BasicLayout breadcrumbs={[{ name: "Templates" }, { name: isNewTemplate ? "New" : "Edit" }]}>
        <Text>Loading...</Text>
      </BasicLayout>
    );
  }

  if (isLoading && !isNewTemplate) {
    return (
      <BasicLayout breadcrumbs={[{ name: "Templates" }, { name: "Edit" }]}>
        <Text>Loading template...</Text>
      </BasicLayout>
    );
  }

  // Show loading while fetching branding for new templates
  if (isNewTemplate && isBrandingLoading) {
    return (
      <BasicLayout breadcrumbs={[{ name: "Templates" }, { name: "New" }]}>
        <Text>Loading branding from Storefront Control...</Text>
      </BasicLayout>
    );
  }

  if (appBridgeState.user?.permissions.includes("MANAGE_APPS") === false) {
    return (
      <BasicLayout breadcrumbs={[{ name: "Templates" }, { name: "Edit" }]}>
        <Text>You do not have permission to access this page.</Text>
      </BasicLayout>
    );
  }

  const currentError = lastError || previewError;

  return (
    <BasicLayout breadcrumbs={[{ name: "Templates", href: "/templates" }, { name: isNewTemplate ? "New" : "Edit" }]}>
      <form
        onSubmit={handleSubmit(
          (data) => {
            // Log submission data for debugging
            console.log("[Template Save] Form submitted successfully, calling mutation:", {
              isNewTemplate,
              id: data.id,
              name: data.name,
              subject: data.subject,
              bodyLength: data.body?.length,
              previewDataLength: data.previewData?.length,
              hasProducts: data.previewData ? JSON.parse(data.previewData).products?.length > 0 : false,
            });
            
            if (isNewTemplate) {
              console.log("[Template Save] Calling createMutation.mutate()");
              // Remove id from data for create
              const { id: _id, ...createData } = data;
              createMutation.mutate(createData);
            } else {
              console.log("[Template Save] Calling updateMutation.mutate() with id:", data.id);
              updateMutation.mutate(data);
            }
          },
          (errors) => {
            // Log validation errors
            console.error("[Template Save] Form validation failed:", errors);
            setSaveMessage({ type: "error", text: "Please fix the form errors before saving" });
            setTimeout(() => setSaveMessage(null), 5000);
          }
        )}
      >
        <Box display="flex" flexDirection="column" gap={defaultPadding}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Text size={10} fontWeight="bold">
              {isNewTemplate ? "Create Template" : "Edit Template"}
            </Text>
            <Box display="flex" gap={2} alignItems="center">
              {saveMessage && (
                <Box
                  padding={3}
                  paddingLeft={4}
                  paddingRight={4}
                  backgroundColor={saveMessage.type === "success" ? "success1" : "critical1"}
                  borderRadius={3}
                  display="flex"
                  alignItems="center"
                  gap={2}
                  style={{
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                    animation: "fadeIn 0.3s ease-in-out",
                  }}
                >
                  <Text size={4} fontWeight="bold" color={saveMessage.type === "success" ? "default1" : "critical2"}>
                    {saveMessage.type === "success" ? "✓" : "✕"} {saveMessage.text}
                  </Text>
                </Box>
              )}
              <Button variant="secondary" onClick={() => router.push("/templates")}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!!currentError || createMutation.isLoading || updateMutation.isLoading || !!saveMessage}
              >
                {(createMutation.isLoading || updateMutation.isLoading) ? "Saving..." : 
                 saveMessage?.type === "success" ? "Saved!" : "Save"}
              </Button>
            </Box>
          </Box>

          <Box display="grid" gridTemplateColumns={{ desktop: 4, mobile: 1 }} gap={defaultPadding}>
            <Box gridColumnStart="1" gridColumnEnd={{ desktop: "3", mobile: "2" }}>
              <Input control={control} name="name" label="Template Name" required />
            </Box>
            {isNewTemplate && channelsData?.channels && channelsData.channels.length > 0 && (
              <Box>
                <Text size={3} marginBottom={1}>Channel Branding</Text>
                <Box
                  as="select"
                  value={selectedChannel}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleChannelChange(e.target.value)}
                  padding={2}
                  borderRadius={2}
                  borderWidth={1}
                  borderStyle="solid"
                  borderColor="default1"
                  backgroundColor="default1"
                  width="100%"
                  style={{ height: "42px" }}
                >
                  {channelsData.channels.map((channel) => (
                    <option key={channel.slug} value={channel.slug}>
                      {channel.name} ({channel.slug})
                    </option>
                  ))}
                </Box>
                <Text size={2} color="default2" marginTop={1}>
                  Template colors and branding loaded from Storefront Control
                </Text>
              </Box>
            )}
          </Box>

          <Box display="grid" gridTemplateColumns={{ desktop: 3, mobile: 1 }} gap={defaultPadding}>
            <Input control={control} name="subject" label="Subject (Handlebars)" required />
          </Box>

          <Box display="grid" gridTemplateColumns={{ desktop: 5, mobile: 1 }} gap={defaultPadding}>
            <Box
              gridColumnStart={{ desktop: "1", mobile: "1" }}
              gridColumnEnd={{ desktop: "3", mobile: "6" }}
            >
              <Text size={5} fontWeight="bold" marginBottom={2}>
                MJML Template
              </Text>
              <Controller
                control={control}
                name="body"
                render={({ field: { value, onChange } }) => {
                  return (
                    <CodeEditor
                      initialTemplate={value || ""}
                      value={value || ""}
                      onChange={onChange}
                      language="xml"
                    />
                  );
                }}
              />
            </Box>
            <Box
              gridColumnStart={{ desktop: "3", mobile: "1" }}
              gridColumnEnd={{ desktop: "4", mobile: "6" }}
            >
              <Text size={5} fontWeight="bold" marginBottom={2}>
                Preview Data (JSON)
              </Text>
              <Controller
                control={control}
                name="previewData"
                render={({ field: { value, onChange } }) => (
                  <CodeEditor
                    initialTemplate={value || "{}"}
                    value={value || "{}"}
                    onChange={onChange}
                    language="json"
                  />
                )}
              />
            </Box>
            <Box
              gridColumnStart={{ desktop: "4", mobile: "1" }}
              gridColumnEnd={{ desktop: "6", mobile: "6" }}
              display="flex"
              flexDirection="column"
              gap={defaultPadding}
            >
              <Box>
                <Text size={5} fontWeight="bold" marginBottom={2}>
                  Preview
                </Text>
                {currentError ? (
                  <Box padding={3} backgroundColor="critical1" borderRadius={2}>
                    <Text color="critical2">
                      Error: {currentError instanceof Error ? currentError.message : "Unknown error"}
                    </Text>
                  </Box>
                ) : (
                  <TemplatePreview
                    subject={lastValidRenderedSubject}
                    template={lastValidRenderedTemplate}
                    isUpdating={isFetchingTemplatePreview}
                  />
                )}
              </Box>
              <Box>
                <VariablePicker onInsert={handleInsertVariable} copiedVariable={copiedVariable} />
              </Box>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={2}>
                  <Box />
                  {productSaveIndicator && (
                    <Box
                      padding={1}
                      paddingLeft={2}
                      paddingRight={2}
                      backgroundColor={productSaveIndicator === "saved" ? "success1" : "default2"}
                      borderRadius={2}
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      <Text size={2} color="default1">
                        {productSaveIndicator === "saving" ? "⏳ Updating..." : "✓ Updated"}
                      </Text>
                    </Box>
                  )}
                </Box>
                <ProductEditor
                  products={getProducts()}
                  productsTitle={getProductsTitle()}
                  productsSubtitle={getProductsSubtitle()}
                  onChange={(products) => updatePreviewDataField("products", products)}
                  onTitleChange={(title) => updatePreviewDataField("productsTitle", title)}
                  onSubtitleChange={(subtitle) => updatePreviewDataField("productsSubtitle", subtitle)}
                />
              </Box>
            </Box>
          </Box>

          <Box display="flex" justifyContent="flex-end" gap={2} alignItems="center">
            {currentError && (
              <Text size={3} color="critical1">
                Fix template errors before saving
              </Text>
            )}
            {saveMessage && (
              <Box
                padding={3}
                paddingLeft={4}
                paddingRight={4}
                backgroundColor={saveMessage.type === "success" ? "success1" : "critical1"}
                borderRadius={3}
                style={{
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                }}
              >
                <Text size={4} fontWeight="bold" color={saveMessage.type === "success" ? "default1" : "critical2"}>
                  {saveMessage.type === "success" ? "✓" : "✕"} {saveMessage.text}
                </Text>
              </Box>
            )}
            <Button 
              type="submit" 
              disabled={!!currentError || createMutation.isLoading || updateMutation.isLoading || !!saveMessage}
            >
              {(createMutation.isLoading || updateMutation.isLoading) ? "Saving..." : 
               saveMessage?.type === "success" ? "Saved!" : "Save"}
            </Button>
          </Box>
        </Box>
      </form>
    </BasicLayout>
  );
};

// Wrap with GraphQL provider for channel query
const EditTemplatePageWithProvider: NextPage = () => (
  <GraphQLProvider>
    <EditTemplatePage />
  </GraphQLProvider>
);

export default EditTemplatePageWithProvider;
