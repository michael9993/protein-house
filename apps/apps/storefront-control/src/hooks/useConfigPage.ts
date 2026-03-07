import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import { useForm, type UseFormReturn, type FieldValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppBridge } from "@saleor/app-sdk/app-bridge";
import { type z } from "zod";

import { trpcClient } from "@/modules/trpc/trpc-client";
import type { StorefrontConfig } from "@/modules/config/schema";

type SaveStatus = "idle" | "saving" | "success" | "error";

interface UseConfigPageOptions<TSchema extends z.ZodType> {
  schema: TSchema;
  sections: string[];
  extractFormData: (config: StorefrontConfig) => z.infer<TSchema>;
}

interface UseConfigPageReturn<T extends FieldValues> {
  config: StorefrontConfig | undefined;
  isLoading: boolean;
  isNotReady: boolean;
  form: UseFormReturn<T>;
  onSubmit: (data: T) => Promise<void>;
  saveStatus: SaveStatus;
  channelSlug: string;
  refetch: () => void;
}

export function useConfigPage<TSchema extends z.ZodType<FieldValues>>(
  options: UseConfigPageOptions<TSchema>
): UseConfigPageReturn<z.infer<TSchema>> {
  const { schema, sections, extractFormData } = options;

  const router = useRouter();
  const channelSlug = router.query.channelSlug as string;
  const { appBridgeState } = useAppBridge();

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [formReady, setFormReady] = useState(false);

  // Store extractFormData in a ref so it's always current but doesn't
  // trigger the useEffect. Each page passes an inline arrow function
  // that's a new reference every render — including it in deps caused
  // form.reset() on every render, reverting all user changes instantly.
  const extractRef = useRef(extractFormData);
  extractRef.current = extractFormData;

  const utils = trpcClient.useUtils();

  const {
    data: config,
    isLoading,
    refetch,
  } = trpcClient.config.getConfig.useQuery(
    { channelSlug },
    { enabled: !!channelSlug && !!appBridgeState?.ready }
  );

  const updateSectionMutation = trpcClient.config.updateSection.useMutation();
  const updateMultipleSectionsMutation = trpcClient.config.updateMultipleSections.useMutation();

  const form = useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
  });

  // Reset form when config loads or changes (initial fetch + post-save refetch).
  // formReady gate prevents rendering before form.reset(), avoiding
  // uncontrolled → controlled warnings on Radix UI Switch/Select.
  useEffect(() => {
    if (config) {
      form.reset(extractRef.current(config));
      if (!formReady) setFormReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const onSubmit = useCallback(
    async (data: z.infer<TSchema>) => {
      setSaveStatus("saving");

      try {
        if (sections.length === 1) {
          const section = sections[0];
          await updateSectionMutation.mutateAsync({
            channelSlug,
            section: section as any,
            data: (data as any)[section],
          });
        } else {
          const updates: Record<string, unknown> = {};
          for (const section of sections) {
            updates[section] = (data as any)[section];
          }
          await updateMultipleSectionsMutation.mutateAsync({
            channelSlug,
            updates,
          });
        }

        // Refetch config from server. The useEffect on config change will
        // call form.reset(extractFormData(freshConfig)), properly re-transforming
        // data (e.g., re-nesting dot-keys for component designer).
        // This is better than form.reset(data) which uses Zod's preprocessed
        // output that may have a different shape than extractFormData produces.
        await refetch();
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } catch {
        setSaveStatus("error");
      }
    },
    [
      channelSlug,
      sections,
      updateSectionMutation,
      updateMultipleSectionsMutation,
      refetch,
      form,
    ]
  );

  const isNotReady = !appBridgeState?.ready || isLoading || !formReady;

  return {
    config,
    isLoading,
    isNotReady,
    form,
    onSubmit,
    saveStatus,
    channelSlug,
    refetch,
  };
}
