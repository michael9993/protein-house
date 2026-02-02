import React from "react";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useForm, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";

import { AppLayout } from "@/modules/ui/app-layout";
import { SectionCard } from "@/modules/ui/section-card";
import { StickySaveBar } from "@/modules/ui/sticky-save-bar";
import { SimpleCheckbox } from "@/modules/ui/simple-checkbox";
import { trpcClient } from "@/modules/trpc/trpc-client";
import { PagesSchema } from "@/modules/config/schema";
import type { StorefrontConfig } from "@/modules/config/schema";

type PagesFormData = StorefrontConfig["pages"];

interface PageToggleProps {
  label: string;
  description: string;
  name: keyof PagesFormData;
  control: Control<PagesFormData>;
}

function PageToggle({ label, description, name, control }: PageToggleProps) {
  return <SimpleCheckbox name={name} control={control} label={label} description={description} />;
}

const PagesPage: NextPage = () => {
  const router = useRouter();
  const { channelSlug } = router.query as { channelSlug: string };
  const { appBridgeState } = useAppBridge();

  const {
    data: config,
    isLoading,
    refetch,
  } = trpcClient.config.getConfig.useQuery(
    { channelSlug },
    { enabled: !!channelSlug && !!appBridgeState?.ready },
  );

  const updateMutation = trpcClient.config.updateSection.useMutation({
    onSuccess: () => refetch(),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<PagesFormData>({
    resolver: zodResolver(PagesSchema),
  });

  useEffect(() => {
    if (config?.pages) {
      reset(config.pages);
    }
  }, [config, reset]);

  const onSubmit = async (data: PagesFormData) => {
    await updateMutation.mutateAsync({ channelSlug, section: "pages", data });
  };

  if (!appBridgeState?.ready || isLoading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}
      >
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <AppLayout channelSlug={channelSlug} channelName={config?.store.name} activeTab="pages">
      <form onSubmit={handleSubmit(onSubmit)}>
        <SectionCard
          id="pages-info"
          title="Information Pages"
          description="Enable or disable static content pages"
          keywords={["about", "contact", "faq", "blog"]}
          icon="📄"
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <PageToggle
              label="About Us"
              description="Company information and story"
              name="aboutUs"
              control={control}
            />
            <PageToggle
              label="Contact"
              description="Contact form and information"
              name="contact"
              control={control}
            />
            <PageToggle
              label="FAQ"
              description="Frequently asked questions"
              name="faq"
              control={control}
            />
            <PageToggle
              label="Blog"
              description="News and articles section"
              name="blog"
              control={control}
            />
          </div>
        </SectionCard>

        <SectionCard
          id="pages-legal"
          title="Legal Pages"
          description="Required legal and policy pages"
          keywords={["privacy", "terms", "returns", "shipping"]}
          icon="⚖️"
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <PageToggle
              label="Privacy Policy"
              description="Data privacy information"
              name="privacyPolicy"
              control={control}
            />
            <PageToggle
              label="Terms of Service"
              description="Terms and conditions"
              name="termsOfService"
              control={control}
            />
            <PageToggle
              label="Shipping Policy"
              description="Shipping information"
              name="shippingPolicy"
              control={control}
            />
            <PageToggle
              label="Return Policy"
              description="Returns and refunds"
              name="returnPolicy"
              control={control}
            />
          </div>
        </SectionCard>

        <SectionCard
          id="pages-auth"
          title="Authentication Pages"
          description="User account and authentication pages"
          keywords={["reset", "password", "verify", "email", "auth", "forgot"]}
          icon="🔐"
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <PageToggle
              label="Forgot Password"
              description="Request password reset link via email"
              name="forgotPassword"
              control={control}
            />
            <PageToggle
              label="Reset Password"
              description="Password reset and recovery page"
              name="resetPassword"
              control={control}
            />
            <PageToggle
              label="Verify Email"
              description="Request a new confirmation email (resend)"
              name="verifyEmail"
              control={control}
            />
            <PageToggle
              label="Confirm Email"
              description="Page where users land when they click the confirmation link"
              name="confirmEmail"
              control={control}
            />
          </div>
        </SectionCard>

        <StickySaveBar
          isDirty={isDirty}
          isLoading={updateMutation.isLoading}
          isSuccess={updateMutation.isSuccess}
          isError={updateMutation.isError}
          onReset={() => reset(config?.pages)}
          onSubmit={handleSubmit(onSubmit)}
        />
      </form>
    </AppLayout>
  );
};

export async function getServerSideProps() {
  return { props: {} };
}

export default PagesPage;
