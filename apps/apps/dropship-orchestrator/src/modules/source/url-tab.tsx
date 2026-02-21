import { useState, useCallback } from "react";

import { Box, Text, Button } from "@/components/ui/primitives";
import { trpcClient } from "@/modules/trpc/trpc-client";

import type { SourcedProduct } from "./types";
import { labelStyle, textareaStyle } from "./types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface UrlTabProps {
  defaults: {
    type: string;
    category: string;
    gender: string;
    collections: string;
    country: string;
  };
  onProductsFetched: (
    products: SourcedProduct[],
    errors: Array<{ pid: string; error: string }>,
  ) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UrlTab({ defaults, onProductsFetched }: UrlTabProps) {
  const [urlText, setUrlText] = useState("");

  const fetchMutation = trpcClient.source.fetchProducts.useMutation({
    onSuccess: (data) => {
      const sourced: SourcedProduct[] = data.products.map((p) => ({
        ...p,
        variants: p.variants.map((v) => ({
          ...v,
          shippingCost: null,
          shippingCarrier: "",
          shippingDays: "",
        })),
        editName: p.name,
        editType: defaults.type,
        editCategory: defaults.category,
        editCollections: defaults.collections,
        editGender: defaults.gender,
        shippingCost: null,
        shippingCarrier: "",
        shippingDays: "",
        showVariants: false,
      }));
      onProductsFetched(sourced, data.errors);
      setUrlText("");
    },
  });

  const handleFetch = useCallback(() => {
    const urls = urlText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (urls.length === 0) return;
    fetchMutation.mutate({ urls });
  }, [urlText, fetchMutation]);

  return (
    <Box
      padding={5}
      borderRadius={4}
      borderWidth={1}
      borderStyle="solid"
      borderColor="default1"
      display="flex"
      flexDirection="column"
      gap={4}
    >
      <Box>
        <label style={labelStyle}>
          CJ Product URLs, PIDs, UUIDs, or SKUs (one per line)
        </label>
        <textarea
          style={textareaStyle}
          value={urlText}
          onChange={(e) => setUrlText(e.target.value)}
          placeholder={"https://cjdropshipping.com/product/detail/1005006839284893.html\n1005006839284893\n77501FB4-7146-452E-9889-CDF41697E5CF\nCJJSBGBG01517"}
        />
      </Box>

      <Box display="flex" gap={3} alignItems="center">
        <Button
          variant="primary"
          onClick={handleFetch}
          disabled={fetchMutation.isLoading || !urlText.trim()}
        >
          {fetchMutation.isLoading ? "Fetching..." : "Fetch from CJ"}
        </Button>
        <Text color="default2" variant="caption">
          Paste product URLs or IDs, one per line
        </Text>
      </Box>

      {/* Error Display */}
      {fetchMutation.error && (
        <Box padding={4} borderRadius={4} backgroundColor="critical1">
          <Text color="critical1" variant="bodyStrong">Error</Text>
          <Text>{fetchMutation.error.message}</Text>
        </Box>
      )}
    </Box>
  );
}
