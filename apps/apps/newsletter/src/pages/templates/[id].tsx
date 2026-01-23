import { zodResolver } from "@hookform/resolvers/zod";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { Box, Button, Text } from "@saleor/macaw-ui";
import { Input } from "@saleor/react-hook-form-macaw";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useDebounce } from "usehooks-ts";

import { BasicLayout } from "../../components/basic-layout";
import { CodeEditor } from "../../components/code-editor";
import { TemplatePreview } from "../../components/template-preview";
import { defaultPadding } from "../../components/ui-defaults";
import { trpcClient } from "../../modules/trpc/trpc-client";
import { VariablePicker } from "../../modules/newsletter/templates/variable-picker";
import { createTemplateInputSchema, updateTemplateInputSchema } from "../../modules/newsletter/templates/template-schema";

const PREVIEW_DEBOUNCE_DELAY = 500;

const EditTemplatePage: NextPage = () => {
  const { appBridgeState } = useAppBridge();
  const router = useRouter();
  const templateId = router.query.id as string | undefined;
  const utils = trpcClient.useUtils();

  const isNewTemplate = !templateId || templateId === "new";

  const { data: templateData, isLoading } = trpcClient.template.get.useQuery(
    { id: templateId! },
    {
      enabled: !!templateId && !isNewTemplate,
    },
  );

  const { handleSubmit, control, reset, watch } = useForm({
    defaultValues: {
      name: "",
      subject: "",
      body: "",
    },
    resolver: zodResolver(isNewTemplate ? createTemplateInputSchema : updateTemplateInputSchema),
  });

  const template = watch("body");
  const subject = watch("subject");

  const [lastValidRenderedTemplate, setLastValidRenderedTemplate] = useState("");
  const [lastValidRenderedSubject, setLastValidRenderedSubject] = useState("");
  const [lastError, setLastError] = useState<Error | null>(null);
  const [payload, setPayload] = useState<string>(
    JSON.stringify(
      {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        unsubscribeUrl: "https://example.com/unsubscribe/token123",
        companyName: "My Store",
        companyEmail: "support@mystore.com",
        companyWebsite: "https://mystore.com",
        primaryColor: "#2563EB",
        secondaryColor: "#1F2937",
      },
      undefined,
      2,
    ),
  );

  // Update form when template loads
  useEffect(() => {
    if (templateData?.template && !isNewTemplate) {
      const t = templateData.template;
      reset({
        name: t.name,
        subject: t.subject,
        body: t.body,
      });
    }
  }, [templateData, reset, isNewTemplate]);

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
      setLastError(err);
    },
  });

  const debouncedMutationVariables = useDebounce(
    { template, subject, payload },
    PREVIEW_DEBOUNCE_DELAY,
  );

  const {
    template: debouncedTemplate,
    subject: debouncedSubject,
    payload: debouncedPayload,
  } = debouncedMutationVariables;

  useEffect(() => {
    if (debouncedTemplate && debouncedSubject) {
      try {
        const payloadData = JSON.parse(debouncedPayload);
        fetchTemplatePreview({
          template: debouncedTemplate,
          subject: debouncedSubject,
          payload: payloadData,
        });
      } catch (error) {
        // Invalid JSON, skip preview
      }
    }
  }, [debouncedPayload, debouncedSubject, debouncedTemplate, fetchTemplatePreview]);

  const createMutation = trpcClient.template.create.useMutation({
    onSuccess: async () => {
      await utils.template.list.invalidate();
      router.push("/templates");
    },
  });

  const updateMutation = trpcClient.template.update.useMutation({
    onSuccess: async () => {
      await utils.template.list.invalidate();
      router.push("/templates");
    },
  });

  const handleInsertVariable = (variable: string) => {
    // This would need to be integrated with the code editor
    // For now, we'll show an alert
    alert(`Insert ${variable} at cursor position (editor integration needed)`);
  };

  const handleInsertImage = (imageUrl: string) => {
    const imageTag = `<mj-image src="${imageUrl}" alt="Image" />`;
    alert(`Insert ${imageTag} at cursor position (editor integration needed)`);
  };

  if (!appBridgeState?.ready) {
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
        onSubmit={handleSubmit((data) => {
          if (isNewTemplate) {
            createMutation.mutate(data);
          } else {
            updateMutation.mutate({ ...data, id: templateId! });
          }
        })}
      >
        <Box display="flex" flexDirection="column" gap={defaultPadding}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Text size={10} fontWeight="bold">
              {isNewTemplate ? "Create Template" : "Edit Template"}
            </Text>
            <Box display="flex" gap={2}>
              <Button variant="secondary" onClick={() => router.push("/templates")}>
                Cancel
              </Button>
              <Button type="submit" disabled={!!currentError}>
                Save
              </Button>
            </Box>
          </Box>

          <Box display="grid" gridTemplateColumns={{ desktop: 3, mobile: 1 }} gap={defaultPadding}>
            <Input control={control} name="name" label="Template Name" required />
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
              <CodeEditor
                initialTemplate={payload}
                value={payload}
                onChange={setPayload}
                language="json"
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
                <VariablePicker onInsert={handleInsertVariable} />
              </Box>
            </Box>
          </Box>

          <Box display="flex" justifyContent="flex-end" gap={2} alignItems="center">
            {currentError && (
              <Text size={3} color="critical1">
                Fix template errors before saving
              </Text>
            )}
            <Button type="submit" disabled={!!currentError}>
              Save
            </Button>
          </Box>
        </Box>
      </form>
    </BasicLayout>
  );
};

export default EditTemplatePage;
