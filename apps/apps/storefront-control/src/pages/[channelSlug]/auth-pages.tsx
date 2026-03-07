import { useRouter } from "next/router";
import { z } from "zod";
import { FileText, KeyRound } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { SaveBar } from "@/components/layout/SaveBar";
import { FormField } from "@/components/forms/FormField";
import { FormSection } from "@/components/forms/FormSection";
import { FeatureCard } from "@/components/shared/FeatureCard";
import { FieldGroup } from "@/components/shared/FieldGroup";
import { ComponentBlock } from "@/components/shared/ComponentBlock";
import { LoadingState } from "@/components/shared/LoadingState";
import { useConfigPage } from "@/hooks/useConfigPage";
import { FeaturesSchema, ContentSchema } from "@/modules/config/schema";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const AuthFormSchema = z.object({
  features: FeaturesSchema,
  content: ContentSchema,
});

type AuthFormData = z.infer<typeof AuthFormSchema>;

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function AuthPagesPage() {
  const router = useRouter();

  const { config, isNotReady, form, onSubmit, saveStatus } = useConfigPage({
    schema: AuthFormSchema,
    sections: ["features", "content"],
    extractFormData: (c) => ({
      features: c.features,
      content: c.content,
    }),
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = form;

  if (isNotReady) {
    return (
      <AppShell channelSlug="" activePage="auth-pages" title="Auth Pages">
        <LoadingState />
      </AppShell>
    );
  }

  return (
    <AppShell
      channelSlug={router.query.channelSlug as string}
      channelName={config?.store.name}
      activePage="auth-pages"
      title="Auth Pages"
      description="Sign in, sign up, password reset text and features"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
        <ComponentBlock
          icon={KeyRound}
          title="Auth Features"
          description="Feature toggles for authentication"
          defaultExpanded
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FeatureCard name="features.socialLogin" control={control} title="Social Login" description="Sign in with Google/Facebook" icon={<KeyRound className="h-5 w-5" />} />
            <FeatureCard name="features.guestCheckout" control={control} title="Guest Checkout" description="Allow checkout without account" icon={<KeyRound className="h-5 w-5" />} />
          </div>
        </ComponentBlock>

        <ComponentBlock
          icon={FileText}
          title="Sign In Text"
          description="Sign-in page labels and messages"
          defaultExpanded
        >
          <FormSection title="Sign In" description="Sign-in page text">
            <FieldGroup columns={2}>
              <FormField<AuthFormData> label="Sign In Title" name="content.account.signInTitle" register={register} errors={errors} placeholder="Sign In" />
              <FormField<AuthFormData> label="Sign In Subtitle" name="content.account.signInSubtitle" register={register} errors={errors} />
              <FormField<AuthFormData> label="Email Label" name="content.account.emailLabel" register={register} errors={errors} placeholder="Email" />
              <FormField<AuthFormData> label="Password Label" name="content.account.passwordLabel" register={register} errors={errors} placeholder="Password" />
              <FormField<AuthFormData> label="Sign In Button" name="content.account.signInButton" register={register} errors={errors} placeholder="Sign In" />
              <FormField<AuthFormData> label="Forgot Password Link" name="content.account.forgotPasswordLink" register={register} errors={errors} placeholder="Forgot Password?" />
              <FormField<AuthFormData> label="Or Continue With" name="content.account.orContinueWith" register={register} errors={errors} placeholder="Or continue with" />
              <FormField<AuthFormData> label="Why Create Account" name="content.account.whyCreateAccount" register={register} errors={errors} placeholder="Why create an account?" />
            </FieldGroup>
          </FormSection>
        </ComponentBlock>

        <ComponentBlock
          icon={FileText}
          title="Sign Up Text"
          description="Registration page labels"
          defaultExpanded={false}
        >
          <FormSection title="Sign Up" description="Registration page text">
            <FieldGroup columns={2}>
              <FormField<AuthFormData> label="Sign Up Title" name="content.account.signUpTitle" register={register} errors={errors} placeholder="Create Account" />
              <FormField<AuthFormData> label="Sign Up Subtitle" name="content.account.signUpSubtitle" register={register} errors={errors} />
              <FormField<AuthFormData> label="Sign Up Button" name="content.account.signUpButton" register={register} errors={errors} placeholder="Create Account" />
              <FormField<AuthFormData> label="Switch to Sign In" name="content.account.switchToSignIn" register={register} errors={errors} placeholder="Already have an account? Sign in" />
              <FormField<AuthFormData> label="Create Account Button" name="content.account.createAccountButton" register={register} errors={errors} placeholder="Create Account" />
            </FieldGroup>
          </FormSection>
        </ComponentBlock>

        <ComponentBlock
          icon={FileText}
          title="Forgot Password Text"
          description="Password reset page text"
          defaultExpanded={false}
        >
          <FormSection title="Forgot Password" description="Password reset text">
            <FieldGroup columns={2}>
              <FormField<AuthFormData> label="Title" name="content.account.forgotPasswordTitle" register={register} errors={errors} placeholder="Forgot Password" />
              <FormField<AuthFormData> label="Subtitle" name="content.account.forgotPasswordSubtitle" register={register} errors={errors} />
              <FormField<AuthFormData> label="Send Button" name="content.account.sendResetLinkButton" register={register} errors={errors} placeholder="Send Reset Link" />
              <FormField<AuthFormData> label="Back to Sign In" name="content.account.backToSignIn" register={register} errors={errors} placeholder="Back to Sign In" />
            </FieldGroup>
          </FormSection>
        </ComponentBlock>

        <SaveBar
          isDirty={isDirty}
          saveStatus={saveStatus}
          onReset={() => {
            if (config) {
              form.reset({
                features: config.features,
                content: config.content,
              });
            }
          }}
          onSubmit={handleSubmit(onSubmit)}
        />
      </form>
    </AppShell>
  );
}

export default AuthPagesPage;
