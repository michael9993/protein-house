import { Box, Button, Text } from "@saleor/macaw-ui";
import { useState } from "react";

interface Variable {
  name: string;
  description: string;
  example: string;
  category: "user" | "system" | "branding";
}

const AVAILABLE_VARIABLES: Variable[] = [
  // User-specific variables
  {
    name: "{{firstName}}",
    description: "Subscriber's first name",
    example: "John",
    category: "user",
  },
  {
    name: "{{lastName}}",
    description: "Subscriber's last name",
    example: "Doe",
    category: "user",
  },
  {
    name: "{{email}}",
    description: "Subscriber's email address",
    example: "john.doe@example.com",
    category: "user",
  },
  // System variables
  {
    name: "{{unsubscribeUrl}}",
    description: "Unique unsubscribe URL for this subscriber",
    example: "https://example.com/unsubscribe/token",
    category: "system",
  },
  {
    name: "{{companyName}}",
    description: "Company name from storefront-control",
    example: "My Store",
    category: "branding",
  },
  {
    name: "{{companyEmail}}",
    description: "Company email from storefront-control",
    example: "support@mystore.com",
    category: "branding",
  },
  {
    name: "{{companyWebsite}}",
    description: "Company website from storefront-control",
    example: "https://mystore.com",
    category: "branding",
  },
  {
    name: "{{primaryColor}}",
    description: "Primary brand color from storefront-control",
    example: "#2563EB",
    category: "branding",
  },
  {
    name: "{{secondaryColor}}",
    description: "Secondary brand color from storefront-control",
    example: "#1F2937",
    category: "branding",
  },
];

interface VariablePickerProps {
  onInsert: (variable: string) => void;
}

export const VariablePicker = ({ onInsert }: VariablePickerProps) => {
  const [selectedCategory, setSelectedCategory] = useState<"user" | "system" | "branding" | "all">("all");

  const filteredVariables =
    selectedCategory === "all"
      ? AVAILABLE_VARIABLES
      : AVAILABLE_VARIABLES.filter((v) => v.category === selectedCategory);

  return (
    <Box>
      <Text as="h3" variant="heading" marginBottom={3}>
        Available Variables
      </Text>

      <Box display="flex" gap={2} marginBottom={4} flexWrap="wrap">
        <Button
          variant={selectedCategory === "all" ? "primary" : "secondary"}
          size="small"
          onClick={() => setSelectedCategory("all")}
        >
          All
        </Button>
        <Button
          variant={selectedCategory === "user" ? "primary" : "secondary"}
          size="small"
          onClick={() => setSelectedCategory("user")}
        >
          User
        </Button>
        <Button
          variant={selectedCategory === "system" ? "primary" : "secondary"}
          size="small"
          onClick={() => setSelectedCategory("system")}
        >
          System
        </Button>
        <Button
          variant={selectedCategory === "branding" ? "primary" : "secondary"}
          size="small"
          onClick={() => setSelectedCategory("branding")}
        >
          Branding
        </Button>
      </Box>

      <Box display="grid" gap={2}>
        {filteredVariables.map((variable) => (
          <Box
            key={variable.name}
            padding={3}
            borderWidth={1}
            borderStyle="solid"
            borderColor="default1"
            borderRadius={2}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box>
              <Text fontWeight="bold" marginBottom={1}>
                {variable.name}
              </Text>
              <Text size={2} color="default2" marginBottom={1}>
                {variable.description}
              </Text>
              <Text size={1} color="default2">
                Example: {variable.example}
              </Text>
            </Box>
            <Button variant="secondary" size="small" onClick={() => onInsert(variable.name)}>
              Insert
            </Button>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
