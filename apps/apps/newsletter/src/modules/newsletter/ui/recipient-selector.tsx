import { Box, Button, Input as MacawInput, Select, Text } from "@saleor/macaw-ui";
import { Controller, Control, useWatch } from "react-hook-form";

import { defaultPadding } from "../../../components/ui-defaults";
import { SubscriberPicker } from "./subscriber-picker";

interface RecipientSelectorProps {
  control: Control<any>;
  availableSubscribers?: Array<{ id: string; email: string }>;
}

export const RecipientSelector = ({ control, availableSubscribers = [] }: RecipientSelectorProps) => {
  // Use useWatch to get selectionType and isActive outside of Controller render
  // Guard against null control
  const selectionType = useWatch({
    control: control || ({} as any),
    name: "recipientFilter.selectionType",
    defaultValue: "all",
  });

  const isActiveValue = useWatch({
    control: control || ({} as any),
    name: "recipientFilter.isActive",
    defaultValue: undefined,
  });

  if (!control) {
    return <Text color="default2">Loading...</Text>;
  }

  return (
    <Box display="flex" flexDirection="column" gap={defaultPadding}>
      <Controller
        control={control}
        name="recipientFilter.selectionType"
        render={({ field: { onChange, value } }) => (
          <Select
            label="Recipient Selection"
            options={[
              { value: "all", label: "All Matching Subscribers" },
              { value: "random", label: "Random Selection" },
              { value: "newest", label: "Newest Subscribers" },
              { value: "oldest", label: "Oldest Subscribers" },
              { value: "selected", label: "Selected Subscribers" },
            ]}
            value={value || "all"}
            onChange={(val) => onChange(val as string)}
          />
        )}
      />

      {selectionType === "all" ? null : selectionType === "selected" ? (
        <Box>
          <Text size={2} color="default2" marginBottom={2}>
            Select specific subscribers from the list below
          </Text>
          <SubscriberPicker
            control={control}
            filter={{
              isActive: isActiveValue === true ? true : isActiveValue === false ? false : undefined,
            }}
          />
        </Box>
      ) : (
        <Controller
          control={control}
          name="recipientFilter.limit"
          defaultValue={undefined}
          render={({ field: { onChange, value, ...field } }) => (
            <MacawInput
              {...field}
              value={value ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                onChange(val === "" ? undefined : Number(val));
              }}
              label="Number of Recipients"
              type="number"
              min={1}
              helperText={`Select ${selectionType === "random" ? "random" : selectionType === "newest" ? "newest" : "oldest"} subscribers`}
            />
          )}
        />
      )}

      <Box>
        <Text size={2} color="default2" marginBottom={2}>
          Additional Filters
        </Text>
        <Box display="grid" gridTemplateColumns={{ desktop: 2, mobile: 1 }} gap={defaultPadding}>
          <Controller
            control={control}
            name="recipientFilter.isActive"
            render={({ field: { onChange, value } }) => (
              <Select
                label="Subscriber Status"
                options={[
                  { value: "all", label: "All" },
                  { value: "true", label: "Active Only" },
                  { value: "false", label: "Inactive Only" },
                ]}
                value={value === true ? "true" : value === false ? "false" : "all"}
                onChange={(val) => onChange(val === "all" ? undefined : val === "true")}
              />
            )}
          />
        </Box>
      </Box>
    </Box>
  );
};
